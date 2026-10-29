import pg from 'pg';
import { loadLocalEnvironment, localConnection, requireAuthenticationConfirmation } from './config.mjs';
import { promoteUser } from './admin-user.mjs';
import { validId } from '../../server/users/policy.mjs';

try {
  if (process.argv.length !== 3 || !validId(process.argv[2])) throw new Error('ADMIN_USER_INVALID_ID');
  loadLocalEnvironment();
  requireAuthenticationConfirmation();
  const config = localConnection(process.env.ADMIN_DATABASE_URL);
  const client = new pg.Client(config);
  try { await client.connect(); await promoteUser(client, config, process.argv[2]); }
  finally { await client.end(); }
  console.log('ADMIN_USER_UPDATED: 1');
} catch {
  console.error('ADMIN_USER_OPERATION_FAILED');
  process.exitCode = 1;
}
