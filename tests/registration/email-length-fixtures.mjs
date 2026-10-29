// ASCII fixtures shared only by tests. Each invalid case isolates one limit.
export const emailLengthCases = [
  { name: 'local', valid: 'a'.repeat(64) + '@example.test', invalid: 'a'.repeat(65) + '@example.test' },
  { name: 'label', valid: 'a@' + 'b'.repeat(63) + '.test', invalid: 'a@' + 'b'.repeat(64) + '.test' },
  { name: 'total',
    valid: 'a'.repeat(64) + '@' + ['b'.repeat(63), 'c'.repeat(63), 'd'.repeat(61)].join('.'),
    invalid: 'a'.repeat(64) + '@' + ['b'.repeat(63), 'c'.repeat(63), 'd'.repeat(62)].join('.'),
  },
];
