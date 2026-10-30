import test from 'node:test';
import assert from 'node:assert/strict';
import { mayRead } from '../../server/users/policy.mjs';
import { createUsersHandler } from '../../server/users/handler.mjs';
import { newSessionToken } from '../../server/auth/session.mjs';
import { promoteUser } from '../../scripts/database/admin-user.mjs';

const own = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002';
const token = newSessionToken();
const config = () => ({ origin: 'http://localhost:3000', ttl: '3600', production: false });
function fixture({ actor = { id: own, role: 'user' }, fail = false, authenticated = true, records } = {}) {
  const calls = [], diagnostics = [];
  const database = async () => ({ query: async (sql, values) => {
    calls.push({ sql, values });
    if (typeof fail === 'function' ? fail(sql) : fail) throw new Error('private SQL credentials row');
    if (sql.includes('JOIN')) return { rows: authenticated ? [{ id: own, revoked_at: null, expires_at: new Date(Date.now()+60000) }] : [] };
    if (sql.startsWith('SELECT id,role')) return { rows: actor ? [actor] : [] };
    return { rows: records ?? [{ id: own, name: 'Fixture', email: 'own@example.test', password_hash: 'secret', role: 'admin', token_hash: 'secret' }] };
  } });
  const handler = createUsersHandler({ database, config, diagnostic: code => diagnostics.push(code) });
  return { calls, diagnostics, get: (id, query = '', cookie = `imobilead_session=${token}`) => handler(new Request(config().origin+'/api/users'+query, { headers: { cookie, role: 'admin', 'x-user-id': other } }), id) };
}

test('pure authorization matrix denies unknown/incomplete identities and foreign targets', () => {
  for (const actor of [null, {}, { id: own }, { id: own, role: 'owner' }, { role: 'admin' }, { id: 'bad', role: 'admin' }])
    for (const target of [undefined, own, other]) assert.equal(mayRead(actor,target),false);
  assert.equal(mayRead({ id: own, role: 'user' },own),true);
  for (const target of [undefined, other, 'bad']) assert.equal(mayRead({id:own,role:'user'},target),false);
  for (const target of [undefined,own,other]) assert.equal(mayRead({id:own,role:'admin'},target),true);
});
test('401/403 before target read; forbidden bodies contain no foreign data', async () => {
  for (const id of [undefined,other,'bad']) {
    const f = fixture(), response = await f.get(id,'?role=admin&id='+other);
    assert.equal(response.status,403); assert.deepEqual(await response.json(),{error:'FORBIDDEN'});
    assert.equal(f.calls.length,2);
  }
  for (const cookie of ['', 'imobilead_session=bad']) {
    const f=fixture(); assert.equal((await f.get(own,'',cookie)).status,401); assert.equal(f.calls.length,0);
  }
  assert.equal((await fixture({authenticated:false}).get(own)).status,401);
  for (const actor of [null,{id:own},{id:own,role:'owner'},{id:other,role:'admin'}]) assert.equal((await fixture({actor}).get(own)).status,403);
});
test('own projection allowlist, no-store, parameterized SQL and rejected identity query',async()=>{
  const f=fixture(),response=await f.get(own);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{user:{id:own,name:'Fixture',email:'own@example.test'}});
  assert.deepEqual(f.calls.at(-1).values,[own]);assert.doesNotMatch(f.calls.at(-1).sql,/SELECT \*/);
  assert.equal((await f.get(own,'?id='+other)).status,400);
});
test('admin pagination, invalid identifiers and missing resources',async()=>{
  const f=fixture({actor:{id:own,role:'admin'},records:Array.from({length:101},()=>({id:own,role:'user',password_hash:'secret',token_hash:'secret'}))});
  const response=await f.get(undefined,'?after='+other), body=await response.json();
  assert.equal(response.status,200);assert.equal(body.users.length,100);assert.equal(body.nextCursor,own);
  assert.equal(body.users[0].role,'user');assert.equal('password_hash' in body.users[0],false);assert.equal('token_hash' in body.users[0],false);
  assert.deepEqual(f.calls.at(-1).values,[other]);
  for (const query of ['?role=admin','?after=bad','?after='+own+'&after='+other]) assert.equal((await f.get(undefined,query)).status,400);
  assert.equal((await f.get('bad')).status,400);
  assert.equal((await fixture({actor:{id:own,role:'admin'},records:[]}).get(other)).status,404);
});
test('database failures are sanitized and closed',async()=>{
  for (const fail of [true, sql=>sql.startsWith('SELECT id,role'), sql=>sql.includes('postal_code')]) {
    const f=fixture({fail}),response=await f.get(own);
    assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');
    assert.deepEqual(await response.json(),{error:'USERS_FAILED'});assert.deepEqual(f.diagnostics,['USERS_FAILED']);
  }
});
test('admin operation validates UUID before SQL',async()=>{
  await assert.rejects(promoteUser({query:()=>assert.fail('unexpected SQL')},{},'bad'),{message:'ADMIN_USER_INVALID_ID'});
});
