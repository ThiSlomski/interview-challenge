import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeleteUserHandler } from '../../server/users/delete-handler.mjs';
import { newSessionToken } from '../../server/auth/session.mjs';

const actorId = '00000000-0000-4000-8000-000000000002', targetId = '00000000-0000-4000-8000-000000000001';
const token = newSessionToken(), origin = 'http://localhost:3000';
const config = () => ({ origin, ttl: '3600', production: false });
function fixture({ authenticated = true, role = 'admin', lockedRole = role, targetRole = 'user', missing = false, revoked = false, fail, expired = false, invalidCardinality = false } = {}) {
  const calls = [], diagnostics = []; let released = 0, connections = 0, time = Date.now();
  const query = async (sql, values) => {
    calls.push({ sql, values });
    if (fail && sql.includes(fail)) throw new Error('private credentials/SQL/row');
    if (sql.includes('JOIN')) return { rows: authenticated ? [{ id: actorId, expires_at: new Date(time + 10000), revoked_at: null }] : [] };
    if (sql.startsWith('SELECT id,role FROM imobilead.users WHERE id=$1')) return { rows: [{ id: actorId, role }] };
    if (sql.includes('ORDER BY id FOR UPDATE')) return { rows: [{ id: actorId, role: lockedRole }, ...(!missing ? [{ id: targetId, role: targetRole }] : [])] };
    if (sql.includes('FROM imobilead.sessions')) return { rows: revoked ? [] : [{ user_id: actorId, expires_at: new Date(time + 10000), revoked_at: null }] };
    if (sql.startsWith('DELETE')) {
      if (expired) time += 20000;
      return { rowCount: invalidCardinality ? 0 : 1, rows: invalidCardinality ? [] : [{ id: targetId }] };
    }
    return { rows: [] };
  };
  const handler = createDeleteUserHandler({ database: async () => ({ connect: async () => { connections++; return { query, release: () => { released++; } }; } }), config, now: () => time, diagnostic: code => diagnostics.push(code) });
  const request = (id = targetId, headers = {}, body, query = '') => handler(new Request(origin + '/api/users/' + id + query, {
    method: 'DELETE', headers: { cookie: `imobilead_session=${token}`, origin, ...headers }, ...(body !== undefined ? { body } : {}), ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
  }), id);
  return { request, calls, diagnostics, released: () => released, connections: () => connections };
}
test('401 rejects missing malformed expired and revoked sessions before any target access', async () => {
  for (const cookie of ['', 'imobilead_session=bad']) {
    const f = fixture(); assert.equal((await f.request('invalid', { cookie })).status, 401); assert.equal(f.connections(), 0);
  }
  const f = fixture({ authenticated: false }); assert.equal((await f.request()).status, 401); assert.equal(f.calls.length, 1); assert.equal(f.released(), 1);
});
test('403 for non-admin precedes UUID parsing, body/query and all target lookups', async () => {
  for (const role of ['user', 'unknown', undefined]) for (const id of [targetId, actorId, 'invalid']) {
    const f = fixture({ role: role ?? 'owner' }), response = await f.request(id, { 'x-role': 'admin', 'x-user-id': actorId }, '{"role":"admin"}', '?role=admin');
    assert.equal(response.status, 403); assert.deepEqual(await response.json(), { error: 'FORBIDDEN' });
    assert.equal(f.calls.length, 2); assert.equal(f.calls.some(c => c.sql.includes('FOR UPDATE')), false); assert.equal(f.released(), 1);
  }
});
test('authorized admin rejects UUID, query and any body or oversized request', async () => {
  const f = fixture(); assert.equal((await f.request('invalid')).status, 400);
  assert.equal((await f.request(targetId, {}, undefined, '?role=admin')).status, 400);
  assert.equal((await f.request(targetId, {}, '{"id":"forged"}')).status, 400);
  assert.equal((await f.request(targetId, { 'content-length': '16385' })).status, 413);
  assert.equal((await f.request(targetId, { 'content-encoding': 'gzip' })).status, 415);
  assert.equal(f.calls.some(c => c.sql === 'BEGIN'), false);
});
test('strict Origin and Fetch Metadata reject CSRF and spoofed forwarding', async () => {
  for (const headers of [{ origin: '' }, { origin: 'https://evil.test', 'x-forwarded-host': 'localhost:3000' }, { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-mode': 'navigate' }, { 'sec-fetch-dest': 'document' }]) {
    const f = fixture(); assert.equal((await f.request(targetId, headers)).status, 403); assert.equal(f.calls.some(c => c.sql === 'BEGIN'), false);
  }
});
test('self and every administrative or unknown target role are rejected transactionally', async () => {
  const own = fixture(), response = await own.request(actorId);
  assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error: 'SELF_DELETE_FORBIDDEN' });
  for (const targetRole of ['admin', 'owner', undefined]) {
    const f = fixture({ targetRole: targetRole ?? 'unknown' }), result = await f.request();
    assert.equal(result.status, 409); assert.deepEqual(await result.json(), { error: 'ADMIN_DELETE_FORBIDDEN' });
    assert.equal(f.calls.at(-1).sql, 'ROLLBACK'); assert.equal(f.calls.some(c => c.sql.startsWith('DELETE')), false);
  }
});
test('missing target and repeat deletion return404 without leaking record data', async () => {
  const f = fixture({ missing: true }), response = await f.request(); assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'USER_NOT_FOUND' }); assert.equal(f.calls.at(-1).sql, 'ROLLBACK');
});
test('204 is empty only after exact DELETE, deterministic locks, session lock and commit on one client', async () => {
  const f = fixture(), response = await f.request(targetId.toUpperCase()); assert.equal(response.status, 204); assert.equal(await response.text(), '');
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const locked = f.calls.find(c => c.sql.includes('FOR UPDATE')); assert.match(locked.sql, /ORDER BY id FOR UPDATE/);
  assert.deepEqual(locked.values, [[actorId, targetId]]); assert.ok(f.calls.some(c => c.sql.includes('FOR SHARE')));
  const deleted = f.calls.filter(c => c.sql.startsWith('DELETE')); assert.equal(deleted.length, 1); assert.match(deleted[0].sql, /role='user'/); assert.deepEqual(deleted[0].values, [targetId]);
  assert.equal(f.calls.at(-1).sql, 'COMMIT'); assert.equal(f.connections(), 1); assert.equal(f.released(), 1);
  assert.equal(f.calls.some(c => c.sql.includes('pg_advisory') || c.sql.includes('count(')), false);
});
test('actor demotion or session revocation after waiting for locks denies and rolls back', async () => {
  for (const options of [{ lockedRole: 'user' }, { revoked: true }]) {
    const f = fixture(options); assert.equal((await f.request()).status, options.revoked ? 401 : 403);
    assert.equal(f.calls.some(c => c.sql.startsWith('DELETE')), false); assert.equal(f.calls.at(-1).sql, 'ROLLBACK'); assert.equal(f.released(), 1);
  }
});
test('expiration during DELETE rolls back, and unexpected cardinality never reports success', async () => {
  const f = fixture({ expired: true }); assert.equal((await f.request()).status, 401); assert.equal(f.calls.at(-1).sql, 'ROLLBACK');
  const invalid = fixture({ invalidCardinality: true }); assert.equal((await invalid.request()).status, 503); assert.equal(invalid.calls.at(-1).sql, 'ROLLBACK');
});
test('database errors in auth, role, begin, lock, delete and commit are sanitized and release client', async () => {
  for (const fail of ['JOIN','SELECT id,role FROM imobilead.users WHERE id=$1','BEGIN','SET LOCAL','FOR UPDATE','FOR SHARE','DELETE FROM','COMMIT']) {
    const f = fixture({ fail }), response = await f.request(); assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'USER_DELETE_FAILED' }); assert.deepEqual(f.diagnostics, ['USER_DELETE_FAILED']); assert.equal(f.released(), 1);
    if (!['JOIN','SELECT id,role FROM imobilead.users WHERE id=$1'].includes(fail)) assert.equal(f.calls.at(-1).sql, 'ROLLBACK');
  }
});
test('bounded write budget returns429 with Retry-After despite forged client IP', async () => {
  const f = fixture({ missing: true }); for (let n = 0; n < 20; n++) assert.equal((await f.request(targetId, { 'x-forwarded-for': String(n) })).status, 404);
  const response = await f.request(); assert.equal(response.status, 429); assert.ok(Number(response.headers.get('retry-after')) > 0); assert.equal(f.released(), 21);
});
test('Next-style empty streams are accepted; two slow readers are bounded and timeout without mutation', async () => {
  const f = fixture(), controllers = [];
  const pending = [0, 1].map(() => f.request(targetId, {}, new ReadableStream({ start(controller) { controllers.push(controller); } })));
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal((await f.request()).status, 429);
  for (const controller of controllers) controller.close();
  for (const response of await Promise.all(pending)) assert.equal(response.status, 204);
  const slow = fixture();
  assert.equal((await slow.request(targetId, {}, new ReadableStream({ start() {} }))).status, 408);
  assert.equal(slow.calls.some(c => c.sql === 'BEGIN'), false); assert.equal(slow.released(), 1);
});
