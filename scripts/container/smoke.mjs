import assert from 'node:assert/strict';
import https from 'node:https';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

// Run only against an explicitly named disposable Compose project. No dotenv.
const project = process.env.COMPOSE_PROJECT_NAME;
assert.match(project ?? '', /^ic-smoke-[a-z0-9-]+$/);
const port = Number(process.env.COMPOSE_HTTP_PORT || 3000);
const origin = `https://localhost:${port}`;
const compose = (...args) => {
  const result = spawnSync('docker', ['compose', '-p', project, ...args], { encoding: 'utf8', timeout: 180000 });
  assert.equal(result.status, 0, `Compose command failed: ${args[0]} (diagnostics withheld)`);
  return result.stdout.trim();
};
const sql = query => compose('exec', '-T', '-e', 'PGPASSWORD=compose_only_admin_2026', 'db',
  'psql', '-h', '127.0.0.1', '-U', 'compose_admin', '-d', 'imobilead', '-v', 'ON_ERROR_STOP=1', '-tAc', query);
// Trust bypass is scoped to this one client for the disposable local TLS endpoint.
// Neither NODE_TLS_REJECT_UNAUTHORIZED nor application configuration is changed.
function request(path, { method = 'GET', body, cookie, etag } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(origin + path, { method, rejectUnauthorized: false, family: 4,
      headers: { origin, ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}), ...(etag ? { 'if-match': etag } : {}) } }, response => {
      let data = ''; response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers,
        json: () => JSON.parse(data), text: data }));
    });
    req.setTimeout(15000, () => req.destroy(new Error('HTTP_TIMEOUT')));
    req.on('error', reject); req.end(body ? JSON.stringify(body) : undefined);
  });
}
const tag = randomBytes(6).toString('hex');
const password = 'ContainerFixture123';
const accounts = [];
for (let n = 0; n < 2; n++) {
  const email = `container-${tag}-${n}@example.test`;
  const signup = await request('/api/users', { method: 'POST', body: { name: 'Container Fixture', email,
    password, passwordConfirmation: password, city: 'Curitiba', country: 'Brasil' } });
  assert.equal(signup.status, 201);
  const id = signup.json().user.id; assert.match(id, /^[a-f0-9-]{36}$/);
  const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  const header = login.headers['set-cookie'][0];
  assert.match(header, /HttpOnly/); assert.match(header, /Secure/); assert.match(header, /^__Host-/);
  accounts.push({ id, email, cookie: header.split(';')[0] });
}
const [user, admin] = accounts;
sql(`UPDATE imobilead.users SET role='admin' WHERE id='${admin.id}'`);
assert.equal((await request('/api/users')).status, 401);
assert.equal((await request('/api/users', { cookie: user.cookie })).status, 403);
const list = await request('/api/users', { cookie: admin.cookie }); assert.equal(list.status, 200);
assert.doesNotMatch(list.text, /password|token_hash/);
assert.equal((await request('/api/users/' + user.id, { cookie: user.cookie })).status, 200);
const profile = await request('/api/profile', { cookie: user.cookie }); assert.equal(profile.status, 200);
const edit = await request('/api/profile', { method: 'PATCH', cookie: user.cookie, etag: profile.headers.etag,
  body: { expectedVersion: profile.json().profileVersion, city: 'Container Persisted' } });
assert.equal(edit.status, 200);
const home = await request('/'); assert.equal(home.status, 200);
assert.match(home.headers['content-security-policy'], /https:\/\/api.open-meteo.com/);
assert.equal(sql('SELECT count(*) FROM imobilead_meta.pgmigrations'), '2');
assert.equal(sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='imobilead-app' AND usename <> 'imobilead_app'"), '0');
console.log('COMPOSE_HTTP_OK signup/login/Secure-cookie/profile/user/admin/CSP/migrations');

// Exercise both restart and recreation with the same named volume/session.
compose('restart', 'db', 'app', 'gateway');
async function healthySession() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await request('/api/auth/session', { cookie: user.cookie })).status === 200) return;
    } catch { /* bounded retry during restart */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('PERSISTED_SESSION_NOT_READY');
}
await healthySession();
compose('down');
compose('up', '-d', '--wait', '--wait-timeout', '120');
await healthySession();
assert.equal((await request('/api/profile', { cookie: user.cookie })).json().user.city, 'Container Persisted');
console.log('COMPOSE_PERSISTENCE_OK restart/recreate/session/profile/idempotent-init');
const deletion = await request('/api/users/' + user.id, { method: 'DELETE', cookie: admin.cookie });
assert.equal(deletion.status, 204);
assert.equal((await request('/api/auth/session', { cookie: user.cookie })).status, 401);
assert.equal(sql(`SELECT count(*) FROM imobilead.sessions WHERE user_id='${user.id}'`), '0');
assert.equal((await request('/api/auth/logout', { method: 'POST', cookie: admin.cookie })).status, 200);
assert.equal((await request('/api/auth/session', { cookie: admin.cookie })).status, 401);
console.log('COMPOSE_DELETE_LOGOUT_OK session-cascade/revocation');

const containers = compose('ps', '-a', '--format', 'json').split('\n').filter(Boolean).map(line => JSON.parse(line));
assert.equal(containers.find(c => c.Service === 'db-init').ExitCode, 0);
for (const service of ['db', 'app', 'gateway']) assert.equal(containers.find(c => c.Service === service).Health, 'healthy');
const id = compose('ps', '-q', 'app');
const inspect = spawnSync('docker', ['inspect', id], { encoding: 'utf8' });
assert.equal(inspect.status, 0);
const info = JSON.parse(inspect.stdout)[0];
assert.equal(info.Config.User, 'node'); assert.equal(info.HostConfig.ReadonlyRootfs, true);
assert.deepEqual(info.HostConfig.CapDrop, ['ALL']);
assert.ok(info.HostConfig.SecurityOpt.includes('no-new-privileges:true'));
assert.ok(!info.Config.Env.some(e => /^(ADMIN_|MIGRATION_)/.test(e)));
const dbId = compose('ps', '-q', 'db');
const db = JSON.parse(spawnSync('docker', ['inspect', dbId], { encoding: 'utf8' }).stdout)[0];
assert.equal(db.HostConfig.PortBindings['5432/tcp'], undefined);
assert.equal(sql('SHOW listen_addresses'), '127.0.0.1');
assert.equal(sql('SHOW password_encryption'), 'scram-sha-256');
compose('run', '--rm', '-T', '--no-deps', 'db-init', 'node', 'scripts/database/cli.mjs', 'check-app');
assert.equal(compose('exec', '-T', 'app', 'node', '-e', `
const fs=require('node:fs');
if (process.getuid()===0 || ['.env','.env.local','.env.compose','.git','tests','scripts/database'].some(p=>fs.existsSync(p))) process.exit(1);
console.log('IMAGE_FILES_OK');`), 'IMAGE_FILES_OK');
const image = info.Image;
const imageInfo = JSON.parse(spawnSync('docker', ['image', 'inspect', image], { encoding: 'utf8' }).stdout)[0];
assert.ok(!imageInfo.Config.Env.some(e => /DATABASE_URL|PASSWORD|TOKEN|SECRET/.test(e)));
const history = spawnSync('docker', ['history', '--no-trunc', '--format', '{{.CreatedBy}}', image], { encoding: 'utf8' });
assert.equal(history.status, 0);
assert.doesNotMatch(history.stdout, /compose_only_|DATABASE_URL|REPLACE_LOCALLY/);
console.log('COMPOSE_SECURITY_OK non-root/read-only/capabilities/credentials/loopback/SCRAM/no-published-DB');
