import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { inspectEssentialFields } from '../../scripts/database/essential-fields-preflight.mjs';

const migration = createRequire(import.meta.url)('../../database/migrations/1793491200000-required-profile-fields.cjs');
let migrationSql;
migration.up({ sql(value) { migrationSql = value; } });
const fields = ['name', 'city', 'state', 'country'];
const columns = fields.join(',');
const valid = ['Pessoa Sintética', 'Cidade Sintética', 'Estado Sintético', 'País Sintético'];
const whitespace = String.fromCodePoint(9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194,
  8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279);

export async function verifyEssentialFields(t, dbAdmin, app) {
  // This helper performs DDL/DML only after confirming the disposable identity.
  const { rows: [identity] } = await dbAdmin.query(`SELECT current_database() AS database,
    host(inet_server_addr()) AS host, inet_server_port() AS port`);
  assert.match(identity.database, /^imobilead_test_[a-f0-9]{12}$/);
  assert.equal(identity.host, '127.0.0.1');
  assert.equal(identity.port, 5432);

  await t.test('essential-field schema and readonly preflight agree after migration', async () => {
    await dbAdmin.query('BEGIN READ ONLY');
    try {
      const report = await inspectEssentialFields(dbAdmin);
      assert.equal(report.compatible, true);
      assert.equal(report.counts.incompatible, 0);
      assert.equal(report.columns.length, 4);
      assert(report.columns.every(column => !column.nullable));
      assert.equal(report.constraints.length, 4);
      assert(report.constraints.every(constraint => constraint.validated));
    } finally { await dbAdmin.query('ROLLBACK'); }
  });

  await t.test('PostgreSQL rejects NULL, empty and JS whitespace for every essential on INSERT and UPDATE', async () => {
    const insert = (values, email = 'db-essential-valid@example.test') => app.query(`INSERT INTO imobilead.users
      (${columns},email,password_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
    [...values, email, '$fixture-not-a-password']);
    const { rows: [user] } = await insert(valid);
    try {
      for (const [index, field] of fields.entries()) {
        for (const value of [null, '', '  ', '\t\r\n', '\u00a0', '\ufeff', whitespace]) {
          const values = [...valid]; values[index] = value;
          await assert.rejects(insert(values, 'db-essential-invalid@example.test'), { code: value === null ? '23502' : '23514' });
          await assert.rejects(app.query(`UPDATE imobilead.users SET ${field}=$1 WHERE id=$2`, [value, user.id]),
            { code: value === null ? '23502' : '23514' });
        }
      }
      const { rows: [record] } = await app.query(`SELECT ${columns},address,postal_code,message FROM imobilead.users WHERE id=$1`, [user.id]);
      assert.deepEqual(record, { name: valid[0], city: valid[1], state: valid[2], country: valid[3], address: null, postal_code: null, message: null });
      await app.query("UPDATE imobilead.users SET address='',postal_code='',message='' WHERE id=$1", [user.id]);
      assert.equal((await app.query('SELECT address,postal_code,message FROM imobilead.users WHERE id=$1', [user.id])).rows[0].message, '');
    } finally { await dbAdmin.query('DELETE FROM imobilead.users WHERE id=$1', [user.id]); }
  });

  async function legacySchema() {
    await dbAdmin.query(`ALTER TABLE imobilead.users
      ALTER COLUMN city DROP NOT NULL, ALTER COLUMN state DROP NOT NULL, ALTER COLUMN country DROP NOT NULL,
      ${fields.map(field => `DROP CONSTRAINT users_${field}_nonblank`).join(', ')}`);
  }

  await t.test('migration refuses incompatible legacy rows atomically without row rewrites', async () => {
    await dbAdmin.query('BEGIN');
    try {
      await legacySchema();
      await dbAdmin.query(`INSERT INTO imobilead.users(name,email,password_hash,city,state,country)
        VALUES ('','db-essential-legacy@example.test','$fixture-legacy',NULL,'  ',chr(65279))`);
      const report = await inspectEssentialFields(dbAdmin);
      assert.equal(report.compatible, false);
      for (const field of ['incompatible', ...fields]) assert.equal(report.counts[field], 1);
      await dbAdmin.query('SAVEPOINT migration_attempt');
      await assert.rejects(dbAdmin.query(migrationSql), { code: '23514', message: 'ESSENTIAL_PROFILE_FIELDS_INCOMPATIBLE' });
      await dbAdmin.query('ROLLBACK TO SAVEPOINT migration_attempt');
      const after = await inspectEssentialFields(dbAdmin);
      assert.deepEqual(after, report);
    } finally { await dbAdmin.query('ROLLBACK'); }
  });

  await t.test('compatible migration preserves IDs, email, hash, role, timestamps, sessions and profile version', async () => {
    await dbAdmin.query('BEGIN');
    try {
      await legacySchema();
      const { rows: [user] } = await dbAdmin.query(`INSERT INTO imobilead.users(${columns},email,password_hash,role,profile_version)
        VALUES ($1,$2,$3,$4,'db-essential-preserved@example.test','$fixture-preserved','admin',7) RETURNING id`, valid);
      await dbAdmin.query("INSERT INTO imobilead.sessions(token_hash,user_id,expires_at) VALUES(decode(repeat('ab',32),'hex'),$1,now()+interval '1 hour')", [user.id]);
      const snapshot = async () => (await dbAdmin.query(`SELECT to_jsonb(u) AS account,
        (SELECT jsonb_agg(to_jsonb(s)) FROM imobilead.sessions s WHERE s.user_id=u.id) AS sessions
        FROM imobilead.users u WHERE u.id=$1`, [user.id])).rows[0];
      const before = await snapshot();
      await dbAdmin.query(migrationSql);
      assert.deepEqual(await snapshot(), before);
      const report = await inspectEssentialFields(dbAdmin);
      assert(report.columns.every(column => !column.nullable));
      assert.equal(report.constraints.length, 4);
    } finally { await dbAdmin.query('ROLLBACK'); }
  });
}
