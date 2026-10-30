import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { registrationHttpTests } from '../registration/http-postgres.mjs';

const password = 'DeleteFixture123';
const digest = cookie => createHash('sha256').update(cookie.slice(cookie.indexOf('=') + 1)).digest();

// Every account/trigger/lock below belongs exclusively to the disposable fixture.
// The existing fixture refuses persistent DB names and suppresses raw diagnostics.
async function fixture(t, config, admin, label, run) {
  return registrationHttpTests(t, config, admin, 'admin-delete-' + label, async origin => {
    const ids = [], accounts = []; let sequence = 0, seed;
    const login = email => fetch(origin + '/api/auth/login', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000),
    });
    const del = (id, cookie, headers = {}, suffix = '', body) => fetch(origin + '/api/users/' + id + suffix, {
      method: 'DELETE', headers: { origin, ...(cookie ? { cookie } : {}), ...headers },
      ...(body === undefined ? {} : { body }), signal: AbortSignal.timeout(15000),
    });
    const getSession = cookie => fetch(origin + '/api/auth/session', { headers: { cookie }, signal: AbortSignal.timeout(15000) });
    const check = async (response, status, code) => {
      assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      if (status === 204) { assert.equal(await response.text(), ''); assert.equal(response.headers.get('set-cookie'), null); }
      else if (code) assert.deepEqual(await response.json(), { error: code });
      return response;
    };
    const account = async (role = 'user', sessionCount = 1) => {
      const id = randomUUID(), email = `delete-${label}-${++sequence}@example.test`;
      const inserted = await admin.query(`INSERT INTO imobilead.users(id,name,email,password_hash,role,city,state,country)
        SELECT $1,$2,$3,password_hash,$4,city,state,country FROM imobilead.users WHERE id=$5 RETURNING id`, [id, 'Delete Fixture', email, role, seed]);
      assert.equal(inserted.rowCount, 1); ids.push(id);
      const cookies = [];
      for (let n = 0; n < sessionCount; n++) {
        const response = await login(email); assert.equal(response.status, 200);
        const header = response.headers.get('set-cookie'); assert.match(header, /; HttpOnly; SameSite=Lax/);
        cookies.push(header.split(';')[0]);
      }
      const value = { id, email, cookies, cookie: cookies[0], role }; accounts.push(value); return value;
    };
    const counts = async id => (await admin.query(`SELECT
      (SELECT count(*)::int FROM imobilead.users WHERE id=$1) AS users,
      (SELECT count(*)::int FROM imobilead.sessions WHERE user_id=$1) AS sessions`, [id])).rows[0];
    async function waitForLock(queryPart = 'FOR UPDATE') {
      let observed = false;
      for (let n = 0; n < 100; n++) {
        await admin.query('SELECT pg_stat_clear_snapshot()');
        const result = await admin.query(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity
          WHERE datname=current_database() AND usename=$1 AND wait_event_type='Lock'
          AND position($2 in query)>0) AS waiting`, [config.user, queryPart]);
        if (result.rows[0].waiting) { observed = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.equal(observed, true, 'DISPOSABLE_HTTP_REQUEST_OBSERVED_WAITING_FOR_LOCK');
    }
    async function whileTargetLocked(target, invoke, change, queryPart) {
      let pending;
      await admin.query('BEGIN');
      try {
        await admin.query('SELECT id FROM imobilead.users WHERE id=$1 FOR UPDATE', [target.id]);
        pending = invoke();
        await waitForLock(queryPart);
        await change();
        await admin.query('COMMIT');
        return await pending;
      } finally {
        await admin.query('ROLLBACK');
        if (pending) await pending;
      }
    }
    try {
      const response = await fetch(origin + '/api/users', { method: 'POST', headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Delete Seed Fixture', email: `delete-seed-${label}@example.test`, password, passwordConfirmation: password, city: 'Fixture City', state: 'Region', country: 'Country' }), signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 201); seed = (await response.json()).user.id; ids.push(seed);
      await run({ origin, seed, account, accounts, login, del, getSession, check, counts, waitForLock, whileTargetLocked });
    } finally {
      await admin.query('ROLLBACK');
      await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[])', [ids]);
      assert.equal((await admin.query('SELECT count(*)::int AS n FROM imobilead.users WHERE id=ANY($1::uuid[])', [ids])).rows[0].n, 0);
    }
  });
}

export async function adminDeleteHttpTests(t, config, admin) {
  await fixture(t, config, admin, 'contract', async ({ origin, account, del, getSession, check, counts }) => {
    const actor = await account('admin'), otherAdmin = await account('admin');
    const ordinary = await account(), target = await account('user', 3), survivor = await account();
    await t.test('admin delete HTTP/PG: 401 and uniform 403 before target UUID validation/existence', async () => {
      for (const cookie of [undefined, 'imobilead_session=bad', 'imobilead_session=' + 'A'.repeat(43)]) await check(await del(target.id, cookie), 401, 'UNAUTHENTICATED');
      for (const id of [target.id, randomUUID(), 'bad']) await check(await del(id, ordinary.cookie, { 'x-role': 'admin', 'x-user-id': actor.id }), 403, 'FORBIDDEN');
      assert.deepEqual(await counts(target.id), { users: 1, sessions: 3 });
    });
    await t.test('admin delete HTTP/PG: admin UUID validation, self/admin protection and missing target', async () => {
      await check(await del('bad', actor.cookie), 400, 'INVALID_ID');
      await check(await del(actor.id, actor.cookie), 409, 'SELF_DELETE_FORBIDDEN');
      await check(await del(otherAdmin.id, actor.cookie), 409, 'ADMIN_DELETE_FORBIDDEN');
      await check(await del(randomUUID(), actor.cookie), 404, 'USER_NOT_FOUND');
      assert.deepEqual(await counts(actor.id), { users: 1, sessions: 1 });
      assert.deepEqual(await counts(otherAdmin.id), { users: 1, sessions: 1 });
    });
    await t.test('admin delete HTTP/PG: strict origin, Fetch Metadata and no body/query mass assignment', async () => {
      await check(await del(target.id, actor.cookie, { origin: 'https://evil.test', 'x-forwarded-host': new URL(origin).host }), 403, 'ORIGIN_REFUSED');
      await check(await del(target.id, actor.cookie, { origin: '' }), 403, 'ORIGIN_REFUSED');
      await check(await del(target.id, actor.cookie, { 'sec-fetch-site': 'same-site' }), 403, 'ORIGIN_REFUSED');
      assert.equal((await del(target.id, actor.cookie, {}, '?role=admin')).status, 400);
      assert.equal((await del(target.id, actor.cookie, { 'content-type': 'application/json' }, '', JSON.stringify({ userId: otherAdmin.id, role: 'user' }))).status, 400);
      assert.deepEqual(await counts(target.id), { users: 1, sessions: 3 });
    });
    await t.test('admin delete HTTP/PG: transactional failure rolls back both user and cascaded sessions', async () => {
      await admin.query(`CREATE FUNCTION imobilead.admin_delete_test_failure() RETURNS trigger LANGUAGE plpgsql AS
        'BEGIN RAISE EXCEPTION ''DISPOSABLE_DELETE_FAILURE''; END'`);
      try {
        await admin.query(`CREATE TRIGGER zz_admin_delete_test_failure AFTER DELETE ON imobilead.users
          FOR EACH ROW EXECUTE FUNCTION imobilead.admin_delete_test_failure()`);
        await check(await del(target.id, actor.cookie), 503, 'USER_DELETE_FAILED');
        assert.deepEqual(await counts(target.id), { users: 1, sessions: 3 });
        for (const cookie of target.cookies) assert.equal((await getSession(cookie)).status, 200);
      } finally {
        await admin.query('DROP TRIGGER IF EXISTS zz_admin_delete_test_failure ON imobilead.users');
        await admin.query('DROP FUNCTION imobilead.admin_delete_test_failure()');
      }
    });
    await t.test('admin delete HTTP/PG: 204 removes exactly user and all sessions atomically, repeat is 404', async () => {
      await check(await del(target.id, actor.cookie), 204);
      assert.deepEqual(await counts(target.id), { users: 0, sessions: 0 });
      for (const cookie of target.cookies) assert.equal((await getSession(cookie)).status, 401);
      for (const preserved of [actor, otherAdmin, ordinary, survivor]) {
        assert.deepEqual(await counts(preserved.id), { users: 1, sessions: 1 });
        assert.equal((await getSession(preserved.cookie)).status, 200);
      }
      await check(await del(target.id, actor.cookie), 404, 'USER_NOT_FOUND');
    });
  });

  await fixture(t, config, admin, 'concurrency', async ({ origin, account, login, del, getSession, check, counts, waitForLock, whileTargetLocked }) => {
    const actor = await account('admin'), secondActor = await account('admin');
    await t.test('admin delete HTTP/PG race: two admins delete same user, one 204 and one 404', async () => {
      const target = await account('user', 2);
      const results = await Promise.all([del(target.id, actor.cookie), del(target.id, secondActor.cookie)]);
      assert.deepEqual(results.map(response => response.status).sort(), [204, 404]);
      for (const result of results) await check(result, result.status, result.status === 404 ? 'USER_NOT_FOUND' : undefined);
      assert.deepEqual(await counts(target.id), { users: 0, sessions: 0 });
      assert.equal((await getSession(actor.cookie)).status, 200); assert.equal((await getSession(secondActor.cookie)).status, 200);
    });
    await t.test('admin delete HTTP/PG race: promotion while delete waits is re-read and protected', async () => {
      const target = await account();
      const response = await whileTargetLocked(target, () => del(target.id, actor.cookie), () => admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [target.id]));
      await check(response, 409, 'ADMIN_DELETE_FORBIDDEN');
      assert.equal((await admin.query('SELECT role FROM imobilead.users WHERE id=$1', [target.id])).rows[0].role, 'admin');
      assert.deepEqual(await counts(target.id), { users: 1, sessions: 1 });
    });
    await t.test('admin delete HTTP/PG race: actor demotion while waiting prevents DELETE', async () => {
      const localActor = await account('admin'), target = await account();
      const response = await whileTargetLocked(localActor, () => del(target.id, localActor.cookie), () => admin.query("UPDATE imobilead.users SET role='user' WHERE id=$1", [localActor.id]));
      await check(response, 403, 'FORBIDDEN'); assert.deepEqual(await counts(target.id), { users: 1, sessions: 1 });
    });
    await t.test('admin delete HTTP/PG race: session revocation during user-lock wait prevents DELETE', async () => {
      const localActor = await account('admin'), target = await account();
      const response = await whileTargetLocked(target, () => del(target.id, localActor.cookie), () => admin.query('UPDATE imobilead.sessions SET revoked_at=GREATEST(created_at,clock_timestamp()) WHERE token_hash=$1', [digest(localActor.cookie)]));
      await check(response, 401, 'UNAUTHENTICATED'); assert.deepEqual(await counts(target.id), { users: 1, sessions: 1 });
      assert.equal((await getSession(localActor.cookie)).status, 401);
    });
    await t.test('admin delete HTTP/PG race: real logout during user-lock wait prevents DELETE', async () => {
      const localActor = await account('admin'), target = await account();
      const response = await whileTargetLocked(target, () => del(target.id, localActor.cookie), async () => {
        const logout = await fetch(origin + '/api/auth/logout', { method: 'POST', headers: { origin, cookie: localActor.cookie }, signal: AbortSignal.timeout(15000) });
        assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
      });
      await check(response, 401, 'UNAUTHENTICATED'); assert.deepEqual(await counts(target.id), { users: 1, sessions: 1 });
      assert.equal((await getSession(localActor.cookie)).status, 401);
    });
    await t.test('admin delete HTTP/PG race: deletion wins before login session FK, 401 without cookie or orphan', async () => {
      const target = await account();
      let pending;
      // Test-only BEFORE INSERT barrier holds login after password validation,
      // before its session row/FK exists. No route, pool or guard is replaced.
      await admin.query(`CREATE FUNCTION imobilead.admin_delete_login_barrier() RETURNS trigger LANGUAGE plpgsql AS
        'BEGIN PERFORM pg_advisory_xact_lock(17934048,1); RETURN NEW; END'`);
      try {
        await admin.query(`CREATE TRIGGER admin_delete_login_barrier BEFORE INSERT ON imobilead.sessions
          FOR EACH ROW EXECUTE FUNCTION imobilead.admin_delete_login_barrier()`);
        await admin.query('BEGIN');
        await admin.query('SELECT pg_advisory_xact_lock(17934048,1)');
        pending = login(target.email);
        await waitForLock('INSERT INTO imobilead.sessions');
        await check(await del(target.id, actor.cookie), 204);
        await admin.query('COMMIT');
        const response = await pending;
        assert.equal(response.status, 401); assert.deepEqual(await response.json(), { error: 'INVALID_CREDENTIALS' });
        assert.equal(response.headers.get('set-cookie'), null);
        assert.deepEqual(await counts(target.id), { users: 0, sessions: 0 });
        assert.equal((await getSession(target.cookie)).status, 401);
      } finally {
        await admin.query('ROLLBACK');
        if (pending) await pending;
        await admin.query('DROP TRIGGER IF EXISTS admin_delete_login_barrier ON imobilead.sessions');
        await admin.query('DROP FUNCTION imobilead.admin_delete_login_barrier()');
      }
    });
  });
}
