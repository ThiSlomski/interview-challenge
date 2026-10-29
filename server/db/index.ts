import 'server-only';
import { Pool } from 'pg';
import { runtimeDatabaseConfig, verifyRuntimePrivileges } from './config.mjs';

let pool: Promise<Pool> | undefined;

export function database(): Promise<Pool> {
  // Lazy construction keeps build and public pages independent of credentials.
  pool ??= (async () => {
    const candidate = new Pool(runtimeDatabaseConfig(process.env.DATABASE_URL));
    try { await verifyRuntimePrivileges(candidate); return candidate; }
    catch (error) { await candidate.end(); pool = undefined; throw error; }
  })();
  return pool;
}

// Future API must select this projection explicitly and authorize on the server.
// It deliberately excludes password_hash, role and all session material.
export const publicUserColumns = 'id, name, email, address, city, state, country, postal_code, message, created_at, updated_at';
