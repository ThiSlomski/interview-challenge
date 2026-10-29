import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../../shared/registration.mjs';
import { emailLengthCases } from './email-length-fixtures.mjs';

const valid = { name: 'Fixture', email: ' Fixture@Example.test ', password: 'Abc12345', passwordConfirmation: 'Abc12345' };
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
test('name boundary uses Unicode code points and accepts existing empty-name contract', () => {
  for (const name of ['', 'a'.repeat(150), '😀'.repeat(150)]) assert.equal(validateRegistration({ ...valid, name }).ok, true);
  for (const name of [null, 42, 'a'.repeat(151), '😀'.repeat(151), 'x\0']) assert.equal(validateRegistration({ ...valid, name }).ok, false);
});
test('password boundaries 8 and 35, ASCII letters and digits without composition rule', () => {
  for (const password of ['a'.repeat(8), '9'.repeat(35), 'Abc12345']) assert.equal(validateRegistration({ ...valid, password, passwordConfirmation: password }).ok, true);
  for (const password of ['a'.repeat(7), 'a'.repeat(36), 'Abcd!234', 'éabc1234', ' abc1234', 12345678, null]) assert.equal(validateRegistration({ ...valid, password, passwordConfirmation: password }).ok, false);
});
test('confirmation must exist and match exactly', () => {
  for (const passwordConfirmation of [undefined, null, '', 'abc12345', 42]) assert.equal(validateRegistration({ ...valid, passwordConfirmation }).ok, false);
});
test('invalid email, international casefold outside DB-001, required fields and object shape', () => {
  for (const email of ['', 'x@y', 'a@@b.test', 'a b@c.test', '\ta@b.test', 'á@b.test', 'K@example.test', 'a@b..test', 'a..b@c.test', 'a@-b.test', null, 42]) assert.equal(validateRegistration({ ...valid, email }).ok, false);
  for (const field of ['name','email','password','passwordConfirmation']) {
    const input = { ...valid }; delete input[field]; assert.equal(validateRegistration(input).ok, false);
  }
  for (const value of [null, [], 'input', 42]) assert.equal(validateRegistration(value).ok, false);
});
test('all optional text participates without invented field length or Brazilian rules', () => {
  for (const field of ['address','city','state','country','postalCode','message']) {
    for (const value of ['', '非Brasil', 'x'.repeat(2000), null]) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, true);
    for (const value of [42, [], {}, false, 'x\0']) assert.equal(validateRegistration({ ...valid, [field]: value }).ok, false);
  }
});
test('reject role and every internal or unknown field instead of mass assignment', () => {
  for (const field of ['role','id','created_at','updated_at','password_hash','token_hash','user_id','expires_at','unknown','__proto__']) {
    const result = validateRegistration({ ...valid, [field]: 'admin' });
    assert.equal(result.ok, false); assert.equal(result.errors.body, 'UNKNOWN_FIELDS');
  }
});
