import pg from 'pg';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocalEnvironment, localConnection, requireAuthenticationConfirmation, safeFailure } from './config.mjs';
import { inspectDatabase } from './migrate.mjs';

const fields = ['name', 'city', 'state', 'country'];
// Same fixed whitespace set as String.trim and the immutable migration.
const whitespace = [9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195,
  8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279]
  .map(code => `chr(${code})`).join(' || ');
const invalid = field => `${field} IS NULL OR length(btrim(${field}, ${whitespace})) = 0`;

// Caller owns a READ ONLY transaction and validates the destination first.
// No names, locations, IDs, emails, credentials or row samples are returned.
export async function inspectEssentialFields(client) {
  const { rows: columns } = await client.query(`SELECT column_name AS field, is_nullable = 'YES' AS nullable
    FROM information_schema.columns WHERE table_schema = 'imobilead' AND table_name = 'users'
    AND column_name IN ('name','city','state','country') ORDER BY column_name`);
  if (columns.length !== 4) throw new Error('ESSENTIAL_PROFILE_SCHEMA_MISSING');
  const { rows: constraints } = await client.query(`SELECT conname AS name, convalidated AS validated
    FROM pg_constraint WHERE conrelid = 'imobilead.users'::regclass
    AND conname IN ('users_name_nonblank','users_city_nonblank','users_state_nonblank','users_country_nonblank')
    ORDER BY conname`);
  const { rows: [counts] } = await client.query(`SELECT
    count(*) FILTER (WHERE ${fields.map(field => `(${invalid(field)})`).join(' OR ')})::integer AS incompatible,
    ${fields.map(field => `count(*) FILTER (WHERE ${invalid(field)})::integer AS ${field}`).join(',\n    ')}
    FROM imobilead.users`);
  return { compatible: counts.incompatible === 0, counts, columns, constraints };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let client;
  try {
    loadLocalEnvironment();
    requireAuthenticationConfirmation();
    const config = localConnection(process.env.MIGRATION_DATABASE_URL, { user: 'imobilead_migrate' });
    client = new pg.Client(config);
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const { identity } = await inspectDatabase(client, config);
    const report = await inspectEssentialFields(client);
    await client.query('COMMIT');
    console.log(JSON.stringify({ database: identity.database, host: identity.address, port: identity.port,
      readOnly: true, ...report }));
    if (!report.compatible) process.exitCode = 2;
  } catch (error) {
    console.error(safeFailure(error));
    process.exitCode = 1;
  } finally { if (client) await client.end(); }
}
