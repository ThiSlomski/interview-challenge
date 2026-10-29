import 'server-only';
import { hash, verify, Algorithm, Version } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';

export function hashPassword(password) {
  return hash(password, { algorithm: Algorithm.Argon2id, version: Version.V0x13, memoryCost: 19456,
    timeCost: 2, parallelism: 1, outputLen: 32, salt: randomBytes(16) });
}

export function verifyPassword(hash, password) {
  return verify(hash, password);
}
