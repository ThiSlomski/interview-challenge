import pg from 'pg';
import { spawnSync } from 'node:child_process';
import { localConnection, safeFailure, requireAuthenticationConfirmation } from '../database/config.mjs';
import { inspectDatabase } from '../database/migrate.mjs';
import { provisionSql } from '../database/provision.mjs';

// Only this image receives administrative credentials. No dotenv is loaded.
try {
  requireAuthenticationConfirmation();
  const config = localConnection(process.env.ADMIN_DATABASE_URL, { user: 'compose_admin' });
  const migration = localConnection(process.env.MIGRATION_DATABASE_URL, { user: 'imobilead_migrate' });
  const runtime = localConnection(process.env.DATABASE_URL, { user: 'imobilead_app' });
  const client = new pg.Client(config);
  await client.connect();
  try {
    await inspectDatabase(client, config);
    await client.query('BEGIN');
    // Serialize repeated initializers; rollback leaves no half-provisioned state.
    await client.query('SELECT pg_advisory_xact_lock(22413001)');
    const { rows: [state] } = await client.query(`SELECT
      EXISTS(SELECT 1 FROM pg_roles WHERE rolname='imobilead_migrate') AS migration,
      EXISTS(SELECT 1 FROM pg_roles WHERE rolname='imobilead_app') AS runtime,
      EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='imobilead') AS app_schema,
      EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='imobilead_meta') AS meta_schema`);
    const flags = Object.values(state);
    if (flags.every(value => value === false)) {
      await client.query(provisionSql());
      // Fixed synthetic passwords only, independently checked against Compose URLs.
      if (migration.password !== 'compose_only_migrate_2026' || runtime.password !== 'compose_only_runtime_2026') {
        throw new Error('DATABASE_TARGET_REFUSED');
      }
      await client.query("ALTER ROLE imobilead_migrate PASSWORD 'compose_only_migrate_2026'");
      await client.query("ALTER ROLE imobilead_app PASSWORD 'compose_only_runtime_2026'");
    } else if (!flags.every(value => value === true)) {
      throw new Error('EXISTING_PROJECT_OBJECTS_REFUSED');
    }
    await client.query('COMMIT');
  } finally { await client.end(); }
  for (const command of ['migrate', 'grant', 'check-app']) {
    const result = spawnSync(process.execPath, ['scripts/database/cli.mjs', command], { stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error('DATABASE_OPERATION_FAILED');
  }
  console.log('COMPOSE_INIT_OK');
} catch (error) {
  console.error(safeFailure(error));
  process.exitCode = 1;
}
