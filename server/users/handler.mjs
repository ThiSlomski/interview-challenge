import 'server-only';
import { authenticateSession } from '../auth/session.mjs';
import { mayRead, validId } from './policy.mjs';
import { readUsers } from './repository.mjs';

const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export function createUsersHandler({ database, config, now = Date.now, diagnostic = () => {} }) {
  return async (request, id) => {
    try {
      const session = await authenticateSession({ database, cookie: request.headers.get('cookie'), config: config(), now });
      if (!session || !validId(session.user?.id)) return reply(401, { error: 'UNAUTHENTICATED' });
      const db = await database();
      // Fresh lookup on every request; session endpoint remains minimal.
      const { rows } = await db.query('SELECT id,role FROM imobilead.users WHERE id=$1', [session.user.id]);
      const actor = rows.length === 1 && rows[0].id === session.user.id ? rows[0] : null;
      if (!mayRead(actor, id)) return reply(403, { error: 'FORBIDDEN' });
      if (id !== undefined && !validId(id)) return reply(400, { error: 'INVALID_ID' });
      const params = new URL(request.url).searchParams;
      if ([...params.keys()].some(key => id !== undefined || key !== 'after') || params.getAll('after').length > 1
          || (params.has('after') && !validId(params.get('after')))) return reply(400, { error: 'INVALID_QUERY' });
      const result = await readUsers(db, { id, after: params.get('after') });
      if (id !== undefined) return result ? reply(200, { user: result }) : reply(404, { error: 'NOT_FOUND' });
      return reply(200, result);
    } catch {
      diagnostic('USERS_FAILED');
      return reply(503, { error: 'USERS_FAILED' });
    }
  };
}
