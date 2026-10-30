import 'server-only';
import { projectUser } from '../users/repository.mjs';
import { cookieToken, tokenDigest } from '../auth/session.mjs';
import { MAX_PROFILE_VERSION } from '../../shared/profile.mjs';

const columns = 'id,name,email,address,city,state,country,postal_code AS "postalCode",message,profile_version AS "profileVersion",role';
const editable = Object.freeze({ name: 'name', address: 'address', city: 'city', state: 'state', country: 'country', postalCode: 'postal_code', message: 'message' });
export const profileEtag = (id, version) => `"profile:${id}:${version}"`;
export function projectProfile(row) { return { user: projectUser(row), profileVersion: row.profileVersion }; }
const allowed = row => row?.role === 'user' || row?.role === 'admin';

export async function readProfile(db, id) {
  const { rows } = await db.query(`SELECT ${columns} FROM imobilead.users WHERE id=$1`, [id]);
  if (!rows.length) return { status: 401, error: 'UNAUTHENTICATED' };
  if (rows.length !== 1 || rows[0].id !== id || !allowed(rows[0])) return { status: 403, error: 'FORBIDDEN' };
  return { status: 200, body: projectProfile(rows[0]) };
}

export async function updateProfile(pool, { id, cookie, config, input, etag, now = Date.now }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    // Lock user first, then the session: logout only touches sessions; every
    // profile writer follows this order. Role is re-read after waiting.
    const { rows } = await client.query(`SELECT ${columns} FROM imobilead.users WHERE id=$1 FOR UPDATE`, [id]);
    const token = cookieToken(cookie, config);
    const session = token ? await client.query(`SELECT user_id,expires_at,revoked_at FROM imobilead.sessions
      WHERE token_hash=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>$3 FOR SHARE`, [tokenDigest(token), id, new Date(now())]) : { rows: [] };
    const current = session.rows[0];
    let result;
    if (rows.length !== 1 || rows[0].id !== id || !current || current.user_id !== id || current.revoked_at !== null
        || !Number.isFinite(new Date(current.expires_at).getTime()) || new Date(current.expires_at).getTime() <= now()) {
      result = { status: 401, error: 'UNAUTHENTICATED' };
    } else if (!allowed(rows[0])) result = { status: 403, error: 'FORBIDDEN' };
    else if (etag !== profileEtag(id, input.expectedVersion) || rows[0].profileVersion !== input.expectedVersion
        || input.expectedVersion === MAX_PROFILE_VERSION) result = { status: 409, error: 'PROFILE_CONFLICT' };
    else {
      const fields = Object.keys(editable).filter(key => Object.hasOwn(input, key));
      const values = [id, input.expectedVersion, ...fields.map(key => input[key])];
      // Column identifiers come only from this fixed map, never request keys.
      const assignments = fields.map((key, index) => `${editable[key]}=$${index + 3}`).join(',');
      const updated = await client.query(`UPDATE imobilead.users SET ${assignments},
        profile_version=profile_version+1,updated_at=GREATEST(updated_at,clock_timestamp())
        WHERE id=$1 AND profile_version=$2 RETURNING ${columns}`, values);
      if (updated.rowCount !== 1 || updated.rows.length !== 1 || updated.rows[0].id !== id) throw new Error('PROFILE_UPDATE_REFUSED');
      // A statement may have waited long enough to cross the absolute deadline.
      // The session row remains locked against logout through commit.
      result = new Date(current.expires_at).getTime() <= now()
        ? { status: 401, error: 'UNAUTHENTICATED' }
        : { status: 200, body: projectProfile(updated.rows[0]) };
    }
    if (result.status === 200) await client.query('COMMIT');
    else await client.query('ROLLBACK');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}
