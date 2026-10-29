import { validId } from '../../server/users/policy.mjs';
import { inspectDatabase } from './migrate.mjs';

export async function promoteUser(client, expected, id) {
  if (!validId(id)) throw new Error('ADMIN_USER_INVALID_ID');
  const { identity } = await inspectDatabase(client, expected);
  if (identity.rolsuper !== true) throw new Error('ADMIN_CREDENTIAL_REQUIRED');
  await client.query('BEGIN');
  try {
    const found = await client.query('SELECT id FROM imobilead.users WHERE id=$1 FOR UPDATE', [id]);
    if (found.rows.length !== 1) throw new Error('ADMIN_USER_NOT_FOUND');
    const updated = await client.query("UPDATE imobilead.users SET role='admin',updated_at=now() WHERE id=$1 RETURNING id", [id]);
    if (updated.rowCount !== 1 || updated.rows.length !== 1 || updated.rows[0].id !== found.rows[0].id) throw new Error('ADMIN_USER_UPDATE_REFUSED');
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
