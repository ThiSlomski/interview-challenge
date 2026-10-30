import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { loadLocalEnvironment, localConnection, requireAuthenticationConfirmation, safeFailure } from '../../scripts/database/config.mjs';
import { provisionSql, runtimeGrantsSql, roleIdentifier } from '../../scripts/database/provision.mjs';
import { migrate } from '../../scripts/database/migrate.mjs';
import { verifyRuntimePrivileges } from '../../server/db/config.mjs';
import { authenticationHttpTests } from '../auth/http-postgres.mjs';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { authorizationHttpTests } from '../authorization/http-postgres.mjs';
import { uiBrowserTests } from '../ui/browser.mjs';
import { uiRaceTests } from '../ui/races.mjs';
import { profileHttpTests } from '../profile/http-postgres.mjs';
import { profileBrowserTests } from '../profile/browser.mjs';
import { adminDeleteHttpTests } from '../admin-delete/http-postgres.mjs';
import { adminDeleteBrowserTests } from '../admin-delete/browser.mjs';
import { homeBrowserTests } from '../ui/home.mjs';

// Explicitly separate from npm test. No mocks and no fallback to imobilead.
// Requires explicit authorization of its disposable local destination.
test('PostgreSQL migrations, constraints, sessions and runtime permissions', async t => {
  const tag = randomBytes(6).toString('hex');
  const database = `imobilead_test_${tag}`;
  const migrationRole = `imobilead_migrate_${tag}`, appRole = `imobilead_app_${tag}`;
  const password = randomBytes(32).toString('hex');
  let created = false, rolesCreated = false, app, dbAdmin, admin, failure, protectedBefore;
  const protectedMetadata = async () => (await admin.query(`SELECT jsonb_build_object(
    'relations', (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.oid) FROM
      (SELECT c.oid,c.relname,c.relowner,c.relacl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname IN ('imobilead','imobilead_meta')) x),
    'schemas', (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.oid) FROM
      (SELECT oid,nspname,nspowner,nspacl FROM pg_namespace WHERE nspname IN ('imobilead','imobilead_meta')) x),
    'roles', (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.oid) FROM
      (SELECT oid,rolname,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles
       WHERE rolname IN ('imobilead_app','imobilead_migrate')) x)) AS snapshot`)).rows[0].snapshot;
  try {
    loadLocalEnvironment();
    requireAuthenticationConfirmation();
    if (process.env.DB_DISPOSABLE_TEST_AUTHORIZED !== 'true') throw new Error('DATABASE_DISPOSABLE_AUTHORIZATION_REQUIRED');
    const base = localConnection(process.env.TEST_ADMIN_DATABASE_URL);
    admin = new pg.Client(base);
    await admin.connect();
    protectedBefore = await protectedMetadata();
    await admin.query(`CREATE DATABASE "${database}"`); created = true;
    dbAdmin = new pg.Client({ ...base, database }); await dbAdmin.connect();
    await dbAdmin.query('BEGIN');
    await dbAdmin.query(provisionSql(migrationRole, appRole));
    // Generated hexadecimal password is never printed or passed on command lines.
    await dbAdmin.query(`ALTER ROLE ${roleIdentifier(migrationRole)} PASSWORD '${password}'`);
    await dbAdmin.query(`ALTER ROLE ${roleIdentifier(appRole)} PASSWORD '${password}'`);
    await dbAdmin.query('COMMIT'); rolesCreated = true;
    const migrationConfig = { ...base, database, user: migrationRole, password };
    assert.equal((await migrate(migrationConfig)).length, 2);
    assert.equal((await migrate(migrationConfig)).length, 0);
    await dbAdmin.query(runtimeGrantsSql(appRole));
    app = new pg.Client({ ...base, database, user: appRole, password }); await app.connect();
    const runtime = roleIdentifier(appRole);
    if (process.env.HOME_BROWSER_TEST === 'true') {
      await homeBrowserTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    } else if (process.env.ADMIN_DELETE_BROWSER_TEST === 'true') {
      await adminDeleteBrowserTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    } else if (process.env.PROFILE_BROWSER_TEST === 'true') {
      await profileBrowserTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    } else if (process.env.UI_RACE_TEST === 'true') {
      await uiRaceTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    } else if (process.env.UI_BROWSER_TEST === 'true') {
      await uiBrowserTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    } else {
      await authenticationHttpTests(t, { ...base, database, user: appRole, password }, dbAdmin);
      await authorizationHttpTests(t, { ...base, database, user: appRole, password }, dbAdmin, { ...base, database });
      await registrationHttpTests(t, { ...base, database, user: appRole, password }, dbAdmin);
      await profileHttpTests(t, { ...base, database, user: appRole, password }, dbAdmin);
      await adminDeleteHttpTests(t, { ...base, database, user: appRole, password }, dbAdmin);
    }
    await t.test('expected effective contract accepts column INSERT without whole-table INSERT', async () => {
      await verifyRuntimePrivileges(app);
      const { rows: [rights] } = await app.query(`SELECT
        has_table_privilege(current_user,'imobilead.users','INSERT') AS table_insert,
        has_column_privilege(current_user,'imobilead.users','email','INSERT') AS email_insert,
        has_column_privilege(current_user,'imobilead.users','role','INSERT') AS role_insert`);
      assert.deepEqual(rights, { table_insert: false, email_insert: true, role_insert: false });
    });
    // All mutations below use dbAdmin, connected only to this execution's database.
    // Restore the expected contract and recheck it after every scenario, even on failure.
    async function rejectDrift(name, changes, restore, effectiveProbe) {
      await t.test(name, async () => {
        try {
          for (const sql of changes) await dbAdmin.query(sql);
          if (effectiveProbe) {
            const { rows: [effective] } = await app.query(effectiveProbe);
            assert.equal(effective.allowed, true);
          }
          await assert.rejects(verifyRuntimePrivileges(app), { message: 'PRIVILEGED_APPLICATION_ROLE_REFUSED' });
        } finally {
          for (const sql of restore) await dbAdmin.query(sql);
          await verifyRuntimePrivileges(app);
        }
      });
    }
    await rejectDrift('reject column UPDATE(role)',
      [`GRANT UPDATE(role) ON imobilead.users TO ${runtime}`],
      [`REVOKE UPDATE(role) ON imobilead.users FROM ${runtime}`],
      "SELECT has_column_privilege(current_user,'imobilead.users','role','UPDATE') AS allowed");
    await rejectDrift('reject whole-table UPDATE',
      [`GRANT UPDATE ON imobilead.users TO ${runtime}`],
      [`REVOKE UPDATE ON imobilead.users FROM ${runtime}`, runtimeGrantsSql(appRole)]);
    await rejectDrift('reject column INSERT(role)',
      [`GRANT INSERT(role) ON imobilead.users TO ${runtime}`],
      [`REVOKE INSERT(role) ON imobilead.users FROM ${runtime}`]);
    await rejectDrift('reject whole-table INSERT including role',
      [`GRANT INSERT ON imobilead.users TO ${runtime}`],
      // PostgreSQL also revokes column INSERT grants when revoking table INSERT.
      [`REVOKE INSERT ON imobilead.users FROM ${runtime}`, runtimeGrantsSql(appRole)]);
    await rejectDrift('reject missing required DELETE users',
      [`REVOKE DELETE ON imobilead.users FROM ${runtime}`],
      [`GRANT DELETE ON imobilead.users TO ${runtime}`]);
    await rejectDrift('reject DELETE users with grant option',
      [`GRANT DELETE ON imobilead.users TO ${runtime} WITH GRANT OPTION`],
      [`REVOKE GRANT OPTION FOR DELETE ON imobilead.users FROM ${runtime}`]);
    await rejectDrift('reject direct DELETE sessions',
      [`GRANT DELETE ON imobilead.sessions TO ${runtime}`],
      [`REVOKE DELETE ON imobilead.sessions FROM ${runtime}`]);
    await rejectDrift('reject TRUNCATE users',
      [`GRANT TRUNCATE ON imobilead.users TO ${runtime}`],
      [`REVOKE TRUNCATE ON imobilead.users FROM ${runtime}`]);
    await rejectDrift('reject missing required SELECT sessions',
      [`REVOKE SELECT ON imobilead.sessions FROM ${runtime}`],
      [`GRANT SELECT ON imobilead.sessions TO ${runtime}`]);
    await rejectDrift('reject missing required schema USAGE',
      [`REVOKE USAGE ON SCHEMA imobilead FROM ${runtime}`],
      [`GRANT USAGE ON SCHEMA imobilead TO ${runtime}`]);
    await rejectDrift('reject missing required INSERT email column',
      [`REVOKE INSERT(email) ON imobilead.users FROM ${runtime}`],
      [`GRANT INSERT(email) ON imobilead.users TO ${runtime}`]);
    await rejectDrift('reject missing required UPDATE name column',
      [`REVOKE UPDATE(name) ON imobilead.users FROM ${runtime}`],
      [`GRANT UPDATE(name) ON imobilead.users TO ${runtime}`]);
    for (const column of ['email','password_hash','id','created_at']) {
      await rejectDrift(`reject protected column UPDATE ${column}`,
        [`GRANT UPDATE(${column}) ON imobilead.users TO ${runtime}`],
        [`REVOKE UPDATE(${column}) ON imobilead.users FROM ${runtime}`]);
    }
    await rejectDrift('reject INSERT profile_version',
      [`GRANT INSERT(profile_version) ON imobilead.users TO ${runtime}`],
      [`REVOKE INSERT(profile_version) ON imobilead.users FROM ${runtime}`]);
    await rejectDrift('reject history schema and table access',
      [`GRANT USAGE ON SCHEMA imobilead_meta TO ${runtime}`, `GRANT SELECT ON imobilead_meta.pgmigrations TO ${runtime}`],
      [`REVOKE SELECT ON imobilead_meta.pgmigrations FROM ${runtime}`, `REVOKE USAGE ON SCHEMA imobilead_meta FROM ${runtime}`]);
    await rejectDrift('reject latent history table privilege without schema access',
      [`GRANT SELECT ON imobilead_meta.pgmigrations TO ${runtime}`],
      [`REVOKE SELECT ON imobilead_meta.pgmigrations FROM ${runtime}`]);
    await rejectDrift('reject effective UPDATE(role) via PUBLIC in disposable database',
      ['GRANT UPDATE(role) ON imobilead.users TO PUBLIC'],
      ['REVOKE UPDATE(role) ON imobilead.users FROM PUBLIC'],
      "SELECT has_column_privilege(current_user,'imobilead.users','role','UPDATE') AS allowed");
    await rejectDrift('reject effective DELETE via PUBLIC in disposable database',
      ['GRANT DELETE ON imobilead.sessions TO PUBLIC'],
      ['REVOKE DELETE ON imobilead.sessions FROM PUBLIC'],
      "SELECT has_table_privilege(current_user,'imobilead.sessions','DELETE') AS allowed");
    await rejectDrift('reject excess TRUNCATE sessions',
      [`GRANT TRUNCATE ON imobilead.sessions TO ${runtime}`],
      [`REVOKE TRUNCATE ON imobilead.sessions FROM ${runtime}`]);
    const insert = (email, name = 'Fixture') => app.query('INSERT INTO imobilead.users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,role', [name,email,'$fixture-not-a-real-password-hash']);
    const { rows: [user] } = await insert('fixture@example.test');
    assert.equal((await app.query('SELECT profile_version FROM imobilead.users WHERE id=$1', [user.id])).rows[0].profile_version, 1);
    await assert.rejects(dbAdmin.query('UPDATE imobilead.users SET profile_version=0 WHERE id=$1', [user.id]), { code: '23514' });
    assert.equal(user.role, 'user');
    await assert.rejects(insert(' Fixture@Example.test '), { code: '23514' });
    await assert.rejects(insert('invalid-email'), { code: '23514' });
    await assert.rejects(insert('long@example.test', 'a'.repeat(151)), { code: '22001' });
    await insert('max@example.test', 'a'.repeat(150));
    const competitor = new pg.Client({ ...base, database, user: appRole, password }); await competitor.connect();
    let race;
    try { race = await Promise.allSettled([insert('race@example.test'), competitor.query('INSERT INTO imobilead.users(name,email,password_hash) VALUES($1,$2,$3)', ['Fixture','race@example.test','$fixture-hash'])]); }
    finally { await competitor.end(); }
    assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(race.find(result => result.status === 'rejected').reason.code, '23505');
    await assert.rejects(app.query("UPDATE imobilead.users SET role='admin' WHERE id=$1",[user.id]), { code: '42501' });
    await assert.rejects(app.query("INSERT INTO imobilead.users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')", ['Fixture','admin-attempt@example.test','$fixture-hash']), { code: '42501' });
    await assert.rejects(dbAdmin.query("UPDATE imobilead.users SET role='owner' WHERE id=$1",[user.id]), { code: '23514' });
    const token = randomBytes(32);
    await app.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[token,user.id]);
    await assert.rejects(app.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[token,user.id]), { code: '23505' });
    await assert.rejects(app.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[randomBytes(31),user.id]), { code: '23514' });
    await app.query('UPDATE imobilead.sessions SET revoked_at=now() WHERE token_hash=$1',[token]);
    await assert.rejects(app.query("UPDATE imobilead.sessions SET revoked_at=created_at-interval '1 second' WHERE token_hash=$1",[token]), { code: '23514' });
    await assert.rejects(app.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,gen_random_uuid(),now()+interval '1 hour')",[randomBytes(32)]), { code: '23503' });
    await assert.rejects(app.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()-interval '1 hour')",[randomBytes(32),user.id]), { code: '23514' });
    await assert.rejects(app.query('CREATE TABLE imobilead.forbidden(id integer)'), { code: '42501' });
    await assert.rejects(app.query('ALTER TABLE imobilead.users ADD COLUMN forbidden integer'), { code: '42501' });
    await assert.rejects(app.query('SELECT * FROM imobilead_meta.pgmigrations'), { code: '42501' });
    const { rows: [permissions] } = await app.query("SELECT has_schema_privilege(current_user,'public','CREATE') AS public_create");
    assert.equal(permissions.public_create, false);
    await assert.rejects(app.query('DELETE FROM imobilead.sessions WHERE user_id=$1',[user.id]), { code: '42501' });
    assert.equal((await app.query('DELETE FROM imobilead.users WHERE id=$1',[user.id])).rowCount, 1);
    assert.equal((await app.query('SELECT count(*)::integer AS count FROM imobilead.sessions')).rows[0].count,0);
  } catch (error) {
    // Never expose pg's row/detail/SQL in node:test failure reports.
    failure = new Error(safeFailure(error));
  } finally {
    const cleanupFailures = [];
    const attempt = async operation => {
      try { await operation(); }
      catch (error) { cleanupFailures.push(safeFailure(error)); }
    };
    if (app) await attempt(() => app.end());
    if (dbAdmin) await attempt(() => dbAdmin.end());
    if (created) await attempt(() => admin.query(`DROP DATABASE "${database}"`));
    if (rolesCreated) {
      await attempt(() => admin.query(`DROP ROLE ${roleIdentifier(appRole)}`));
      await attempt(() => admin.query(`DROP ROLE ${roleIdentifier(migrationRole)}`));
    }
    if (admin) {
      await attempt(async () => {
        const remaining = await admin.query('SELECT datname AS name FROM pg_database WHERE datname=$1 UNION ALL SELECT rolname AS name FROM pg_roles WHERE rolname=ANY($2)',[database,[appRole,migrationRole]]);
        if(remaining.rowCount!==0) throw new Error('DATABASE_TEST_CLEANUP_FAILED');
        assert.deepEqual(await protectedMetadata(),protectedBefore);
        console.log(JSON.stringify({cleanup:'confirmed', protectedMetadata:'unchanged',remainingResources:0}));
      });
      await attempt(() => admin.end());
    }
    if (cleanupFailures.length) {
      // Only execution-generated resource names and sanitized codes are emitted.
      console.error(JSON.stringify({ cleanup: 'incomplete', database: created ? database : null,
        roles: rolesCreated ? [migrationRole, appRole] : [], errors: cleanupFailures }));
      failure ??= new Error('DATABASE_TEST_CLEANUP_FAILED');
    }
  }
  if (failure) throw failure;
});
