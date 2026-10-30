import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';

export function profileHttpTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'profile', async origin => {
    const ids = [], cookies = [], password = 'Profile123';
    const get = (index = 0) => fetch(origin + '/api/profile', { headers: { cookie: cookies[index] }, signal: AbortSignal.timeout(15000) });
    const patch = (index, input, etag, headers = {}) => fetch(origin + '/api/profile', {
      method: 'PATCH', headers: { origin, cookie: cookies[index], 'content-type': 'application/json', 'if-match': etag, ...headers },
      body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
    });
    let profile, etag, immutable;
    await t.test('profile HTTP/PG: signup, sessions, own projection and admin can edit only self', async () => {
      for (let n = 0; n < 2; n++) {
        const email = `profile-${n}@example.test`;
        const signup = await fetch(origin + '/api/users', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Profile Fixture', email, password, passwordConfirmation: password, address: 'Original', city: 'Original City' }) });
        assert.equal(signup.status, 201); ids.push((await signup.json()).user.id);
        const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
        assert.equal(login.status, 200); cookies.push(login.headers.get('set-cookie').split(';')[0]);
      }
      await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [ids[1]]);
      immutable = (await admin.query('SELECT email,password_hash,role,created_at FROM imobilead.users WHERE id=$1', [ids[0]])).rows[0];
      const response = await get(); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
      profile = await response.json(); etag = response.headers.get('etag');
      assert.equal(profile.profileVersion, 1); assert.equal(profile.user.id, ids[0]);
      assert.deepEqual(Object.keys(profile.user).sort(), ['id','name','email','address','city','state','country','postalCode','message'].sort());
      const adminProfile = await get(1); assert.equal(adminProfile.status, 200); assert.equal((await adminProfile.json()).user.id, ids[1]);
      assert.equal((await patch(1, { expectedVersion: 1, name: 'forged' }, etag)).status, 409);
    });
    await t.test('profile HTTP/PG: mass assignment, CSRF and stale identity preconditions denied', async () => {
      for (const addition of [{ email: 'changed@example.test' }, { role: 'admin' }, { id: ids[1] }]) {
        assert.equal((await patch(0, { name: 'forged', expectedVersion: 1, ...addition }, etag)).status, 400);
      }
      assert.equal((await patch(0, { name: 'forged', expectedVersion: 1 }, etag, { origin: 'https://evil.test' })).status, 403);
      const noSession = await fetch(origin + '/api/profile', { signal: AbortSignal.timeout(15000) }); assert.equal(noSession.status, 401);
      const request = new Request(origin + '/api/profile', { method: 'PATCH', headers: { origin, cookie: cookies[0], 'content-type': 'application/json' }, body: JSON.stringify({ expectedVersion: 1, name: 'no precondition' }) });
      assert.equal((await fetch(request)).status, 428);
    });
    await t.test('profile HTTP/PG: partial edit persists, preserves immutable and omitted fields', async () => {
      const response = await patch(0, { expectedVersion: 1, name: '😀'.repeat(150), city: '非Brasil', postalCode: 'A1 Test', message: '<script>synthetic</script>' }, etag);
      assert.equal(response.status, 200); profile = await response.json(); etag = response.headers.get('etag');
      assert.equal(profile.profileVersion, 2); assert.equal(profile.user.address, 'Original');
      assert.equal(profile.user.name, '😀'.repeat(150)); assert.equal(profile.user.city, '非Brasil');
      assert.deepEqual((await admin.query('SELECT email,password_hash,role,created_at FROM imobilead.users WHERE id=$1', [ids[0]])).rows[0], immutable);
      const own = await fetch(origin + '/api/users/' + ids[0], { headers: { cookie: cookies[0] } }); assert.equal(own.status, 200); assert.equal((await own.json()).user.city, '非Brasil');
      const adminResponse = await get(1), adminBody = await adminResponse.json();
      assert.equal((await patch(1, { expectedVersion: adminBody.profileVersion, name: 'Admin Profile Fixture' }, adminResponse.headers.get('etag'))).status, 200);
    });
    await t.test('profile HTTP/PG: concurrent version writes produce one success and one conflict', async () => {
      const responses = await Promise.all(['Concurrent A', 'Concurrent B'].map(name => patch(0, { expectedVersion: 2, name }, etag)));
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
      const current = await get(); profile = await current.json(); etag = current.headers.get('etag');
      assert.equal(profile.profileVersion, 3); assert.ok(['Concurrent A', 'Concurrent B'].includes(profile.user.name));
      const stored = (await admin.query('SELECT name,profile_version FROM imobilead.users WHERE id=$1', [ids[0]])).rows[0];
      assert.equal(stored.profile_version, 3); assert.equal(stored.name, profile.user.name);
    });
    await t.test('profile HTTP/PG: missing UPDATE permission fails closed without changing row', async () => {
      const runtime = roleIdentifier(config.user);
      try {
        await admin.query(`REVOKE UPDATE(name) ON imobilead.users FROM ${runtime}`);
        const response = await patch(0, { expectedVersion: 3, name: 'must not persist' }, etag);
        assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'PROFILE_FAILED' });
      } finally { await admin.query(`GRANT UPDATE(name) ON imobilead.users TO ${runtime}`); }
      const current = await get(); assert.equal((await current.json()).profileVersion, 3);
    });
    await t.test('profile HTTP/PG: revocation while waiting for user lock is revalidated inside transaction', async () => {
      let pending;
      await admin.query('BEGIN');
      try {
        await admin.query('SELECT id FROM imobilead.users WHERE id=$1 FOR UPDATE', [ids[0]]);
        pending = patch(0, { expectedVersion: 3, name: 'revoked draft' }, etag);
        let waiting = false;
        for (let n = 0; n < 100; n++) {
          // pg_stat_activity is cached within this observer transaction.
          // Refresh that snapshot before observing a newly blocked backend.
          await admin.query('SELECT pg_stat_clear_snapshot()');
          const probe = await admin.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND usename=$1 AND wait_event_type='Lock' AND query LIKE 'SELECT id,name%FOR UPDATE') AS waiting", [config.user]);
          if (probe.rows[0].waiting) { waiting = true; break; }
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.equal(waiting, true, 'PROFILE_WAITING_ON_USER_LOCK');
        const token = cookies[0].slice(cookies[0].indexOf('=') + 1);
        await admin.query('UPDATE imobilead.sessions SET revoked_at=GREATEST(created_at,clock_timestamp()) WHERE token_hash=$1', [createHash('sha256').update(token).digest()]);
        await admin.query('COMMIT');
        assert.equal((await pending).status, 401);
      } finally { await admin.query('ROLLBACK'); if (pending) await pending; }
      const row = (await admin.query('SELECT name,profile_version FROM imobilead.users WHERE id=$1', [ids[0]])).rows[0];
      assert.equal(row.profile_version, 3); assert.notEqual(row.name, 'revoked draft');
      assert.equal((await get()).status, 401);
    });
    await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[])', [ids]);
  });
}
