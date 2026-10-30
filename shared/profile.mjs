import { profileFields, validateProfileFields } from './registration.mjs';

export { profileFields };
export const MAX_PROFILE_VERSION = 2147483647;
export const validProfileVersion = value => Number.isInteger(value) && value >= 1 && value <= MAX_PROFILE_VERSION;

export function validateProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { body: 'INVALID_OBJECT' } };
  const { errors, value } = validateProfileFields(input, true);
  if (Object.keys(input).some(key => !profileFields.includes(key) && key !== 'expectedVersion')) errors.body = 'UNKNOWN_FIELDS';
  if (!profileFields.some(key => Object.hasOwn(input, key))) errors.body = 'EMPTY_PATCH';
  if (!validProfileVersion(input.expectedVersion)) errors.expectedVersion = 'INVALID_VERSION';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { ...value, expectedVersion: input.expectedVersion } };
}
