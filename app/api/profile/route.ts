import { database } from '../../../server/db';
import { createProfileHandlers } from '../../../server/profile/handler.mjs';

export const runtime = 'nodejs';
export const { GET, PATCH } = createProfileHandlers({
  database,
  config: () => ({ origin: process.env.APP_ORIGIN ?? '', ttl: process.env.SESSION_TTL_SECONDS, production: process.env.NODE_ENV === 'production' }),
  diagnostic: () => console.error('PROFILE_FAILED'),
});
