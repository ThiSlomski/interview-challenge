import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

export const SESSION_SECONDS = 3600;
export function sessionConfig(input) {
  if (!input || input.ttl !== '3600') throw new Error('AUTH_CONFIGURATION_INVALID');
  const url = new URL(input.origin);
  if (url.origin !== input.origin || !['http:', 'https:'].includes(url.protocol)
      || (input.production && url.protocol !== 'https:')) throw new Error('AUTH_CONFIGURATION_INVALID');
  return { ...input, cookieName: input.production ? '__Host-imobilead_session' : 'imobilead_session' };
}

export function tokenDigest(token) { return createHash('sha256').update(token).digest(); }
export function newSessionToken() { return randomBytes(32).toString('base64url'); }

export function cookieToken(cookie, config) {
  const matches = (cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith(config.cookieName + '='));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(config.cookieName.length + 1);
  // Require canonical encoding of exactly 32 random bytes; no URI decoding.
  if (!/^[A-Za-z0-9_-]{43}$/.test(value) || Buffer.from(value, 'base64url').toString('base64url') !== value) return null;
  return value;
}

export function sessionCookie(token, config, clear = false) {
  return `${config.cookieName}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax${config.production ? '; Secure' : ''}${clear ? '; Max-Age=0' : ''}`;
}

// Reusable by server routes/pages: pass their Cookie header, never a client userId.
// It throws on database/configuration failure; callers must fail closed.
export async function authenticateSession({ database, cookie, config: input, now = Date.now }) {
  const config = sessionConfig(input);
  const token = cookieToken(cookie, config);
  if (!token) return null;
  const time = now();
  const { rows } = await (await database()).query(`SELECT u.id, s.expires_at, s.revoked_at
    FROM imobilead.sessions s JOIN imobilead.users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>$2`, [tokenDigest(token), new Date(time)]);
  const row = rows[0];
  if (!row || row.revoked_at !== null || !Number.isFinite(new Date(row.expires_at).getTime())
      || new Date(row.expires_at).getTime() <= now()) return null;
  return { user: { id: row.id }, expiresAt: new Date(row.expires_at).toISOString() };
}
