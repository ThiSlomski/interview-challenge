import { database } from '../../../server/db';
import { createRegistrationHandler } from '../../../server/registration/handler.mjs';

export const runtime = 'nodejs';
export const POST = createRegistrationHandler({
  database,
  origin: () => process.env.APP_ORIGIN ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''),
  diagnostic: () => console.error('REGISTRATION_FAILED'),
});
