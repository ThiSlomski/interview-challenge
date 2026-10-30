import 'server-only';

const columns = 'id,name,email,address,city,state,country,postal_code AS "postalCode",message';
// Explicit output allowlist also protects against accidental driver/fixture extras.
export const projectUser = row => Object.fromEntries(['id','name','email','address','city','state','country','postalCode','message'].map(key => [key, row[key]]));
const projectListedUser = row => ({ ...projectUser(row), role: row.role });

export async function readUsers(db, { id, after }) {
  const { rows } = id
    ? await db.query(`SELECT ${columns} FROM imobilead.users WHERE id=$1`, [id])
    : await db.query(`SELECT ${columns},role FROM imobilead.users WHERE ($1::uuid IS NULL OR id>$1::uuid) ORDER BY id LIMIT 101`, [after ?? null]);
  if (id) return rows[0] ? projectUser(rows[0]) : null;
  return { users: rows.slice(0,100).map(projectListedUser), nextCursor: rows.length > 100 ? rows[99].id : null };
}
