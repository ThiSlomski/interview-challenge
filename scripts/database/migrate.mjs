import pg from 'pg';
import { runner } from 'node-pg-migrate';
import { fileURLToPath } from 'node:url';

export async function inspectDatabase(client, expected) {
  const { rows: [identity] } = await client.query(`SELECT current_database() AS database,
    current_user AS role, host(inet_server_addr()) AS address, inet_server_port() AS port,
    r.rolsuper, r.rolcreatedb, r.rolcreaterole FROM pg_roles r WHERE r.rolname=current_user`);
  if (identity.database !== expected.database || identity.role !== expected.user
    || Number(identity.port) !== Number(expected.port)
    || identity.address !== expected.host) throw new Error('UNEXPECTED_DATABASE_IDENTITY');
  const { rows: inventory } = await client.query(`SELECT n.nspname AS schema, c.relname AS object,
    c.relkind AS kind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
    ORDER BY n.nspname,c.relname LIMIT 201`);
  if (inventory.length > 200) throw new Error('DATABASE_INVENTORY_LIMIT_REACHED');
  return { identity, inventory };
}

export async function migrate(config, { inspect = true } = {}) {
  const client = new pg.Client(config);
  await client.connect();
  try {
    if (inspect) {
      const { identity, inventory } = await inspectDatabase(client, config);
      if (identity.rolsuper || identity.rolcreatedb || identity.rolcreaterole) throw new Error('PRIVILEGED_MIGRATION_ROLE_REFUSED');
      const history = await client.query("SELECT to_regclass('imobilead_meta.pgmigrations') AS history");
      if (!history.rows[0].history && inventory.some(row => row.schema === 'imobilead')) throw new Error('EXISTING_OBJECTS_WITHOUT_MIGRATION_HISTORY');
    }
    return await runner({ dbClient: client,
      dir: fileURLToPath(new URL('../../database/migrations/', import.meta.url)),
      direction: 'up', migrationsTable: 'pgmigrations', migrationsSchema: 'imobilead_meta',
      schema: 'imobilead', createSchema: false, createMigrationsSchema: false,
      checkOrder: true, singleTransaction: true,
      log: () => {}, logger: { info() {}, warn() {}, error() {} },
    });
  } finally { await client.end(); }
}
