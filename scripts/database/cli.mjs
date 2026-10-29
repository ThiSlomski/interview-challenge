import pg from 'pg';
import { loadLocalEnvironment, localConnection, requireAuthenticationConfirmation, safeFailure } from './config.mjs';
import { inspectDatabase, migrate } from './migrate.mjs';
import { provisionSql, runtimeGrantsSql } from './provision.mjs';
import { runtimeDatabaseConfig, verifyRuntimePrivileges } from '../../server/db/config.mjs';

try {
  loadLocalEnvironment();
  const command = process.argv[2];
  if (!['inspect', 'provision', 'migrate', 'grant', 'check-app'].includes(command)) throw new Error('DATABASE_COMMAND_REFUSED');
  requireAuthenticationConfirmation();
  const variable = command === 'check-app' ? 'DATABASE_URL' : ['provision', 'grant'].includes(command) ? 'ADMIN_DATABASE_URL' : 'MIGRATION_DATABASE_URL';
  const config = command === 'check-app' ? runtimeDatabaseConfig(process.env.DATABASE_URL)
    : localConnection(process.env[variable], { user: variable === 'MIGRATION_DATABASE_URL' ? 'imobilead_migrate' : undefined });
  const client = new pg.Client(config);
  await client.connect();
  try {
    const { identity, inventory } = await inspectDatabase(client, config);
    if (command === 'check-app') await verifyRuntimePrivileges(client);
    // No object names or row data are emitted; counts suffice for preflight.
    console.log(JSON.stringify({ database: identity.database, host: identity.address, port: identity.port, role: identity.role,
      objects: inventory.length, applicationObjects: inventory.filter(row => row.schema === 'imobilead').length }));
    if (command === 'provision') {
      if (inventory.some(row => ['imobilead', 'imobilead_meta'].includes(row.schema))) throw new Error('EXISTING_PROJECT_OBJECTS_REFUSED');
      await client.query('BEGIN');
      try { await client.query(provisionSql()); await client.query('COMMIT'); }
      catch (error) { await client.query('ROLLBACK'); throw error; }
      console.log('Provisioned project-only roles and schemas. Set role passwords locally with psql \\password.');
    }
    if (command === 'grant') await client.query(runtimeGrantsSql());
  } finally { await client.end(); }
  if (command === 'migrate') console.log(JSON.stringify({ applied: (await migrate(config)).length }));
} catch (error) { console.error(safeFailure(error)); process.exitCode = 1; }
