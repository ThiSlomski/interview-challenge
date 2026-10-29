import { existsSync } from 'node:fs';

export function loadLocalEnvironment() {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
}

// Local-only boundary for this stage. Never fall back to PG* or implicit hosts.
export function localConnection(value, { database = 'imobilead', port = 5432, user } = {}) {
  if (!value) throw new Error('DATABASE_CREDENTIALS_MISSING');
  let url;
  try { url = new URL(value); } catch { throw new Error('DATABASE_URL_INVALID'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || url.hostname !== '127.0.0.1'
      || Number(url.port || 5432) !== Number(port)
      || decodeURIComponent(url.pathname.slice(1)) !== database
      || url.search || url.hash || !url.username || !url.password
      || (user && decodeURIComponent(url.username) !== user)) {
    throw new Error('DATABASE_TARGET_REFUSED');
  }
  return {
    host: url.hostname === '[::1]' ? '::1' : url.hostname,
    port: Number(url.port || 5432), database,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    connectionTimeoutMillis: 5000, statement_timeout: 15000,
    application_name: 'imobilead-database',
  };
}

export function requireAuthenticationConfirmation() {
  if (process.env.DB_TRUST_REMOVED !== 'true') throw new Error('CONFIRM_TRUST_REMOVED_REQUIRED');
}

export function safeFailure(error) {
  // PostgreSQL details/messages may contain row data, SQL or credentials.
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{2,50}$/.test(error.code) ? error.code : 'WITHHELD';
  const allowed = ['DATABASE_CREDENTIALS_MISSING', 'DATABASE_URL_INVALID', 'DATABASE_TARGET_REFUSED',
    'CONFIRM_TRUST_REMOVED_REQUIRED', 'DATABASE_COMMAND_REFUSED', 'DATABASE_DISPOSABLE_AUTHORIZATION_REQUIRED',
    'DATABASE_ROLE_REFUSED', 'EXISTING_PROJECT_OBJECTS_REFUSED', 'EXISTING_OBJECTS_WITHOUT_MIGRATION_HISTORY',
    'UNEXPECTED_DATABASE_IDENTITY', 'PRIVILEGED_MIGRATION_ROLE_REFUSED', 'PRIVILEGED_APPLICATION_ROLE_REFUSED',
    'DATABASE_INVENTORY_LIMIT_REACHED'];
  const own = allowed.includes(error?.message) ? error.message : 'DATABASE_OPERATION_FAILED';
  return `${own} (${code})`;
}
