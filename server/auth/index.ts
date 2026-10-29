import 'server-only';
import { database } from '../db';
import { createAuthHandlers } from './handler.mjs';

export const auth = createAuthHandlers({
  database,
  config: () => ({ origin: process.env.APP_ORIGIN ?? '', ttl: process.env.SESSION_TTL_SECONDS, production: process.env.NODE_ENV === 'production' }),
  diagnostic: () => console.error('AUTH_FAILED'),
});
