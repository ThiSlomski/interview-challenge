import 'server-only';
import { authenticateSession, sessionConfig } from '../auth/session.mjs';
import { checkProfileOrigin, BODY_LIMIT, BODY_TIMEOUT } from '../profile/request.mjs';
import { mayRead, validId } from './policy.mjs';
import { deleteCommonUser } from './delete-repository.mjs';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const reply = (status, error, extra = {}) => status === 204
  ? new Response(null, { status, headers }) : Response.json({ error }, { status, headers: { ...headers, ...extra } });

async function requireEmptyBody(request) {
  if (!request.body) return;
  const reader = request.body.getReader();
  let timer;
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject({ status: 408, code: 'BODY_TIMEOUT' }), BODY_TIMEOUT); });
  try {
    // Next can expose a non-null stream for an empty DELETE. Accept EOF, never
    // payload bytes. No parsing, accumulation, or identity supplied in a body.
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) return;
      if (value.byteLength) throw { status: value.byteLength > BODY_LIMIT ? 413 : 400, code: value.byteLength > BODY_LIMIT ? 'BODY_TOO_LARGE' : 'INVALID_BODY' };
    }
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createDeleteUserHandler({ database, config: configuration, now = Date.now, diagnostic = () => {} }) {
  let start = now(), attempts = 0, active = 0;
  return async (request, targetId) => {
    let occupied = false, client;
    try {
      const config = sessionConfig(configuration());
      // Lazily borrow one client for initial authentication, authorization and
      // the transaction. Invalid cookie syntax does not acquire a connection.
      const connection = async () => client ??= await (await database()).connect();
      const session = await authenticateSession({ database: connection, cookie: request.headers.get('cookie'), config, now });
      if (!session || !validId(session.user?.id)) return reply(401, 'UNAUTHENTICATED');
      const db = await connection();
      const { rows } = await db.query('SELECT id,role FROM imobilead.users WHERE id=$1', [session.user.id]);
      const actor = rows.length === 1 && rows[0].id === session.user.id ? rows[0] : null;
      // No target parsing, locking or lookup until fresh admin authorization.
      if (!mayRead(actor, undefined)) return reply(403, 'FORBIDDEN');
      if (!checkProfileOrigin(request, config)) return reply(403, 'ORIGIN_REFUSED');
      if (!validId(targetId)) return reply(400, 'INVALID_ID');
      if (new URL(request.url).search) return reply(400, 'INVALID_QUERY');
      const length = request.headers.get('content-length');
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) return reply(413, 'BODY_TOO_LARGE');
      if ((request.headers.get('content-encoding') ?? 'identity') !== 'identity') return reply(415, 'UNSUPPORTED_MEDIA_TYPE');
      if (length !== null && Number(length) !== 0) {
        void request.body?.cancel().catch(() => {});
        return reply(400, 'INVALID_BODY');
      }
      const time = now();
      if (time - start >= 60000) { start = time; attempts = 0; }
      if (++attempts > 20 || active >= 2) return reply(429, 'RATE_LIMITED', { 'Retry-After': active >= 2 ? '1' : String(Math.max(1, Math.ceil((start + 60000 - time) / 1000))) });
      active++; occupied = true;
      try { await requireEmptyBody(request); }
      catch (error) { return reply(error.status ?? 400, error.code ?? 'INVALID_BODY'); }
      const result = await deleteCommonUser(db, {
        actorId: session.user.id, targetId: targetId.toLowerCase(), cookie: request.headers.get('cookie'), config, now,
      });
      return reply(result.status, result.error);
    } catch {
      diagnostic('USER_DELETE_FAILED');
      return reply(503, 'USER_DELETE_FAILED');
    } finally { if (occupied) active--; client?.release(); }
  };
}
