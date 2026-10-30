import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../../shared/registration.mjs';
import { validateProfile, profileFields, profilePatchSchema } from '../../shared/profile.mjs';

test('Zod profile schema parses partial normalized edits and keeps unknown keys out of public errors', () => {
  const input = { expectedVersion: 1, city: '  Cidade  ', address: null };
  const parsed = profilePatchSchema.safeParse(input);
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, { expectedVersion: 1, city: 'Cidade', address: null });
  assert.deepEqual(validateProfile(input), { ok: true, value: parsed.data });
  const invalid = { expectedVersion: 1, country: ' ', password: 'private-profile-value' };
  assert.equal(profilePatchSchema.safeParse(invalid).success, false);
  const checked = validateProfile(invalid);
  assert.deepEqual(checked, { ok: false, errors: { country: 'REQUIRED_COUNTRY', body: 'UNKNOWN_FIELDS' } });
  assert.equal(JSON.stringify(checked).includes('private-profile-value'), false);
});

test('profile reuses signup essential and optional text rules including Unicode', () => {
  const signup = { name: 'Fixture', email: 'fixture@example.test', password: 'Abc12345', passwordConfirmation: 'Abc12345', city: 'City', state: 'State', country: 'Country' };
  for (const field of profileFields) {
    const values = field === 'name' ? ['', '😀'.repeat(150), '😀'.repeat(151), null, 42, 'x\0'] : ['', null, '非Brasil', 'x'.repeat(15000), 42, {}, [], 'x\0'];
    for (const value of values) {
      assert.equal(validateProfile({ expectedVersion: 1, [field]: value }).ok, validateRegistration({ ...signup, [field]: value }).ok);
    }
  }
});
test('partial edits preserve omitted essentials and explicit optional nulls', () => {
  assert.deepEqual(validateProfile({ expectedVersion: 2, address: null }), { ok: true, value: { address: null, expectedVersion: 2 } });
  assert.deepEqual(validateProfile({ expectedVersion: 1, name: ' Fixture ' }), { ok: true, value: { name: 'Fixture', expectedVersion: 1 } });
});

test('profile cannot clear any essential field with null, blank or whitespace', () => {
  for (const field of ['name','city','state','country']) {
    for (const value of [null, '', ' \t\r\n\u00a0\u2003\uFEFF ']) assert.deepEqual(validateProfile({ expectedVersion: 1, [field]: value }), { ok: false, errors: { [field]: 'REQUIRED_' + field.toUpperCase() } });
    assert.deepEqual(validateProfile({ expectedVersion: 1, [field]: '  Valid  Text \t' }), { ok: true, value: { [field]: 'Valid  Text', expectedVersion: 1 } });
  }
});
test('profile rejects mass assignment and credential or identity changes', () => {
  for (const key of ['email','password','passwordConfirmation','id','userId','role','password_hash','created_at','updated_at','profile_version','profileVersion','token_hash','__proto__']) {
    const checked = validateProfile({ expectedVersion: 1, name: 'Fixture', [key]: 'forged' });
    assert.equal(checked.ok, false); assert.equal(checked.errors.body, 'UNKNOWN_FIELDS');
  }
});
test('integer version is required, bounded by PostgreSQL integer and transported as a number', () => {
  for (const expectedVersion of [1, 2147483647]) assert.equal(validateProfile({ expectedVersion, name: 'Fixture' }).ok, true);
  for (const expectedVersion of [undefined, null, '1', 0, -1, 1.5, 2147483648, Infinity, NaN]) assert.equal(validateProfile({ expectedVersion, name: 'Fixture' }).ok, false);
});
test('profile rejects empty patch and non-object bodies', () => {
  for (const body of [null, [], 42, 'text', {}, { expectedVersion: 1 }]) assert.equal(validateProfile(body).ok, false);
});

test('profile empty patch and explicit undefined essential errors survive invalid version type', () => {
  assert.deepEqual(validateProfile({ expectedVersion: '1' }), { ok: false, errors: { expectedVersion: 'INVALID_VERSION', body: 'EMPTY_PATCH' } });
  assert.deepEqual(validateProfile({ expectedVersion: '1', name: undefined }), { ok: false, errors: { expectedVersion: 'INVALID_VERSION', name: 'REQUIRED_NAME' } });
});
