import 'server-only';
import { database } from '../db';
import { createUsersHandler } from './handler.mjs';

export const getUsers = createUsersHandler({
  database,
  config: () => ({ origin: process.env.APP_ORIGIN ?? '', ttl: process.env.SESSION_TTL_SECONDS, production: process.env.NODE_ENV === 'production' }),
  diagnostic: () => console.error('USERS_FAILED'),
});
