import 'server-only';
import { validateRegistration } from '../../shared/registration.mjs';
import { hashPassword } from './password.mjs';
import { insertUser } from './repository.mjs';

export const BODY_LIMIT = 16384;
const BODY_TIMEOUT = 5000;

// Fixed-size process-wide budget. No untrusted IP/Forwarded keys or growing map.
export function createRegistrationHandler({ database, origin, now = Date.now, diagnostic = () => {} }) {
  let start = now(), attempts = 0, active = 0;
  const reply = (status, error, extra = {}) => Response.json(error, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
  return async function POST(request) {
    const time = now();
    if (time - start >= 60000) { start = time; attempts = 0; }
    if (++attempts > 20) return reply(429, { error: 'RATE_LIMITED' }, { 'Retry-After': String(Math.max(1, Math.ceil((start + 60000 - time) / 1000))) });
    let expected;
    try {
      const parsed = new URL(origin());
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin()) throw new Error();
      expected = parsed.origin;
    } catch { return reply(503, { error: 'REGISTRATION_UNAVAILABLE' }); }
    const supplied = request.headers.get('origin');
    if ((supplied !== null && supplied !== expected)
        || request.headers.get('sec-fetch-site') === 'cross-site') return reply(403, { error: 'ORIGIN_REFUSED' });
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
        || (request.headers.get('content-encoding') ?? 'identity') !== 'identity') return reply(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) return reply(413, { error: 'BODY_TOO_LARGE' });
    if (active >= 2) return reply(429, { error: 'REGISTRATION_BUSY' }, { 'Retry-After': '1' });
    active++;
    try {
      let bytes;
      try { bytes = await readBody(request); }
      catch (error) { return reply(error.status ?? 400, { error: error.status === 413 ? 'BODY_TOO_LARGE' : error.status === 408 ? 'BODY_TIMEOUT' : 'INVALID_BODY' }); }
      let input;
      try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
      catch { return reply(400, { error: 'INVALID_JSON' }); }
      const result = validateRegistration(input);
      if (!result.ok) return reply(400, { error: 'INVALID_INPUT', fields: result.errors });
      try {
        const hash = await hashPassword(result.value.password);
        const user = await insertUser(await database(), result.value, hash);
        return reply(201, { user });
      } catch (error) {
        if (error?.code === '23505' && error?.constraint === 'users_email_key') return reply(409, { error: 'REGISTRATION_CONFLICT' });
        diagnostic('REGISTRATION_FAILED');
        return reply(500, { error: 'REGISTRATION_FAILED' });
      }
    } finally { active--; }
  };
}

async function readBody(request) {
  if (!request.body) throw new Error();
  const reader = request.body.getReader();
  let timer, total = 0;
  const chunks = [];
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(), { status: 408 })), BODY_TIMEOUT);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) throw Object.assign(new Error(), { status: 413 });
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
