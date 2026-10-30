import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileHandlers } from '../../server/profile/handler.mjs';
import { newSessionToken } from '../../server/auth/session.mjs';
import { profileEtag } from '../../server/profile/repository.mjs';

const own = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002';
const token = newSessionToken(), origin = 'http://localhost:3000';
const config = () => ({ origin, ttl: '3600', production: false });
function fixture({ authenticated = true, role = 'user', version = 1, revoked = false, fail, expires = false, expireAfterUpdate = false } = {}) {
  const calls = [], diagnostics = []; let released = 0, time = Date.now();
  const row = { id: own, name: 'Fixture', email: 'fixture@example.test', address: null, city: null, state: null, country: null, postalCode: null, message: null, role, profileVersion: version, password_hash: 'withheld', token_hash: 'withheld' };
  const query = async (sql, values) => {
    calls.push({ sql, values });
    if (fail && sql.includes(fail)) throw new Error('private SQL credentials');
    if (sql.includes('JOIN')) return { rows: authenticated ? [{ id: own, expires_at: new Date(time + 10000), revoked_at: null }] : [] };
    if (sql.includes('FROM imobilead.sessions')) {
      if (expires) time += 20000;
      return { rows: revoked ? [] : [{ user_id: own, expires_at: new Date(time + (expires ? -1 : 10000)), revoked_at: null }] };
    }
    if (sql.startsWith('SELECT id,name')) return { rows: [{ ...row }] };
    if (sql.startsWith('UPDATE imobilead.users')) {
      if (expireAfterUpdate) time += 20000;
      return { rowCount: 1, rows: [{ ...row, name: values[2], profileVersion: version + 1 }] };
    }
    return { rows: [] };
  };
  const db = { query, connect: async () => ({ query, release: () => { released++; } }) };
  const handlers = createProfileHandlers({ database: async () => db, config, now: () => time, diagnostic: code => diagnostics.push(code) });
  const request = (body = { name: 'Changed', expectedVersion: version }, headers = {}, url = '') => new Request(origin + '/api/profile' + url, { method: 'PATCH', headers: { cookie: `imobilead_session=${token}`, origin, 'content-type': 'application/json', 'if-match': profileEtag(own, version), ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  return { calls, diagnostics, released: () => released, patch: (...args) => handlers.PATCH(request(...args)), get: (cookie = `imobilead_session=${token}`, query = '') => handlers.GET(new Request(origin + '/api/profile' + query, { headers: { cookie } })), handlers, request };
}
test('anonymous, revoked and forged cookie denied before reading own data', async () => {
  for (const cookie of ['', 'imobilead_session=bad']) { const f = fixture(); assert.equal((await f.get(cookie)).status, 401); assert.equal(f.calls.length, 0); }
  const f = fixture({ authenticated: false }); assert.equal((await f.patch()).status, 401); assert.equal(f.calls.some(c => c.sql === 'BEGIN'), false);
});
test('GET returns only own projection and numeric version for user and admin', async () => {
  for (const role of ['user', 'admin']) {
    const f = fixture({ role }), response = await f.get();
    assert.equal(response.status, 200); assert.equal(response.headers.get('etag'), profileEtag(own, 1));
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json(); assert.equal(body.profileVersion, 1); assert.equal(body.user.id, own);
    for (const key of ['password_hash','role','token_hash','profileVersion']) assert.equal(Object.hasOwn(body.user, key), false);
    assert.deepEqual(f.calls.at(-1).values, [own]);
  }
  assert.equal((await fixture({ role: 'owner' }).get()).status, 403);
});
test('CSRF rejects missing/cross origin and forged Fetch Metadata', async () => {
  for (const headers of [{ origin: '' }, { origin: 'https://evil.test', 'x-forwarded-host': 'localhost:3000' }, { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-mode': 'navigate' }, { 'sec-fetch-dest': 'document' }]) {
    const f = fixture(); assert.equal((await f.patch(undefined, headers)).status, 403); assert.equal(f.calls.length, 0);
  }
});
test('mass assignment, invalid bodies and query identities never reach UPDATE', async () => {
  for (const body of [{ name: 'Changed', expectedVersion: 1, role: 'admin' }, { name: 'Changed', expectedVersion: 1, email: 'other@example.test' }, { expectedVersion: 1 }, '{', [], { name: 42, expectedVersion: 1 }]) {
    const f = fixture(); assert.equal((await f.patch(body)).status, 400); assert.equal(f.calls.some(c => c.sql.startsWith('UPDATE')), false);
  }
  const f = fixture(); assert.equal((await f.patch(undefined, {}, '?userId=' + other)).status, 400); assert.equal((await f.get(undefined, '?role=admin')).status, 400);
});
test('wire limits match signup; media type and compression rejected', async () => {
  for (const [body, headers, status] of [['x'.repeat(16385), {}, 413], ['{}', { 'content-type': 'text/plain' }, 415], ['{}', { 'content-encoding': 'gzip' }, 415], ['{}', { 'content-length': '16385' }, 413]]) {
    const f = fixture(); assert.equal((await f.patch(body, headers)).status, status); assert.equal(f.calls.some(c => c.sql === 'BEGIN'), false);
  }
});
test('PATCH requires a valid precondition and refuses another identity without writing', async () => {
  const f = fixture(), request = f.request(); request.headers.delete('if-match');
  assert.equal((await f.handlers.PATCH(request)).status, 428);
  assert.equal((await fixture().patch(undefined, { 'if-match': '*' })).status, 400);
  const otherContext = fixture(); assert.equal((await otherContext.patch(undefined, { 'if-match': profileEtag(other, 1) })).status, 409);
  assert.equal(otherContext.calls.some(c => c.sql.startsWith('UPDATE')), false); assert.equal(otherContext.calls.at(-1).sql, 'ROLLBACK');
});
test('successful edit locks, updates fixed columns and commits before returning projection', async () => {
  const f = fixture(), response = await f.patch(); assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.user.name, 'Changed'); assert.equal(body.profileVersion, 2);
  assert.equal(response.headers.get('etag'), profileEtag(own, 2));
  const update = f.calls.find(c => c.sql.startsWith('UPDATE')); assert.deepEqual(update.values, [own, 1, 'Changed']);
  assert.doesNotMatch(update.sql, /SET[^]*email=/); assert.ok(f.calls.some(c => c.sql.includes('FOR UPDATE'))); assert.ok(f.calls.some(c => c.sql.includes('FOR SHARE')));
  assert.equal(f.calls.at(-1).sql, 'COMMIT'); assert.equal(f.released(), 1);
});
test('session revocation, expiry or invalid role after lock rolls back without update', async () => {
  for (const options of [{ revoked: true }, { expires: true }, { role: 'owner' }]) {
    const f = fixture(options); assert.equal((await f.patch()).status, options.role ? 403 : 401);
    assert.equal(f.calls.some(c => c.sql.startsWith('UPDATE')), false); assert.equal(f.calls.at(-1).sql, 'ROLLBACK'); assert.equal(f.released(), 1);
  }
  const afterUpdate = fixture({ expireAfterUpdate: true });
  assert.equal((await afterUpdate.patch()).status, 401); assert.equal(afterUpdate.calls.at(-1).sql, 'ROLLBACK'); assert.equal(afterUpdate.released(), 1);
});
test('stale versions and integer exhaustion fail without silent overwrite', async () => {
  for (const [version, expectedVersion] of [[2, 1], [2147483647, 2147483647]]) {
    const f = fixture({ version }); assert.equal((await f.patch({ name: 'stale', expectedVersion }, { 'if-match': profileEtag(own, expectedVersion) })).status, 409);
    assert.equal(f.calls.some(c => c.sql.startsWith('UPDATE')), false); assert.equal(f.released(), 1);
  }
});
test('database failures in all transaction phases are sanitized, rolled back and released', async () => {
  for (const fail of ['BEGIN','SET LOCAL','FOR UPDATE','FOR SHARE','UPDATE imobilead.users','COMMIT']) {
    const f = fixture({ fail }), response = await f.patch(); assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'PROFILE_FAILED' }); assert.deepEqual(f.diagnostics, ['PROFILE_FAILED']);
    assert.equal(f.calls.at(-1).sql, 'ROLLBACK'); assert.equal(f.released(), 1);
  }
  assert.equal((await fixture({ fail: 'SELECT id,name' }).get()).status, 503);
});
test('bounded process write budget rejects abuse and does not trust forwarded IP', async () => {
  const f = fixture(); for (let n = 0; n < 20; n++) assert.equal((await f.patch({}, { 'x-forwarded-for': String(n) })).status, 400);
  const response = await f.patch(); assert.equal(response.status, 429); assert.ok(Number(response.headers.get('retry-after')) > 0);
});
