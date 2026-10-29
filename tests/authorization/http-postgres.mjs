import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { promoteUser } from '../../scripts/database/admin-user.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';

export function authorizationHttpTests(t, config, admin, adminConfig) {
  return registrationHttpTests(t,config,admin,'authorization',async origin=>{
    const password='Abc12345', ids=[], cookies=[];
    const digest=cookie=>createHash('sha256').update(cookie.split('=')[1]).digest();
    const get=(id,cookie,query='',headers={})=>fetch(origin+'/api/users'+(id===undefined?'':'/'+id)+query,{headers:{...(cookie?{cookie}:{}),...headers},signal:AbortSignal.timeout(15000)});
    const denied=async(response,status)=>{
      assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
      assert.deepEqual(await response.json(),{error:status===401?'UNAUTHENTICATED':'FORBIDDEN'});
    };
    const fields=['id','name','email','address','city','state','country','postalCode','message'].sort();
    const projection=row=>assert.deepEqual(Object.keys(row).sort(),fields);
    await t.test('authorization HTTP/PG: public signup, two users and admin via explicit provisioner',async()=>{
      for(let n=0;n<3;n++) {
        const response=await fetch(origin+'/api/users',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({name:'Authorization Fixture '+n,email:`authz${n}@example.test`,password,passwordConfirmation:password,city:'Fixture City',message:'<script>fixture</script>'})});
        assert.equal(response.status,201);assert.equal(response.headers.get('set-cookie'),null);ids.push((await response.json()).user.id);
        const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:`authz${n}@example.test`,password})});
        assert.equal(login.status,200);cookies.push(login.headers.get('set-cookie').split(';')[0]);
      }
      await promoteUser(admin,adminConfig,ids[2]);
      assert.equal((await admin.query('SELECT role FROM imobilead.users WHERE id=$1',[ids[2]])).rows[0].role,'admin');
      await assert.rejects(promoteUser(admin,adminConfig,'bad'),{message:'ADMIN_USER_INVALID_ID'});
      await assert.rejects(promoteUser(admin,adminConfig,randomUUID()),{message:'ADMIN_USER_NOT_FOUND'});
      // Application credential cannot invoke administrative operation.
      const pg=(await import('pg')).default, app=new pg.Client(config);await app.connect();
      try { await assert.rejects(promoteUser(app,config,ids[0]),{message:'ADMIN_CREDENTIAL_REQUIRED'}); }
      finally {await app.end();}
    });
    await t.test('authorization HTTP/PG: no/invalid/expired/revoked session is 401 on both routes',async()=>{
      for(const cookie of [undefined,'imobilead_session=bad','imobilead_session='+'A'.repeat(43)])
        for(const id of [undefined,ids[0]]) await denied(await get(id,cookie),401);
      for(const sql of ["created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour'",'revoked_at=now()']) {
        const token=Buffer.from(randomUUID().replaceAll('-','').repeat(2),'hex').toString('base64url');
        const cookie='imobilead_session='+token;
        await admin.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(cookie),ids[0]]);
        await admin.query(`UPDATE imobilead.sessions SET ${sql} WHERE token_hash=$1`,[digest(cookie)]);
        for(const id of [undefined,ids[0]]) await denied(await get(id,cookie),401);
      }
    });
    await t.test('authorization HTTP/PG: own only, foreign existing/missing/malformed uniform 403',async()=>{
      for(let n=0;n<2;n++) {
        const response=await get(ids[n],cookies[n]);assert.equal(response.status,200);
        assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();
        projection(body.user);assert.equal(body.user.id,ids[n]);assert.equal(body.user.email,`authz${n}@example.test`);
        for(const id of [undefined,ids[1-n],randomUUID(),'bad']) await denied(await get(id,cookies[n]),403);
      }
    });
    await t.test('authorization HTTP/PG: query/header/cookie/body identity forgery cannot grant access',async()=>{
      for(const query of ['',`?role=admin&userId=${ids[2]}`])
        await denied(await get(undefined,cookies[0]+'; role=admin; userId='+ids[2],query,{'x-role':'admin','x-user-id':ids[2],authorization:'Bearer admin'}),403);
      const result=await new Promise((resolve,reject)=>{
        const body=JSON.stringify({role:'admin',userId:ids[2]});
        const req=httpRequest(origin+'/api/users',{method:'GET',headers:{cookie:cookies[0],'content-type':'application/json','content-length':Buffer.byteLength(body)}},res=>{
          let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,text}));
        });req.on('error',reject);req.setTimeout(15000,()=>req.destroy(new Error('PROBE_TIMEOUT')));req.end(body);
      });
      assert.equal(result.status,403);assert.deepEqual(JSON.parse(result.text),{error:'FORBIDDEN'});
      assert.equal((await get(ids[0],cookies[0],'?userId='+ids[1])).status,400);
    });
    await t.test('authorization HTTP/PG: admin all pages, individual projection, invalid and absent',async()=>{
      await admin.query("INSERT INTO imobilead.users(name,email,password_hash) SELECT 'Page Fixture','authz-page-'||n||'@example.test','$fixture' FROM generate_series(1,101) n");
      const seen=new Set();let cursor=null,pages=0;
      do {
        const response=await get(undefined,cookies[2],cursor?'?after='+cursor:'');assert.equal(response.status,200);
        assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();
        assert.ok(body.users.length<=100);for(const row of body.users){projection(row);assert.ok(!seen.has(row.id));seen.add(row.id);}
        cursor=body.nextCursor;pages++;
      } while(cursor && pages<5);
      assert.equal(cursor,null);assert.equal(pages,2);for(const id of ids) assert.ok(seen.has(id));assert.equal(seen.size,104);
      for(const id of ids) {const response=await get(id,cookies[2]);assert.equal(response.status,200);projection((await response.json()).user);}
      assert.equal((await get('bad',cookies[2])).status,400);assert.equal((await get(randomUUID(),cookies[2])).status,404);
      assert.equal((await get(undefined,cookies[2],'?after=bad')).status,400);
    });
    await t.test('authorization HTTP/PG: demotion takes effect on next request with same session',async()=>{
      await admin.query("UPDATE imobilead.users SET role='user' WHERE id=$1",[ids[2]]);
      await denied(await get(undefined,cookies[2]),403);await denied(await get(ids[0],cookies[2]),403);
      assert.equal((await get(ids[2],cookies[2])).status,200);
      const session=await fetch(origin+'/api/auth/session',{headers:{cookie:cookies[2]}});assert.equal(session.status,200);
      assert.deepEqual(Object.keys((await session.json()).user),['id']);
    });
    await t.test('authorization HTTP/PG: database error sanitized and logout prevents access',async()=>{
      const role=roleIdentifier(config.user);
      try {
        await admin.query(`REVOKE SELECT ON imobilead.users FROM ${role}`);
        const response=await get(ids[0],cookies[0]);assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'USERS_FAILED'});
      } finally {await admin.query(`GRANT SELECT ON imobilead.users TO ${role}`);}
      const response=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{origin,cookie:cookies[0]}});assert.equal(response.status,200);
      await denied(await get(ids[0],cookies[0]),401);
    });
    await admin.query("DELETE FROM imobilead.users WHERE email LIKE 'authz%@example.test'");
  });
}
