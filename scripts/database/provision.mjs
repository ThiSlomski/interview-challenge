// Both identifiers must be project-owned; no general-purpose SQL interpolation.
export function roleIdentifier(value) {
  if (!/^imobilead_(?:migrate|app)(?:_[a-f0-9]{12})?$/.test(value)) throw new Error('DATABASE_ROLE_REFUSED');
  return `"${value}"`;
}

export function provisionSql(migrationRole = 'imobilead_migrate', appRole = 'imobilead_app') {
  const migration = roleIdentifier(migrationRole), app = roleIdentifier(appRole);
  return `
CREATE ROLE ${migration} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
CREATE ROLE ${app} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
CREATE SCHEMA imobilead AUTHORIZATION ${migration};
CREATE SCHEMA imobilead_meta AUTHORIZATION ${migration};
REVOKE ALL ON SCHEMA imobilead, imobilead_meta FROM PUBLIC;
GRANT USAGE ON SCHEMA imobilead TO ${app};
ALTER ROLE ${migration} SET search_path TO imobilead, pg_catalog;
ALTER ROLE ${app} SET search_path TO imobilead, pg_catalog;
`;
}

export function runtimeGrantsSql(appRole = 'imobilead_app') {
  const app = roleIdentifier(appRole);
  return `
GRANT SELECT ON imobilead.users TO ${app};
GRANT INSERT (id, name, email, password_hash, address, city, state, country, postal_code, message, created_at, updated_at)
  ON imobilead.users TO ${app};
GRANT SELECT, INSERT, UPDATE, DELETE ON imobilead.sessions TO ${app};
`;
}
