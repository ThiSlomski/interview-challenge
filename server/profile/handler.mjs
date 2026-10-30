import 'server-only';
import { authenticateSession, sessionConfig } from '../auth/session.mjs';
import { validId } from '../users/policy.mjs';
import { validateProfile } from '../../shared/profile.mjs';
import { checkProfileOrigin, readProfileJson } from './request.mjs';
import { readProfile, updateProfile, profileEtag } from './repository.mjs';

function reply(status, body, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
export function createProfileHandlers({ database, config: configuration, now = Date.now, diagnostic = () => {} }) {
  let start = now(), attempts = 0, active = 0;
  async function handle(request, write) {
    let config;
    try { config = sessionConfig(configuration()); }
    catch { return reply(503, { error: 'PROFILE_UNAVAILABLE' }); }
    if (write && !checkProfileOrigin(request, config)) return reply(403, { error: 'ORIGIN_REFUSED' });
    if (write) {
      const time = now();
      if (time - start >= 60000) { start = time; attempts = 0; }
      if (++attempts > 20 || active >= 2) return reply(429, { error: 'RATE_LIMITED' }, { 'Retry-After': active >= 2 ? '1' : String(Math.max(1, Math.ceil((start + 60000 - time) / 1000))) });
      active++;
    }
    try {
      const session = await authenticateSession({ database, cookie: request.headers.get('cookie'), config, now });
      if (!session || !validId(session.user?.id)) return reply(401, { error: 'UNAUTHENTICATED' });
      if (new URL(request.url).search) return reply(400, { error: 'INVALID_QUERY' });
      let result;
      if (write) {
        let input;
        try { input = await readProfileJson(request); }
        catch (error) { return reply(error.status ?? 400, { error: error.code ?? 'INVALID_BODY' }); }
        const checked = validateProfile(input);
        if (!checked.ok) return reply(400, { error: 'INVALID_INPUT', fields: checked.errors });
        const etag = request.headers.get('if-match');
        if (etag === null) return reply(428, { error: 'PROFILE_PRECONDITION_REQUIRED' });
        if (!/^"profile:[0-9a-f-]{36}:[1-9][0-9]{0,9}"$/.test(etag)) return reply(400, { error: 'INVALID_PRECONDITION' });
        result = await updateProfile(await database(), { id: session.user.id, cookie: request.headers.get('cookie'), config, input: checked.value, etag, now });
      } else result = await readProfile(await database(), session.user.id);
      return result.status === 200
        ? reply(200, result.body, { ETag: profileEtag(result.body.user.id, result.body.profileVersion) })
        : reply(result.status, { error: result.error });
    } catch {
      diagnostic('PROFILE_FAILED');
      return reply(503, { error: 'PROFILE_FAILED' });
    } finally { if (write) active--; }
  }
  return { GET: request => handle(request, false), PATCH: request => handle(request, true) };
}
