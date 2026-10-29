import { database } from '../../../server/db';
import { createRegistrationHandler } from '../../../server/registration/handler.mjs';
import { getUsers } from '../../../server/users';

export const runtime = 'nodejs';
export const GET = (request: Request) => getUsers(request);
export const POST = createRegistrationHandler({
  database,
  origin: () => process.env.APP_ORIGIN ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''),
  diagnostic: () => console.error('REGISTRATION_FAILED'),
});
