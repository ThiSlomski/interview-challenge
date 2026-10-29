import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createHash } from 'node:crypto';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';

// Reuses existing bounded Next fixture and disposable DB guard/cleanup.
export function authenticationHttpTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'authentication', async origin => {
    const password='Abc12345';
    const call=(path, {body, cookie, headers={}, method='POST'}={})=>fetch(origin+'/api/auth/'+path,{
      method, headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...headers},
      ...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),
    });
    const login=(n=0, extra={})=>call('login',{body:{email:`auth${n}@example.test`,password},...extra});
    const session=cookie=>call('session',{method:'GET',cookie});
    const logout=cookie=>call('logout',{cookie});
    const cookieOf=res=>res.headers.get('set-cookie')?.split(';')[0];
    const digest=cookie=>createHash('sha256').update(cookie.split('=')[1]).digest();
    let first, second, expires, userId;
    await t.test('auth real HTTP/PG: registration remains sessionless; fixture accounts',async()=>{
      const response=await fetch(origin+'/api/users',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({name:'Auth Fixture',email:'auth0@example.test',password,passwordConfirmation:password})});
      assert.equal(response.status,201);assert.equal(response.headers.get('set-cookie'),null);
      userId=(await response.json()).user.id;
      for(let n=1;n<6;n++) await admin.query('INSERT INTO imobilead.users(name,email,password_hash) SELECT name,$1,password_hash FROM imobilead.users WHERE id=$2',[`auth${n}@example.test`,userId]);
    });
    await t.test('auth real HTTP/PG: valid login, cookie, digest only, absolute one hour',async()=>{
      const response=await login();assert.equal(response.status,200);
      assert.deepEqual(await response.json(),{user:{id:userId}});
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal(response.headers.get('access-control-allow-origin'),null);
      const header=response.headers.get('set-cookie');first=cookieOf(response);
      assert.match(header,/HttpOnly/i);assert.match(header,/SameSite=Lax/i);assert.match(header,/Path=\//i);
      assert.doesNotMatch(header,/;\s*(Secure|Domain)=?/i);
      assert.match(first,/^imobilead_session=[A-Za-z0-9_-]{43}$/);
      const {rows:[row]}=await admin.query('SELECT token_hash,created_at,expires_at FROM imobilead.sessions WHERE token_hash=$1',[digest(first)]);
      assert.ok(row);assert.equal(row.token_hash.length,32);assert.notEqual(row.token_hash.toString(),first.split('=')[1]);
      assert.equal(row.expires_at-row.created_at,3600000);expires=row.expires_at;
      assert.equal((await session(first)).status,200);
      const after=(await admin.query('SELECT expires_at FROM imobilead.sessions WHERE token_hash=$1',[digest(first)])).rows[0];
      assert.deepEqual(after.expires_at,expires);
    });
    await t.test('auth real HTTP/PG: generic credentials and exact unmodified password',async()=>{
      const wrong=await login(1,{body:{email:'auth1@example.test',password:'Wrong123'}});
      const absent=await login(1,{body:{email:'absent@example.test',password:'Wrong123'}});
      assert.equal(wrong.status,401);assert.equal(absent.status,401);assert.deepEqual(await wrong.json(),await absent.json());
      assert.equal(wrong.headers.get('set-cookie'),null);
      assert.equal((await login(1,{body:{email:'auth1@example.test',password:' '+password+' '}})).status,401);
      assert.equal((await login(1,{body:{email:' AUTH1@EXAMPLE.TEST ',password}})).status,200);
    });
    await t.test('auth real HTTP/PG: fresh simultaneous logins preserve previous and other sessions',async()=>{
      const responses=await Promise.all([login(2),login(2)]);assert.deepEqual(responses.map(r=>r.status),[200,200]);
      const cookies=responses.map(cookieOf);assert.notEqual(cookies[0],cookies[1]);
      for(const cookie of [first,...cookies]) assert.equal((await session(cookie)).status,200);
      second=cookies[1];
    });
    await t.test('auth real HTTP/PG: missing, malformed, tampered and expired tokens fail closed',async()=>{
      for(const cookie of [undefined,'imobilead_session=bad','imobilead_session='+'A'.repeat(43)]) assert.equal((await session(cookie)).status,401);
      const response=await login(3);assert.equal(response.status,200);const expired=cookieOf(response);
      await admin.query("UPDATE imobilead.sessions SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE token_hash=$1",[digest(expired)]);
      assert.equal((await session(expired)).status,401);
    });
    await t.test('auth real HTTP/PG: logout revokes, repeats and rejects replay without affecting other sessions',async()=>{
      const response=await logout(first);assert.equal(response.status,200);
      assert.match(response.headers.get('set-cookie'),/Max-Age=0/i);
      assert.ok((await admin.query('SELECT revoked_at FROM imobilead.sessions WHERE token_hash=$1',[digest(first)])).rows[0].revoked_at);
      assert.equal((await session(first)).status,401);assert.equal((await logout(first)).status,200);
      assert.equal((await logout()).status,200);assert.equal((await session(second)).status,200);
    });
    await t.test('auth real HTTP/PG: database read/create/revoke errors sanitized and no success cookie',async()=>{
      const role=roleIdentifier(config.user);
      for(const [privilege,action] of [['SELECT',()=>session(second)],['INSERT',()=>login(4)],['UPDATE',()=>logout(second)]]) {
        try {
          await admin.query(`REVOKE ${privilege} ON imobilead.sessions FROM ${role}`);
          const response=await action();assert.equal(response.status,503);
          const body=await response.json();assert.deepEqual(body,{error:'AUTH_FAILED'});
          assert.equal(response.headers.get('set-cookie'),null);
        } finally {await admin.query(`GRANT ${privilege} ON imobilead.sessions TO ${role}`);}
      }
      assert.equal((await session(second)).status,200);
    });
    await t.test('auth real HTTP: malformed bodies, origins, navigation metadata and no GET mutation',async()=>{
      for(const path of ['login','logout']) {
        for(const headers of [{origin:'null'},{origin:'https://evil.test'},{'sec-fetch-site':'cross-site'}]) assert.equal((await call(path,{body:{},headers})).status,403);
        // fetch/undici overwrites Sec-Fetch-Mode; raw HTTP preserves the probe.
        const navigationStatus=await new Promise((resolve,reject)=>{
          const req=httpRequest(origin+'/api/auth/'+path,{method:'POST',headers:{origin,'content-type':'application/json','sec-fetch-mode':'navigate'}},res=>{res.resume();resolve(res.statusCode);});
          req.on('error',reject);req.setTimeout(15000,()=>req.destroy(new Error('HTTP_PROBE_TIMEOUT')));req.end('{}');
        });
        assert.equal(navigationStatus,403);
        const missing=await fetch(origin+'/api/auth/'+path,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(missing.status,403);
        assert.equal((await call(path,{method:'GET'})).status,405);
      }
      assert.equal((await call('login',{body:'{'})).status,400);
      assert.equal((await call('login',{body:'x'.repeat(4097)})).status,413);
      assert.equal((await call('login',{body:{},headers:{'content-type':'text/plain'}})).status,415);
      assert.equal((await call('login',{body:{role:'admin'}})).status,400);
    });
    await t.test('auth real HTTP: identifier quota survives forged IP headers',async()=>{
      // Account 5 gets exactly five attempts then a temporary refusal.
      for(let n=0;n<5;n++) assert.equal((await login(5,{body:{email:'auth5@example.test',password:'Wrong123'},headers:{'x-forwarded-for':String(n)}})).status,401);
      assert.equal((await login(5)).status,429);
    });
    // Do not leave rows for the pre-existing DB suite's session assertions.
    await admin.query("DELETE FROM imobilead.users WHERE email LIKE 'auth%@example.test'");
  });
}

