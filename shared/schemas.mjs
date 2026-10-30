import { z } from 'zod';

export const registrationFields = Object.freeze([
  'name', 'email', 'password', 'passwordConfirmation',
  'address', 'city', 'state', 'country', 'postalCode', 'message',
]);
export const profileFields = Object.freeze(['name', 'address', 'city', 'state', 'country', 'postalCode', 'message']);
export const requiredProfileFields = Object.freeze(['name', 'city', 'state', 'country']);
export const requiredRegistrationFields = Object.freeze(['name', 'email', 'password', 'passwordConfirmation', 'city', 'state', 'country']);
export const MAX_PROFILE_VERSION = 2147483647;

// ASCII-space trim/casefold is the existing email/DB/login contract.
// Passwords never pass through any normalization or coercion.
export function normalizeEmail(value) {
  return typeof value === 'string' ? value.replace(/^ +| +$/g, '').toLowerCase() : '';
}

function essentialText(field) {
  const invalid = field === 'name' ? 'INVALID_NAME' : 'INVALID_TEXT';
  let schema = z.string({ error: invalid }).trim()
    .min(1, { error: 'REQUIRED_' + field.toUpperCase() })
    .refine(value => !value.includes('\0'), { error: invalid });
  if (field === 'name') schema = schema.refine(value => [...value].length <= 150, { error: invalid });
  return z.preprocess(value => value == null ? '' : value, schema);
}
const optionalText = z.string({ error: 'INVALID_TEXT' })
  .refine(value => !value.includes('\0'), { error: 'INVALID_TEXT' }).nullable();
const textShape = Object.fromEntries(profileFields.map(field => [field,
  requiredProfileFields.includes(field) ? essentialText(field) : optionalText.optional().transform(value => value ?? null),
]));
export const profileTextSchema = z.strictObject(textShape);

// Retain ASCII dot-atom/dotted DNS syntax and byte boundaries; the default
// Zod email format would silently narrow the existing contract.
const emailSchema = z.string({ error: 'INVALID_EMAIL' })
  .transform(value => value.replace(/^ +| +$/g, ''))
  .refine(value => /^[\x21-\x7e]+$/.test(value), { error: 'INVALID_EMAIL' })
  .transform(value => value.toLowerCase())
  .refine(email => {
    const [local, domain, extra] = email.split('@');
    const atom = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
    const label = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    return extra === undefined && email.length <= 254 && Boolean(local) && local.length <= 64 && atom.test(local)
      && Boolean(domain) && domain.includes('.') && domain.split('.').every(part => part.length <= 63 && label.test(part));
  }, { error: 'INVALID_EMAIL' });
const passwordSchema = z.string({ error: 'INVALID_PASSWORD' }).regex(/^[a-zA-Z0-9]{8,35}$/, { error: 'INVALID_PASSWORD' });

export const registrationSchema = z.strictObject({
  name: textShape.name, email: emailSchema, password: passwordSchema,
  passwordConfirmation: z.string({ error: 'PASSWORD_MISMATCH' }).refine(value => Boolean(value.trim()), { error: 'PASSWORD_MISMATCH' }),
  ...Object.fromEntries(profileFields.filter(field => field !== 'name').map(field => [field, textShape[field]])),
}).refine(value => value.passwordConfirmation === value.password, {
  path: ['passwordConfirmation'], error: 'PASSWORD_MISMATCH',
  // An invalid name/location must not suppress this independent field error.
  when: ({ value }) => value !== null && typeof value === 'object' && !Array.isArray(value)
    && typeof value.passwordConfirmation === 'string',
}).transform(({ passwordConfirmation: _confirmation, ...value }) => value);

export const profileVersionSchema = z.number({ error: 'INVALID_VERSION' }).int({ error: 'INVALID_VERSION' })
  .min(1, { error: 'INVALID_VERSION' }).max(MAX_PROFILE_VERSION, { error: 'INVALID_VERSION' });
const objectPayload = ({ value }) => value !== null && typeof value === 'object' && !Array.isArray(value);
const profilePatchBase = z.strictObject({ ...textShape, expectedVersion: profileVersionSchema })
  .partial(Object.fromEntries(profileFields.map(field => [field, true])))
  .refine(value => profileFields.some(field => Object.hasOwn(value, field)), {
    path: ['body'], error: 'EMPTY_PATCH', when: objectPayload,
  });
export const profilePatchSchema = requiredProfileFields.reduce((schema, field) => schema.refine(
  value => !Object.hasOwn(value, field) || value[field] !== undefined,
  { path: [field], error: 'REQUIRED_' + field.toUpperCase(), when: objectPayload },
), profilePatchBase).transform(value => Object.fromEntries(Object.entries(value).map(([field, supplied]) => [field, supplied === undefined ? null : supplied])));

const publicCodes = new Set(['INVALID_NAME', 'INVALID_TEXT', 'INVALID_EMAIL', 'INVALID_PASSWORD', 'PASSWORD_MISMATCH',
  'INVALID_VERSION', 'EMPTY_PATCH', ...requiredProfileFields.map(field => 'REQUIRED_' + field.toUpperCase())]);
// Only controlled public codes leave this adapter, never ZodError/input/keys.
/** @returns {{ok: true, value: unknown} | {ok: false, errors: Record<string, string>}} */
export function validateSchema(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (issue.code === 'unrecognized_keys') errors.body = 'UNKNOWN_FIELDS';
    else if (!field) errors.body = 'INVALID_OBJECT';
    else if (!Object.hasOwn(errors, field) && publicCodes.has(issue.message)) errors[field] = issue.message;
  }
  return { ok: false, errors: Object.keys(errors).length ? errors : { body: 'INVALID_OBJECT' } };
}
