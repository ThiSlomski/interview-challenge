// Browser/server entry point; every rule lives in the shared Zod schemas.
import { registrationSchema, validateSchema } from './schemas.mjs';
export { registrationFields, profileFields, requiredProfileFields, requiredRegistrationFields, normalizeEmail, registrationSchema } from './schemas.mjs';
export function validateRegistration(input) {
  return validateSchema(registrationSchema, input);
}
