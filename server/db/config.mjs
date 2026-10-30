// Shared by server-only entry point and offline tests; no connection at import.
export function runtimeDatabaseConfig(value) {
  if (!value) throw new Error('DATABASE_CREDENTIALS_MISSING');
  let url;
  try { url = new URL(value); } catch { throw new Error('DATABASE_URL_INVALID'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1'
    || Number(url.port || 5432) !== 5432 || url.pathname !== '/imobilead'
    || decodeURIComponent(url.username) !== 'imobilead_app' || !url.password || url.search || url.hash) {
    throw new Error('DATABASE_TARGET_REFUSED');
  }
  return { host: url.hostname === '[::1]' ? '::1' : url.hostname, port: 5432,
    database: 'imobilead', user: 'imobilead_app', password: decodeURIComponent(url.password),
    max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    statement_timeout: 10000, application_name: 'imobilead-app' };
}

export async function verifyRuntimePrivileges(client) {
  const { rows: [role] } = await client.query(`SELECT r.rolsuper, r.rolcreatedb, r.rolcreaterole,
    r.rolreplication, r.rolbypassrls,
    EXISTS(SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid) AS memberships,
    has_schema_privilege(current_user,'public','CREATE') AS public_create,
    has_schema_privilege(current_user,'imobilead','CREATE') AS app_create
    FROM pg_roles r WHERE r.rolname=current_user`);
  const forbiddenRoleFlags = ['rolsuper', 'rolcreatedb', 'rolcreaterole', 'rolreplication',
    'rolbypassrls', 'memberships', 'public_create', 'app_create'];
  if (!role || forbiddenRoleFlags.some(flag => role[flag] !== false)) {
    throw new Error('PRIVILEGED_APPLICATION_ROLE_REFUSED');
  }

  // Fixed contract of the current migration, not a general schema/ACL auditor.
  // OIDs from catalogs let us inspect history without granting schema USAGE.
  // Effective privilege functions include table, column and PUBLIC grants.
  const { rows: [contract] } = await client.query(`WITH objects AS (
      SELECT c.oid, n.nspname, c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r'
    ), users_table AS (SELECT oid FROM objects WHERE nspname='imobilead' AND relname='users'),
    sessions_table AS (SELECT oid FROM objects WHERE nspname='imobilead' AND relname='sessions'),
    history_table AS (SELECT oid FROM objects WHERE nspname='imobilead_meta' AND relname='pgmigrations')
    SELECT has_schema_privilege(current_user,'imobilead','USAGE') AS app_schema_usage,
      (SELECT count(*)=14 AND bool_and(
        a.attname::text=ANY(ARRAY['id','name','email','password_hash','address','city','state',
          'country','postal_code','message','role','created_at','updated_at','profile_version'])
        AND has_column_privilege(current_user,u.oid,a.attnum,'SELECT')
        AND has_column_privilege(current_user,u.oid,a.attnum,'INSERT')=(a.attname NOT IN ('role','profile_version'))
        AND has_column_privilege(current_user,u.oid,a.attnum,'UPDATE')=(a.attname::text=ANY(ARRAY[
          'name','address','city','state','country','postal_code','message','updated_at','profile_version']))
        AND NOT has_column_privilege(current_user,u.oid,a.attnum,'REFERENCES'))
        FROM pg_attribute a WHERE a.attrelid=u.oid AND a.attnum>0 AND NOT a.attisdropped)
        AS users_columns,
      (NOT has_table_privilege(current_user,u.oid,'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        AND NOT has_any_column_privilege(current_user,u.oid,'REFERENCES')
        AND NOT has_any_column_privilege(current_user,u.oid,
          'SELECT WITH GRANT OPTION,INSERT WITH GRANT OPTION,UPDATE WITH GRANT OPTION')) AS users_tables,
      (SELECT count(*)=5 AND bool_and(
        a.attname::text=ANY(ARRAY['token_hash','user_id','created_at','expires_at','revoked_at'])
        AND has_column_privilege(current_user,s.oid,a.attnum,'SELECT')
        AND has_column_privilege(current_user,s.oid,a.attnum,'INSERT')
        AND has_column_privilege(current_user,s.oid,a.attnum,'UPDATE'))
        FROM pg_attribute a WHERE a.attrelid=s.oid AND a.attnum>0 AND NOT a.attisdropped)
        AS sessions_columns,
      (has_table_privilege(current_user,s.oid,'DELETE')
        AND NOT has_table_privilege(current_user,s.oid,'TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        AND NOT has_any_column_privilege(current_user,s.oid,'REFERENCES')
        AND NOT has_table_privilege(current_user,s.oid,'DELETE WITH GRANT OPTION')
        AND NOT has_any_column_privilege(current_user,s.oid,
          'SELECT WITH GRANT OPTION,INSERT WITH GRANT OPTION,UPDATE WITH GRANT OPTION')) AS sessions_tables,
      (NOT has_schema_privilege(current_user,'imobilead_meta','USAGE,CREATE')
        AND NOT has_table_privilege(current_user,h.oid,
          'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        AND NOT has_any_column_privilege(current_user,h.oid,'SELECT,INSERT,UPDATE,REFERENCES')) AS history_denied
    FROM users_table u CROSS JOIN sessions_table s CROSS JOIN history_table h`);
  const requiredContractFlags = ['app_schema_usage', 'users_columns', 'users_tables', 'sessions_columns',
    'sessions_tables', 'history_denied'];
  if (!contract || requiredContractFlags.some(flag => contract[flag] !== true)) {
    throw new Error('PRIVILEGED_APPLICATION_ROLE_REFUSED');
  }
}
