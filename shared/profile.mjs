import { profilePatchSchema, profileVersionSchema, validateSchema } from './schemas.mjs';
export { profileFields, MAX_PROFILE_VERSION, profilePatchSchema } from './schemas.mjs';
export const validProfileVersion = value => profileVersionSchema.safeParse(value).success;
export function validateProfile(input) {
  return validateSchema(profilePatchSchema, input);
}
