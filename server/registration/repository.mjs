import 'server-only';

export async function insertUser(db, value, hash) {
  // role/id/dates are DB defaults; confirmation never reaches this boundary.
  const { rows: [user] } = await db.query(`INSERT INTO imobilead.users
    (name,email,password_hash,address,city,state,country,postal_code,message)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
  [value.name, value.email, hash, value.address, value.city, value.state,
    value.country, value.postalCode, value.message]);
  return { id: user.id };
}
