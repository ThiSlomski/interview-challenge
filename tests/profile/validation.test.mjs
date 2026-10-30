import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../../shared/registration.mjs';
import { validateProfile, profileFields } from '../../shared/profile.mjs';

test('profile reuses signup text rules including Unicode, empty name and unrestricted optional text', () => {
  const signup = { name: '', email: 'fixture@example.test', password: 'Abc12345', passwordConfirmation: 'Abc12345' };
  for (const field of profileFields) {
    const values = field === 'name' ? ['', '😀'.repeat(150), '😀'.repeat(151), null, 42, 'x\0'] : ['', null, '非Brasil', 'x'.repeat(15000), 42, {}, [], 'x\0'];
    for (const value of values) {
      assert.equal(validateProfile({ expectedVersion: 1, [field]: value }).ok, validateRegistration({ ...signup, [field]: value }).ok);
    }
  }
});
test('partial edits preserve omitted fields and normalize explicit optional nulls like signup', () => {
  assert.deepEqual(validateProfile({ expectedVersion: 2, city: null }), { ok: true, value: { city: null, expectedVersion: 2 } });
  assert.deepEqual(validateProfile({ expectedVersion: 1, name: '' }), { ok: true, value: { name: '', expectedVersion: 1 } });
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
