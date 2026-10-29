import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../server/registration/password.mjs';
import { createRegistrationHandler, BODY_LIMIT } from '../../server/registration/handler.mjs';

const valid = { name: 'Fixture', email: 'Fixture@Example.test', password: 'Abc12345', passwordConfirmation: 'Abc12345', message: "<script>';</script>" };
const origin = () => 'http://localhost:3000';
const request = (value = valid, headers = {}) => new Request(origin() + '/api/users', {
  method: 'POST', headers: { 'content-type': 'application/json', origin: origin(), ...headers }, body: JSON.stringify(value),
});
test('Argon2id PHC version, cost, unique 16-byte salt, verifiable without original', async () => {
  const a = await hashPassword(valid.password), b = await hashPassword(valid.password);
  assert.match(a, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.notEqual(a,b); assert.equal(a.includes(valid.password),false);
  assert.equal(Buffer.from(a.split('$')[4], 'base64').length,16);
  assert.equal(await verifyPassword(a,valid.password),true);
  assert.equal(await verifyPassword(a,'Wrong123'),false);
});
test('parameterized insertion with allowlist, minimal output, no session or cookie', async () => {
  let calls = 0;
  const POST = createRegistrationHandler({ origin, database: async () => ({ query: async (sql, values) => {
    calls++; assert.match(sql,/VALUES \(\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9\) RETURNING id/);
    assert.doesNotMatch(sql,/passwordConfirmation|sessions|role/);
    assert.equal(values[1],'fixture@example.test'); assert.equal(values[8],valid.message);
    assert.equal(await verifyPassword(values[2],valid.password),true);
    assert.equal(values.includes(valid.password),false);
    return { rows: [{ id: 'fixture-id', password_hash: 'never-project-this', role: 'admin' }] };
  } }) });
  const response = await POST(request());
  assert.equal(response.status,201); assert.deepEqual(await response.json(),{user:{id:'fixture-id'}});
  assert.equal(response.headers.get('set-cookie'),null); assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(calls,1);
  const body=JSON.stringify(valid);
  const boundaryRequest=new Request(origin(),{method:'POST',headers:{'content-type':'application/json'},body:body+' '.repeat(BODY_LIMIT-Buffer.byteLength(body))});
  assert.equal((await POST(boundaryRequest)).status,201);
});
test('invalid input and unknown internal fields never access persistence', async () => {
  const POST = createRegistrationHandler({ origin, database: () => { throw new Error('must not call'); } });
  for (const value of [{}, { ...valid,role:'admin' }, { ...valid,id:'x' }, { ...valid,passwordConfirmation:'different' }]) assert.equal((await POST(request(value))).status,400);
});
test('only actual email UNIQUE conflict is 409; failures and diagnostics are sanitized', async () => {
  for (const [error,status] of [
    [{code:'23505',constraint:'users_email_key', detail:valid.password},409],
    [{code:'23505',constraint:'other',message:'secret SQL'},500],
    [new Error('postgres://secret@remote SQL password'),500],
  ]) {
    const diagnostics = [];
    const POST = createRegistrationHandler({ origin, database: async () => { throw error; }, diagnostic: code => diagnostics.push(code) });
    const res = await POST(request()); assert.equal(res.status,status);
    assert.deepEqual(await res.json(),{error:status===409?'REGISTRATION_CONFLICT':'REGISTRATION_FAILED'});
    assert.deepEqual(diagnostics,status===409?[]:['REGISTRATION_FAILED']);
  }
});
test('origins, metadata, media type, encoding and declared size fail before database', async () => {
  const POST = createRegistrationHandler({ origin, database: () => { throw new Error('must not call'); } });
  for (const [headers,status] of [
    [{origin:'null'},403], [{origin:'https://evil.test'},403], [{'sec-fetch-site':'cross-site'},403],
    [{'content-type':'text/plain'},415], [{'content-encoding':'gzip'},415], [{'content-length':String(BODY_LIMIT+1)},413],
  ]) assert.equal((await POST(request(valid,headers))).status,status);
  const unavailable = createRegistrationHandler({ origin: () => '', database: () => {} });
  assert.equal((await unavailable(request())).status,503);
});
test('streamed size and malformed UTF-8/JSON are rejected without Content-Length', async () => {
  const POST = createRegistrationHandler({ origin, database: () => { throw new Error('must not call'); } });
  for (const [body,status] of [[' '.repeat(BODY_LIMIT+1),413], ['{',400], [new Uint8Array([0xff]),400]]) {
    const req = new Request(origin(),{method:'POST',headers:{'content-type':'application/json'},body});
    assert.equal((await POST(req)).status,status);
  }
});
test('fixed budget ignores forged forwarding/IP headers and resets after a minute', async () => {
  let time=0;
  const POST = createRegistrationHandler({ origin, now: () => time, database: () => {} });
  for (let i=0;i<20;i++) assert.equal((await POST(request({}, {'x-forwarded-for':String(i)}))).status,400);
  const res=await POST(request({})); assert.equal(res.status,429); assert.equal(res.headers.get('retry-after'),'60');
  time=60000; assert.equal((await POST(request({}))).status,400);
});
test('at most two in-flight bodies; body deadline releases capacity', async () => {
  const POST = createRegistrationHandler({ origin, database: () => {} });
  const stalled = () => new Request(origin(),{method:'POST',headers:{'content-type':'application/json'},body:new ReadableStream({start(){}}),duplex:'half'});
  const pending = [POST(stalled()),POST(stalled())];
  assert.equal((await POST(request({}))).status,429);
  assert.deepEqual((await Promise.all(pending)).map(res=>res.status),[408,408]);
  assert.equal((await POST(request({}))).status,400);
});
