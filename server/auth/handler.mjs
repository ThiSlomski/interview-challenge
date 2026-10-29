import 'server-only';
import { createHash } from 'node:crypto';
import { normalizeEmail } from '../../shared/registration.mjs';
import { verifyPassword } from '../registration/password.mjs';
import { authenticateSession, sessionConfig, cookieToken, tokenDigest, newSessionToken, sessionCookie, SESSION_SECONDS } from './session.mjs';

export const BODY_LIMIT = 4096;
export const BODY_TIMEOUT = 5000;
export const LOGIN_LIMIT = 30;
export const EMAIL_LIMIT = 5;
export const EMAIL_BUCKET_LIMIT = 1024;
// Public, non-user credential; same Argon2id v19/m19456/t2/p1 cost as signup.
export const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$RVyHumaKx7B5wQRnfQNbBg$4uxPXm6RpNtRJ70JJH/bTgiWaCcewNFQGDxAsbGGjv4';

function reply(status, body, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });
}

function checkOrigin(request, config) {
  const site = request.headers.get('sec-fetch-site');
  const mode = request.headers.get('sec-fetch-mode');
  const destination = request.headers.get('sec-fetch-dest');
  return request.headers.get('origin') === config.origin
    && (site === null || site === 'same-origin' || site === 'none')
    && (mode === null || mode === 'cors' || mode === 'same-origin')
    && (destination === null || destination === 'empty');
}

async function readJson(request) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
      || (request.headers.get('content-encoding') ?? 'identity') !== 'identity') throw { status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) throw { status: 413, code: 'BODY_TOO_LARGE' };
  if (!request.body) throw { status: 400, code: 'INVALID_BODY' };
  const reader = request.body.getReader();
  let timer, total = 0;
  const chunks = [];
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject({ status: 408, code: 'BODY_TIMEOUT' }), BODY_TIMEOUT); });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) throw { status: 413, code: 'BODY_TOO_LARGE' };
      chunks.push(value);
    }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, total))); }
    catch { throw { status: 400, code: 'INVALID_JSON' }; }
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createAuthHandlers({ database, config: configuration, now = Date.now, diagnostic = () => {} }) {
  let start = now(), attempts = 0, active = 0;
  const emails = new Map();
  const limited = seconds => reply(429, { error: 'RATE_LIMITED' }, { 'Retry-After': String(Math.max(1, Math.ceil(seconds))) });
  function emailBudget(email, time) {
    // Only digests are retained; no raw identifiers, IPs or forwarding headers.
    const key = createHash('sha256').update(email).digest('hex');
    let entry = emails.get(key);
    if (entry && time - entry.start >= 60000) { emails.delete(key); entry = undefined; }
    if (!entry) {
      if (emails.size >= EMAIL_BUCKET_LIMIT) {
        for (const [id, item] of emails) if (time - item.start >= 60000) emails.delete(id);
        if (emails.size >= EMAIL_BUCKET_LIMIT) return 60;
      }
      entry = { start: time, count: 0 }; emails.set(key, entry);
    }
    return ++entry.count > EMAIL_LIMIT ? (entry.start + 60000 - time) / 1000 : 0;
  }
  async function guarded(request, action) {
    let config;
    try { config = sessionConfig(configuration()); }
    catch { return reply(503, { error: 'AUTH_UNAVAILABLE' }); }
    if (action !== 'session' && !checkOrigin(request, config)) return reply(403, { error: 'ORIGIN_REFUSED' });
    if (action === 'login') {
      const time = now();
      if (time - start >= 60000) { start = time; attempts = 0; }
      if (++attempts > LOGIN_LIMIT) return limited((start + 60000 - time) / 1000);
    }
    if (active >= 2) return limited(1);
    active++;
    try {
      if (action === 'login') {
        let input;
        try { input = await readJson(request); }
        catch (error) { return reply(error.status ?? 400, { error: error.code ?? 'INVALID_BODY' }); }
        if (!input || typeof input !== 'object' || Array.isArray(input)
            || Object.keys(input).some(key => !['email', 'password'].includes(key))
            || typeof input.email !== 'string' || normalizeEmail(input.email).length > 254
            || !/^[\x20-\x7e]+$/.test(input.email) || !normalizeEmail(input.email)
            || typeof input.password !== 'string' || input.password.length < 1 || input.password.length > 256)
          return reply(400, { error: 'INVALID_INPUT' });
        const email = normalizeEmail(input.email);
        const retry = emailBudget(email, now());
        if (retry) return limited(retry);
        const db = await database();
        const { rows } = await db.query('SELECT id,password_hash FROM imobilead.users WHERE email=$1', [email]);
        const user = rows[0];
        const verified = await verifyPassword(user?.password_hash ?? DUMMY_HASH, input.password);
        if (!user || !verified) return reply(401, { error: 'INVALID_CREDENTIALS' });
        const token = newSessionToken(), created = now();
        await db.query(`INSERT INTO imobilead.sessions(token_hash,user_id,created_at,expires_at)
          VALUES($1,$2,$3,$4)`, [tokenDigest(token), user.id, new Date(created), new Date(created + SESSION_SECONDS * 1000)]);
        return reply(200, { user: { id: user.id } }, { 'Set-Cookie': sessionCookie(token, config) });
      }
      if (action === 'session') {
        const session = await authenticateSession({ database, cookie: request.headers.get('cookie'), config, now });
        return session ? reply(200, session) : reply(401, { error: 'UNAUTHENTICATED' });
      }
      const token = cookieToken(request.headers.get('cookie'), config);
      if (token) await (await database()).query(`UPDATE imobilead.sessions
        SET revoked_at=GREATEST(created_at,$2) WHERE token_hash=$1 AND revoked_at IS NULL`, [tokenDigest(token), new Date(now())]);
      return reply(200, { ok: true }, { 'Set-Cookie': sessionCookie('', config, true) });
    } catch {
      diagnostic('AUTH_FAILED');
      return reply(503, { error: 'AUTH_FAILED' });
    } finally { active--; }
  }
  return { login: request => guarded(request, 'login'), session: request => guarded(request, 'session'), logout: request => guarded(request, 'logout') };
}
