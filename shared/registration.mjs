// Browser-safe: no server, environment, crypto or database imports.
export const registrationFields = Object.freeze([
  'name', 'email', 'password', 'passwordConfirmation',
  'address', 'city', 'state', 'country', 'postalCode', 'message',
]);
const optionalFields = registrationFields.slice(4);

export function validateRegistration(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { body: 'INVALID_OBJECT' } };
  }
  if (Object.keys(input).some(key => !registrationFields.includes(key))) errors.body = 'UNKNOWN_FIELDS';
  if (typeof input.name !== 'string' || [...input.name].length > 150 || input.name.includes('\0')) errors.name = 'INVALID_NAME';
  // DB-001 explicitly defines ASCII casefold; international email needs a new contract.
  const originalEmail = typeof input.email === 'string' ? input.email.replace(/^ +| +$/g, '') : '';
  const email = originalEmail.toLowerCase();
  const [local, domain, extra] = email.split('@');
  // Supported syntax: ASCII dot-atom and dotted DNS hostname, not quoted locals,
  // comments, IP literals or SMTPUTF8. Format does not prove mailbox ownership.
  const atom = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  const label = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  // After the ASCII check, string lengths equal octets. RFC 5321 §4.5.3.1:
  // local <=64, path <=256 including <>, hence mailbox <=254.
  // RFC 1035 §2.3.4 limits each DNS label to 63 octets. No Node APIs needed.
  if (!/^[\x21-\x7e]+$/.test(originalEmail) || extra !== undefined
      || email.length > 254 || !local || local.length > 64 || !atom.test(local)
      || !domain || !domain.includes('.')
      || !domain.split('.').every(part => part.length <= 63 && label.test(part))) errors.email = 'INVALID_EMAIL';
  if (typeof input.password !== 'string' || !/^[a-zA-Z0-9]{8,35}$/.test(input.password)) errors.password = 'INVALID_PASSWORD';
  if (typeof input.passwordConfirmation !== 'string' || input.passwordConfirmation !== input.password) errors.passwordConfirmation = 'PASSWORD_MISMATCH';
  for (const field of optionalFields) {
    if (input[field] != null && (typeof input[field] !== 'string' || input[field].includes('\0'))) errors[field] = 'INVALID_TEXT';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: {
    name: input.name, email, password: input.password,
    ...Object.fromEntries(optionalFields.map(field => [field, input[field] ?? null])),
  } };
}
