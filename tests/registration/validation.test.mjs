import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationSchema, validateRegistration } from '../../shared/registration.mjs';
import { emailLengthCases } from './email-length-fixtures.mjs';

const valid = { name: 'Fixture', email: ' Fixture@Example.test ', password: 'Abc12345', passwordConfirmation: 'Abc12345', city: 'Fixture City', state: 'Region', country: 'Country' };
test('Zod registration schema parses normalized data and adapter exposes only controlled codes', () => {
  const input = { ...valid, name: ' Fixture ', city: ' Cidade ', state: ' Estado ', country: ' País ' };
  const parsed = registrationSchema.safeParse(input);
  assert.equal(parsed.success, true);
  assert.deepEqual(validateRegistration(input), { ok: true, value: parsed.data });
  assert.equal(parsed.data.name, 'Fixture'); assert.equal(parsed.data.city, 'Cidade');
  assert.equal(parsed.data.email, 'fixture@example.test'); assert.equal('passwordConfirmation' in parsed.data, false);
  const invalid = { ...valid, password: 'private-invalid-password', injectedField: 'private-injected-value', city: ' ' };
  assert.equal(registrationSchema.safeParse(invalid).success, false);
  const checked = validateRegistration(invalid);
  assert.equal(checked.ok, false); assert.equal(checked.errors.body, 'UNKNOWN_FIELDS');
  assert.equal(checked.errors.city, 'REQUIRED_CITY'); assert.equal(checked.errors.password, 'INVALID_PASSWORD');
  assert.equal(JSON.stringify(checked).includes('private-'), false);
  assert.equal(JSON.stringify(checked).includes('injectedField'), false);
  assert.equal(Object.hasOwn(checked, 'error'), false);
});
for (const fixture of emailLengthCases) {
  test(`email byte boundary: ${fixture.name}, valid edge and first invalid byte`, () => {
    for (const email of [fixture.valid, fixture.invalid]) assert.equal(Buffer.byteLength(email),email.length);
    const [local,domain]=fixture.invalid.split('@');
    if (fixture.name==='local') { assert.equal(local.length,65); assert.ok(domain.split('.').every(label=>label.length<=63)); assert.ok(fixture.invalid.length<=254); }
    if (fixture.name==='label') { assert.equal(domain.split('.')[0].length,64); assert.ok(local.length<=64); assert.ok(fixture.invalid.length<=254); }
    if (fixture.name==='total') { assert.equal(fixture.valid.length,254); assert.equal(fixture.invalid.length,255); assert.ok(local.length<=64); assert.ok(domain.split('.').every(label=>label.length<=63)); }
    const accepted=validateRegistration({...valid,email:' '+fixture.valid.toUpperCase()+' '});
    assert.equal(accepted.ok,true); assert.equal(accepted.value.email,fixture.valid);
    const rejected=validateRegistration({...valid,email:fixture.invalid});
    assert.deepEqual(rejected,{ok:false,errors:{email:'INVALID_EMAIL'}});
  });
}
test('canonical email, optional nullable text, confirmation omitted from result', () => {
  const result = validateRegistration(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'fixture@example.test');
  assert.equal(result.value.address, null);
  assert.equal('passwordConfirmation' in result.value, false);
  assert.equal(validateRegistration({...valid,email:'Fixture+tag@sub.example.test'}).ok,true);
});
test('name boundary uses Unicode code points after trimming external whitespace', () => {
  for (const name of ['a'.repeat(150), '😀'.repeat(150), ' \t' + '😀'.repeat(150) + '\n ']) assert.equal(validateRegistration({ ...valid, name }).ok, true);
  for (const name of [null, 42, 'a'.repeat(151), '😀'.repeat(151), 'x\0']) assert.equal(validateRegistration({ ...valid, name }).ok, false);
});
test('password boundaries 8 and 35, ASCII letters and digits without composition rule', () => {
  for (const password of ['a'.repeat(8), '9'.repeat(35), 'Abc12345']) assert.equal(validateRegistration({ ...valid, password, passwordConfirmation: password }).ok, true);
  for (const password of ['a'.repeat(7), 'a'.repeat(36), 'Abcd!234', 'éabc1234', ' abc1234', 12345678, null]) assert.equal(validateRegistration({ ...valid, password, passwordConfirmation: password }).ok, false);
});
test('confirmation must exist and match exactly', () => {
  for (const passwordConfirmation of [undefined, null, '', 'abc12345', 42]) assert.equal(validateRegistration({ ...valid, passwordConfirmation }).ok, false);
});

test('independent confirmation mismatch is retained alongside other invalid types and unknown fields', () => {
  for (const [input, errors] of [
    [{ ...valid, name: 42, passwordConfirmation: 'Different123' }, { name: 'INVALID_NAME', passwordConfirmation: 'PASSWORD_MISMATCH' }],
    [{ ...valid, password: null }, { password: 'INVALID_PASSWORD', passwordConfirmation: 'PASSWORD_MISMATCH' }],
    [{ ...valid, role: 'admin', passwordConfirmation: 'Different123' }, { body: 'UNKNOWN_FIELDS', passwordConfirmation: 'PASSWORD_MISMATCH' }],
  ]) assert.deepEqual(validateRegistration(input), { ok: false, errors });
});
test('invalid email, international casefold outside DB-001, required fields and object shape', () => {
  for (const email of ['', 'x@y', 'a@@b.test', 'a b@c.test', '\ta@b.test', 'á@b.test', 'K@example.test', 'a@b..test', 'a..b@c.test', 'a@-b.test', null, 42]) assert.equal(validateRegistration({ ...valid, email }).ok, false);
  for (const field of ['name','email','password','passwordConfirmation','city','state','country']) {
    const input = { ...valid }; delete input[field]; assert.equal(validateRegistration(input).ok, false);
  }
  for (const value of [null, [], 'input', 42]) assert.equal(validateRegistration(value).ok, false);
});
test('optional text participates without invented field length or Brazilian rules', () => {
  for (const field of ['address','postalCode','message']) {
    for (const value of ['', '非Brasil', 'x'.repeat(2000), null]) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, true);
    for (const value of [42, [], {}, false, 'x\0']) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, false);
  }
});

test('essential name and location reject missing, null, empty and whitespace values', () => {
  for (const field of ['name','city','state','country']) {
    for (const value of [undefined, null, '', ' \t\r\n\u00a0\u2003\uFEFF ']) {
      const input = { ...valid, [field]: value };
      if (value === undefined) delete input[field];
      assert.deepEqual(validateRegistration(input), { ok: false, errors: { [field]: 'REQUIRED_' + field.toUpperCase() } });
    }
  }
});

test('essential location preserves unrestricted nonempty Unicode and normalizes only external spaces', () => {
  for (const field of ['city','state','country']) {
    for (const value of ['非Brasil', 'x'.repeat(2000)]) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, true);
    for (const value of [42, [], {}, false, 'x\0']) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, false);
  }
  const result = validateRegistration({ ...valid, name: '\t Pessoa  Sintética \n', city: ' Cidade ', state: ' SP ', country: ' Brasil ' });
  assert.equal(result.ok, true);
  for (const [field, value] of Object.entries({ name: 'Pessoa  Sintética', city: 'Cidade', state: 'SP', country: 'Brasil' })) assert.equal(result.value[field], value);
  assert.equal(result.value.address, null); assert.equal(result.value.postalCode, null); assert.equal(result.value.message, null);
});
test('reject role and every internal or unknown field instead of mass assignment', () => {
  for (const field of ['role','id','created_at','updated_at','password_hash','token_hash','user_id','expires_at','unknown','__proto__']) {
    const result = validateRegistration({ ...valid, [field]: 'admin' });
    assert.equal(result.ok, false); assert.equal(result.errors.body, 'UNKNOWN_FIELDS');
  }
});
