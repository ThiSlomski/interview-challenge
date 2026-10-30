import 'server-only';
import { cookieToken, tokenDigest } from '../auth/session.mjs';

export async function deleteCommonUser(client, { actorId, targetId, cookie, config, now = Date.now }) {
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    // ORDER BY precedes row locking. Every delete locks all involved users in
    // the same UUID order, then its actor's session, like profile writes.
    const { rows } = await client.query(`SELECT id,role FROM imobilead.users
      WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [[actorId, targetId]]);
    const actor = rows.find(row => row.id === actorId);
    const target = rows.find(row => row.id === targetId);
    const token = cookieToken(cookie, config);
    const { rows: sessions } = token ? await client.query(`SELECT user_id,expires_at,revoked_at FROM imobilead.sessions
      WHERE token_hash=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>$3 FOR SHARE`,
    [tokenDigest(token), actorId, new Date(now())]) : { rows: [] };
    const session = sessions[0];
    let result;
    if (!actor || sessions.length !== 1 || session.user_id !== actorId || session.revoked_at !== null
        || !Number.isFinite(new Date(session.expires_at).getTime()) || new Date(session.expires_at).getTime() <= now()) {
      result = { status: 401, error: 'UNAUTHENTICATED' };
    } else if (actor.role !== 'admin') result = { status: 403, error: 'FORBIDDEN' };
    else if (actorId === targetId) result = { status: 409, error: 'SELF_DELETE_FORBIDDEN' };
    else if (!target) result = { status: 404, error: 'USER_NOT_FOUND' };
    else if (target.role !== 'user') result = { status: 409, error: 'ADMIN_DELETE_FORBIDDEN' };
    else {
      // Cascade is the only session deletion. No manual DELETE sessions and no
      // count of administrators, global lock, or client-supplied role.
      const deleted = await client.query("DELETE FROM imobilead.users WHERE id=$1 AND role='user' RETURNING id", [targetId]);
      if (deleted.rowCount !== 1 || deleted.rows.length !== 1 || deleted.rows[0].id !== targetId) throw new Error('USER_DELETE_REFUSED');
      result = new Date(session.expires_at).getTime() <= now()
        ? { status: 401, error: 'UNAUTHENTICATED' } : { status: 204 };
    }
    await client.query(result.status === 204 ? 'COMMIT' : 'ROLLBACK');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}
