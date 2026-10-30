import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, writeFile, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { verify } from '@node-rs/argon2';
import { roleIdentifier } from '../../scripts/database/provision.mjs';
import { emailLengthCases } from './email-length-fixtures.mjs';

// Actual app routes are copied unchanged. The DB provider is adapted only in
// this isolated temp fixture, since production refuses test DB/roles. An explicit
// prepareFixture callback may add a controlled React harness only to that copy.
export async function registrationHttpTests(t, config, admin, scenario = 'standard', runScenario, prepareFixture) {
  assert.equal(config.host,'127.0.0.1'); assert.equal(config.port,5432);
  assert.match(config.database,/^imobilead_test_[a-f0-9]{12}$/);
  assert.match(config.user,/^imobilead_app_[a-f0-9]{12}$/);
  const directory = await mkdtemp(join(tmpdir(),'imobilead-registration-'));
  let child, exited;
  try {
    for (const name of ['app','components','services','server','shared','public','tsconfig.json','next.config.mjs','package.json']) await cp(resolve(name),join(directory,name),{recursive:true});
    await symlink(resolve('node_modules'),join(directory,'node_modules'),process.platform==='win32'?'junction':'dir');
    await mkdir(join(directory,'server','db'),{recursive:true});
    await writeFile(join(directory,'server','db','index.ts'), `import 'server-only';
import { Pool } from 'pg';
import { verifyRuntimePrivileges } from './config.mjs';
const config = JSON.parse(process.env.REGISTRATION_TEST_PG!);
if (config.host !== '127.0.0.1' || config.port !== 5432 || !/^imobilead_test_[a-f0-9]{12}$/.test(config.database) || !/^imobilead_app_[a-f0-9]{12}$/.test(config.user)) throw new Error('TEST_TARGET_REFUSED');
let pool: Promise<Pool> | undefined;
export function database() { return pool ??= (async () => {
  const db = new Pool({...config, max: 2, idleTimeoutMillis: 500});
  await verifyRuntimePrivileges(db); return db;
})(); }
`);
    if (prepareFixture) await prepareFixture(directory);
    const socket = createServer(); socket.listen(0,'127.0.0.1'); await once(socket,'listening');
    const port = socket.address().port; await new Promise(resolve=>socket.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    // No inherited DATABASE_URL/admin/migration credentials or .env.local copy.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|PATHEXT|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(key)));
    Object.assign(env,{ NODE_ENV:'development', NEXT_TELEMETRY_DISABLED:'1', APP_ORIGIN:origin, SESSION_TTL_SECONDS:'3600', REGISTRATION_TEST_PG:JSON.stringify(config) });
    child=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'dev',directory,'--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:directory,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    exited=once(child,'exit');
    // Framework output may contain diagnostics; never forward raw output.
    let outputBytes=0;
    for (const stream of [child.stdout,child.stderr]) stream.on('data',chunk=>{ outputBytes+=chunk.length; if(outputBytes>1024*1024) child.kill(); });
    let ready=false;
    for(let i=0;i<120;i++) {
      if(child.exitCode!==null) throw new Error('HTTP_FIXTURE_EXITED');
      try { const response=await fetch(origin+'/api/users',{signal:AbortSignal.timeout(1000)}); if(response.status===401){ ready=true; break; } } catch { /* bounded startup */ }
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.equal(ready,true,'HTTP_FIXTURE_READY');
    if (runScenario) { await runScenario(origin); return; }
    const valid={name:'Fixture',email:' Http@Example.test ',password:'Abc12345',passwordConfirmation:'Abc12345',address:"Fixture '); DROP TABLE users; --",city:'Test City',state:'Region',country:'Test Country',postalCode:'A1 Test',message:'<script>fixture</script>'};
    let count=0;
    const post=(body=valid,headers={})=>{ count++; return fetch(origin+'/api/users',{method:'POST',headers:{'content-type':'application/json',origin,...headers},body:typeof body==='string'?body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}); };
    // Separate Next instance: six length probes cannot exhaust the standard
    // scenario's budget. Production quota/clock and prior 429 checks stay intact.
    if (scenario === 'email-length') {
      await t.test('real Next HTTP: invalid email lengths return 400 and insert no rows',async()=>{
        const before=(await admin.query('SELECT count(*)::int AS n FROM imobilead.users')).rows[0].n;
        for(const fixture of emailLengthCases) {
          const response=await post({...valid,email:fixture.invalid});
          assert.equal(response.status,400);
          assert.deepEqual(await response.json(),{error:'INVALID_INPUT',fields:{email:'INVALID_EMAIL'}});
          assert.equal((await admin.query('SELECT count(*)::int AS n FROM imobilead.users WHERE email=$1',[fixture.invalid])).rows[0].n,0);
          assert.equal((await admin.query('SELECT count(*)::int AS n FROM imobilead.users')).rows[0].n,before);
        }
      });
      await t.test('real Next HTTP: valid email byte boundaries persist canonical addresses',async()=>{
        for(const fixture of emailLengthCases) {
          const response=await post({...valid,email:' '+fixture.valid.toUpperCase()+' '});
          assert.equal(response.status,201);
          const {user}=await response.json();
          const {rows:[stored]}=await admin.query('SELECT email,role FROM imobilead.users WHERE id=$1',[user.id]);
          assert.deepEqual(stored,{email:fixture.valid,role:'user'});
        }
        assert.equal(count,6);
      });
      return;
    }
    await t.test('real Next HTTP: create, minimal projection, all fields, secure hash and no session',async()=>{
      const response=await post(); assert.equal(response.status,201);
      assert.equal(response.headers.get('set-cookie'),null); assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal(response.headers.get('access-control-allow-origin'),null);
      const data=await response.json(); assert.deepEqual(Object.keys(data),['user']); assert.deepEqual(Object.keys(data.user),['id']);
      const {rows:[row]}=await admin.query('SELECT * FROM imobilead.users WHERE id=$1',[data.user.id]);
      assert.equal(row.role,'user'); assert.equal(row.email,'http@example.test');
      for(const key of ['name','address','city','state','country','message']) assert.equal(row[key],valid[key]);
      assert.equal(row.postal_code,valid.postalCode);
      assert.match(row.password_hash,/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
      assert.equal(await verify(row.password_hash,valid.password),true);
      assert.equal(row.password_hash.includes(valid.password),false);
      assert.equal((await admin.query('SELECT count(*)::int AS n FROM imobilead.sessions')).rows[0].n,0);
    });
    await t.test('real Next HTTP: invalid input, confirmation, role and internals rejected',async()=>{
      for(const body of [{},{...valid,passwordConfirmation:'wrong'},{...valid,role:'admin'},{...valid,password_hash:'unsafe'},{...valid,id:'provided'},{...valid,email:'a@b..test'}]) assert.equal((await post(body)).status,400);
    });
    await t.test('real HTTP and PostgreSQL: canonical duplicate and concurrent duplicate',async()=>{
      assert.equal((await post({...valid,email:'HTTP@example.test'})).status,409);
      const race={...valid,email:'race-http@example.test'};
      const responses=await Promise.all([post(race),post(race)]);
      assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
      assert.equal((await admin.query('SELECT count(*)::int AS n FROM imobilead.users WHERE email=$1',[race.email])).rows[0].n,1);
    });
    await t.test('real Next HTTP: database fault returns sanitized error, grants restored',async()=>{
      try {
        await admin.query(`REVOKE INSERT(email) ON imobilead.users FROM ${roleIdentifier(config.user)}`);
        const response=await post({...valid,email:'failure@example.test'});
        assert.equal(response.status,500); assert.deepEqual(await response.json(),{error:'REGISTRATION_FAILED'});
      } finally { await admin.query(`GRANT INSERT(email) ON imobilead.users TO ${roleIdentifier(config.user)}`); }
    });
    await t.test('real Next HTTP: cross origin, forged forwarding, non-JSON, oversized and malformed bodies',async()=>{
      assert.equal((await post(valid,{origin:'https://evil.test','x-forwarded-host':new URL(origin).host})).status,403);
      assert.equal((await post(valid,{'sec-fetch-site':'cross-site'})).status,403);
      assert.equal((await post(valid,{'content-type':'text/plain'})).status,415);
      assert.equal((await post('x'.repeat(16385))).status,413);
      assert.equal((await post('{')).status,400);
    });
    await t.test('real Next HTTP: global budget rejects abuse despite spoofed IP',async()=>{
      while(count<20) assert.equal((await post({}, {'x-forwarded-for':String(count)})).status,400);
      const response=await post({}); assert.equal(response.status,429); assert.ok(Number(response.headers.get('retry-after'))>0);
    });
  } finally {
    if(child && child.exitCode===null) {
      if(process.platform==='win32') {
        const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}); await once(killer,'exit');
      } else child.kill('SIGTERM');
      await Promise.race([exited,new Promise((_,reject)=>setTimeout(()=>reject(new Error('HTTP_FIXTURE_CLEANUP_FAILED')),5000))]);
    }
    const target=await realpath(directory), base=await realpath(tmpdir()), local=relative(base,target);
    if(isAbsolute(local)||local.startsWith('..')||!local.startsWith('imobilead-registration-')) throw new Error('FIXTURE_CLEANUP_REFUSED');
    // Boundary verified before either deletion. rm removes the junction itself,
    // never recursively follows its dependency target.
    await rm(join(target,'node_modules'),{recursive:true,force:true});
    await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:500});
  }
  await registrationHttpTests(t, config, admin, 'email-length');
}
