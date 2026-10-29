import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthHandlers, DUMMY_HASH, BODY_LIMIT, LOGIN_LIMIT, EMAIL_LIMIT } from '../../server/auth/handler.mjs';
import { authenticateSession, sessionConfig, cookieToken, tokenDigest, newSessionToken, sessionCookie } from '../../server/auth/session.mjs';
import { hashPassword, verifyPassword } from '../../server/registration/password.mjs';

const config = () => ({ origin: 'http://localhost:3000', ttl: '3600', production: false });
const credentials = { email: ' Fixture@Example.test ', password: 'Abc12345' };
const user = { id: 'fixture-id' };
const hash = await hashPassword(credentials.password);
const request = (value = credentials, headers = {}, method = 'POST') => new Request(config().origin, {
  method, headers: { origin: config().origin, 'content-type': 'application/json', ...headers },
  ...(method === 'POST' ? { body: JSON.stringify(value) } : {}),
});
function fixture({ found = true, fail, clock = () => 10000000, value = config } = {}) {
  const sessions = new Map(), calls = [], diagnostics = [];
  const database = async () => ({ query: async (sql, values) => {
    calls.push({ sql, values });
    if (fail?.(sql)) throw new Error('private connection/SQL/password detail');
    if (sql.startsWith('SELECT id,password_hash')) return { rows: found ? [{ ...user, password_hash: hash, secret: 'omit' }] : [] };
    if (sql.startsWith('INSERT')) {
      sessions.set(values[0].toString('hex'), { id: user.id, expires_at: values[3], revoked_at: null, created_at: values[2] });
      return { rows: [] };
    }
    const row = sessions.get(values[0].toString('hex'));
    if (sql.startsWith('UPDATE')) { if (row) row.revoked_at ??= values[1]; return { rows: [] }; }
    return { rows: row ? [row] : [] };
  } });
  return { ...createAuthHandlers({ database, config: value, now: clock, diagnostic: code => diagnostics.push(code) }), sessions, calls, database, diagnostics };
}
const cookie = response => response.headers.get('set-cookie').split(';')[0];

test('valid login uses normalized parameterized lookup, digest-only persistence and minimal response', async () => {
  const f = fixture();
  const response = await f.login(request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { user });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  const header = response.headers.get('set-cookie');
  assert.match(header, /^imobilead_session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Lax$/);
  assert.doesNotMatch(header, /Domain|Max-Age|Secure/);
  const token = cookieToken(cookie(response), sessionConfig(config()));
  assert.equal(Buffer.from(token, 'base64url').length, 32);
  assert.equal(f.calls[0].sql, 'SELECT id,password_hash FROM imobilead.users WHERE email=$1');
  assert.deepEqual(f.calls[0].values, ['fixture@example.test']);
  const insert = f.calls[1]; assert.deepEqual(insert.values[0], tokenDigest(token));
  assert.equal(insert.values.includes(token), false);
  assert.equal(insert.values[3] - insert.values[2], 3600000);
  // Signup permits ASCII spaces around a canonical 254-byte mailbox.
  const boundaryEmail = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(61);
  assert.equal(boundaryEmail.length, 254);
  const boundary = fixture();
  assert.equal((await boundary.login(request({ email: ' ' + boundaryEmail.toUpperCase() + ' ', password: credentials.password }))).status, 200);
  assert.deepEqual(boundary.calls[0].values, [boundaryEmail]);
});

test('wrong and missing account are uniform; equivalent-cost dummy really verifies Argon2id', async () => {
  assert.match(DUMMY_HASH, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(await verifyPassword(DUMMY_HASH, 'DummyOnlyPassword3592'), true);
  const wrong = await fixture().login(request({ ...credentials, password: ' ' + credentials.password + ' ' }));
  const missing = await fixture({ found: false }).login(request());
  assert.equal(wrong.status, 401); assert.equal(missing.status, 401);
  assert.deepEqual(await wrong.json(), await missing.json());
  for (const response of [wrong, missing]) { assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('cache-control'), 'no-store'); }
});

test('invalid JSON, UTF8, input, media, encoding and size fail before persistence', async () => {
  for (const body of [{}, null, [], { ...credentials, role: 'admin' }, { ...credentials, password: '' }, { ...credentials, password: 'a'.repeat(257) }]) {
    const f = fixture(); assert.equal((await f.login(request(body))).status, 400); assert.equal(f.calls.length, 0);
  }
  for (const [headers, status] of [[{ 'content-type': 'text/plain' }, 415], [{ 'content-encoding': 'gzip' }, 415], [{ 'content-length': String(BODY_LIMIT + 1) }, 413]])
    assert.equal((await fixture().login(request(credentials, headers))).status, status);
  for (const [body, status] of [['{', 400], [new Uint8Array([255]), 400], [' '.repeat(BODY_LIMIT + 1), 413]])
    assert.equal((await fixture().login(new Request(config().origin, { method: 'POST', headers: { origin: config().origin, 'content-type': 'application/json' }, body }))).status, status);
});

test('login and logout require exact configured Origin and reject navigation/cross-site metadata', async () => {
  const f = fixture();
  for (const headers of [{ origin: 'null' }, { origin: 'https://evil.test', 'x-forwarded-host': 'localhost:3000' }, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-mode': 'navigate' }, { 'sec-fetch-dest': 'document' }])
    for (const action of ['login', 'logout']) assert.equal((await f[action](request(credentials, headers))).status, 403);
  for (const action of ['login', 'logout']) {
    const req = request(); req.headers.delete('origin'); assert.equal((await f[action](req)).status, 403);
  }
  assert.equal(f.calls.length, 0);
});

test('missing or arbitrary TTL/origin fails closed; production cookie enforces HTTPS and host prefix', async () => {
  for (const value of [{ ...config(), ttl: undefined }, { ...config(), ttl: '7200' }, { ...config(), ttl: 3600 }, { ...config(), origin: '' }, { ...config(), origin: 'http://localhost:3000/' }, { ...config(), production: true }]) {
    const f = fixture({ value: () => value });
    for (const action of ['login', 'session', 'logout']) assert.equal((await f[action](request())).status, 503);
    assert.equal(f.calls.length, 0);
  }
  const production = sessionConfig({ origin: 'https://app.example.test', ttl: '3600', production: true });
  assert.equal(sessionCookie('token', production), '__Host-imobilead_session=token; Path=/; HttpOnly; SameSite=Lax; Secure');
  assert.equal(sessionCookie('', production, true), '__Host-imobilead_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0');
});

test('absolute expiry exact boundary, no refresh, malformed/tampered/revoked/absent rejected centrally', async () => {
  let time = 10000000;
  const f = fixture({ clock: () => time }); const login = await f.login(request()); const header = cookie(login);
  const original = [...f.sessions.values()][0].expires_at.getTime();
  const lookup = () => authenticateSession({ database: f.database, cookie: header, config: config(), now: () => time });
  assert.deepEqual(await lookup(), { user, expiresAt: new Date(original).toISOString() });
  time = original - 1; assert.ok(await lookup());
  assert.equal([...f.sessions.values()][0].expires_at.getTime(), original);
  time = original; assert.equal(await lookup(), null);
  time = original - 1;
  const delayedDatabase = async () => ({ query: async () => {
    time = original;
    return { rows: [{ ...user, expires_at: new Date(original), revoked_at: null }] };
  } });
  assert.equal(await authenticateSession({ database: delayedDatabase, cookie: header, config: config(), now: () => time }), null);
  assert.equal(f.calls.filter(call => /INSERT|UPDATE/.test(call.sql)).length, 1);
  time = original - 1;
  for (const value of [null, '', 'imobilead_session=bad', 'imobilead_session=' + newSessionToken(), header + '; ' + header, header + '='])
    assert.equal(await authenticateSession({ database: f.database, cookie: value, config: config(), now: () => time }), null);
  [...f.sessions.values()][0].revoked_at = new Date(time);
  assert.equal(await lookup(), null);
  assert.equal((await f.session(request(undefined, { cookie: header }, 'GET'))).status, 401);
});

test('each login creates a fresh token, ignores supplied session, and preserves other sessions', async () => {
  const f = fixture();
  const first = await f.login(request());
  const second = await f.login(request(credentials, { cookie: cookie(first) }));
  assert.notEqual(cookie(first), cookie(second)); assert.equal(f.sessions.size, 2);
  for (const response of [first, second]) assert.equal((await f.session(request(undefined, { cookie: cookie(response) }, 'GET'))).status, 200);
});

test('logout persistently revokes only current token; repeat and missing token succeed; old token remains denied', async () => {
  const f = fixture(); const first = cookie(await f.login(request())), second = cookie(await f.login(request()));
  for (let i = 0; i < 2; i++) {
    const out = await f.logout(request(undefined, { cookie: first }));
    assert.equal(out.status, 200); assert.deepEqual(await out.json(), { ok: true });
    assert.equal(out.headers.get('set-cookie'), 'imobilead_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    assert.equal((await f.session(request(undefined, { cookie: first }, 'GET'))).status, 401);
    assert.equal((await f.session(request(undefined, { cookie: second }, 'GET'))).status, 200);
  }
  assert.equal((await f.logout(request())).status, 200);
});

test('read/create/revoke database faults are sanitized and issue no successful cookie', async () => {
  for (const target of ['SELECT id,password_hash', 'INSERT', 'SELECT u.id', 'UPDATE']) {
    let fail = false;
    const f = fixture({ fail: sql => fail && sql.startsWith(target) });
    const header = cookie(await f.login(request())); fail = true;
    const action = target === 'SELECT u.id' ? 'session' : target === 'UPDATE' ? 'logout' : 'login';
    const response = await f[action](request(credentials, { cookie: header }, action === 'session' ? 'GET' : 'POST'));
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'AUTH_FAILED' });
    assert.equal(response.headers.get('set-cookie'), null); assert.deepEqual(f.diagnostics, ['AUTH_FAILED']);
  }
});

test('global/per-email fixed-window budgets ignore forged IP and reset without permanent lockout', async () => {
  let time = 0;
  const f = fixture({ found: false, clock: () => time });
  for (let i = 0; i < EMAIL_LIMIT; i++) assert.equal((await f.login(request(credentials, { 'x-forwarded-for': String(i) }))).status, 401);
  const refused = await f.login(request()); assert.equal(refused.status, 429); assert.equal(refused.headers.get('retry-after'), '60');
  time = 60000; assert.equal((await f.login(request())).status, 401);
  const global = fixture({ clock: () => time });
  for (let i = 0; i < LOGIN_LIMIT; i++) assert.equal((await global.login(request({}))).status, 400);
  assert.equal((await global.login(request({}))).status, 429);
  time += 60000; assert.equal((await global.login(request({}))).status, 400);
});

test('two in-flight readers maximum and five-second body deadline release capacity', async () => {
  const f = fixture();
  const stalled = () => new Request(config().origin, { method: 'POST', headers: { origin: config().origin, 'content-type': 'application/json' }, body: new ReadableStream({ start() {} }), duplex: 'half' });
  const pending = [f.login(stalled()), f.login(stalled())];
  assert.equal((await f.login(request())).status, 429);
  assert.deepEqual((await Promise.all(pending)).map(response => response.status), [408, 408]);
  assert.equal((await f.login(request())).status, 200);
});
