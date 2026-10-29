import test from 'node:test';
import assert from 'node:assert/strict';
import { localConnection, safeFailure } from '../../scripts/database/config.mjs';
import { runtimeDatabaseConfig, verifyRuntimePrivileges } from '../../server/db/config.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';
import { inspectDatabase } from '../../scripts/database/migrate.mjs';

const url = 'postgresql://imobilead_app:placeholder@127.0.0.1:5432/imobilead';
test('runtime accepts only the exact local project and unprivileged role', () => {
  assert.equal(runtimeDatabaseConfig(url).user, 'imobilead_app');
  for (const candidate of [undefined, 'broken', url.replace('127.0.0.1', 'remote.example'),
    url.replace('127.0.0.1', 'localhost'), url.replace(':5432', ':5433'),
    url.replace('/imobilead', '/other'), url.replace('imobilead_app:', 'postgres:'), `${url}?host=remote.example`]) {
    assert.throws(() => runtimeDatabaseConfig(candidate));
  }
});
test('tools refuse absent credentials, remote targets and URL option overrides', () => {
  assert.equal(localConnection(url).database, 'imobilead');
  for (const candidate of [undefined, 'broken', url.replace('127.0.0.1', 'localhost'), `${url}?sslmode=disable`, `${url}#other`]) {
    assert.throws(() => localConnection(candidate));
  }
});
test('SQL identifiers are restricted to owned project roles', () => {
  assert.equal(roleIdentifier('imobilead_app'), '"imobilead_app"');
  assert.throws(() => roleIdentifier('postgres'));
  assert.throws(() => roleIdentifier('imobilead_app; DROP DATABASE other'));
});
test('diagnostics suppress PostgreSQL messages, details and connection strings', () => {
  assert.equal(safeFailure({ message: 'secret URL and user data', detail: 'private', code: '23505' }), 'DATABASE_OPERATION_FAILED (23505)');
});

const expectedIdentity = { host: '127.0.0.1', port: 5432, database: 'imobilead', user: 'postgres' };

// Controlled SQL-response simulation, not a PostgreSQL integration test.
// Reproduces inet::text retaining the mask, while host(inet) omits it.
function controlledIdentityClient(overrides = {}) {
  const queries = [];
  return {
    queries,
    async query(sql) {
      queries.push(sql);
      if (queries.length !== 1) return { rows: [] };
      const address = /host\(inet_server_addr\(\)\)/.test(sql) ? '127.0.0.1' : '127.0.0.1/32';
      return { rows: [{ database: 'imobilead', role: 'postgres', port: 5432, address, ...overrides }] };
    },
  };
}

test('controlled identity regression: normalize inet address before exact validation', async () => {
  const client = controlledIdentityClient();
  const result = await inspectDatabase(client, expectedIdentity);
  assert.equal(result.identity.address, expectedIdentity.host);
  assert.equal(client.queries.length, 2);
});

for (const [field, overrides] of [
  ['database', { database: 'different_database' }],
  ['user', { role: 'different_user' }],
  ['port', { port: 5433 }],
  ['host', { address: '127.0.0.2' }],
  ['other loopback family', { address: '::1' }],
  ['address with mask', { address: '127.0.0.1/32' }],
  ['null address', { address: null }],
]) {
  test(`controlled identity rejects divergent ${field} before inventory`, async () => {
    const client = controlledIdentityClient(overrides);
    await assert.rejects(inspectDatabase(client, expectedIdentity), { message: 'UNEXPECTED_DATABASE_IDENTITY' });
    assert.equal(client.queries.length, 1);
  });
}

const normalRoleFlags = {
  rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false,
  rolbypassrls: false, memberships: false, public_create: false, app_create: false,
};
const normalContract = {
  app_schema_usage: true, users_columns: true, users_tables: true, sessions_columns: true,
  sessions_tables: true, history_denied: true,
};
const refusedPrivileges = { message: 'PRIVILEGED_APPLICATION_ROLE_REFUSED' };
function controlledPrivilegesClient(...responses) {
  const role = responses.length ? responses[0] : normalRoleFlags;
  const contract = responses.length > 1 ? responses[1] : normalContract;
  let calls = 0;
  return { async query() { return { rows: [calls++ === 0 ? role : contract] }; } };
}

test('controlled privilege contract accepts explicit safe role and complete contract', async () => {
  await verifyRuntimePrivileges(controlledPrivilegesClient());
});

test('controlled privilege check rejects absent, NULL and malformed role flags', async () => {
  for (const role of [undefined, null, {}, { ...normalRoleFlags, memberships: null },
    { ...normalRoleFlags, public_create: undefined }, { ...normalRoleFlags, rolsuper: true },
    { ...normalRoleFlags, rolcreaterole: 0 }]) {
    await assert.rejects(verifyRuntimePrivileges(controlledPrivilegesClient(role)), refusedPrivileges);
  }
});

test('controlled privilege check rejects missing, NULL or negative contract results', async () => {
  for (const contract of [undefined, null, {}, { ...normalContract, users_columns: null },
    { ...normalContract, history_denied: undefined }]) {
    await assert.rejects(verifyRuntimePrivileges(controlledPrivilegesClient(normalRoleFlags, contract)), refusedPrivileges);
  }
  for (const flag of Object.keys(normalContract)) {
    await assert.rejects(verifyRuntimePrivileges(controlledPrivilegesClient(normalRoleFlags,
      { ...normalContract, [flag]: false })), refusedPrivileges);
  }
});

test('controlled privilege query failures never approve the environment', async () => {
  for (const failAt of [1, 2]) {
    let calls = 0;
    const client = { async query() {
      if (++calls === failAt) throw new Error('CONTROLLED_QUERY_FAILURE');
      return { rows: [normalRoleFlags] };
    } };
    await assert.rejects(verifyRuntimePrivileges(client), { message: 'CONTROLLED_QUERY_FAILURE' });
  }
});
