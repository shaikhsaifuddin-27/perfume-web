import { generateSecret, generateURI, verifySync } from 'otplib';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export function createMfaSecret(email: string) {
  const secret = generateSecret();
  return {
    secret,
    otpauthUrl: generateURI({ issuer: 'Maison Elara Admin', label: email, secret }),
  };
}

export function verifyMfaToken(token: string, secret: string) {
  return verifySync({ token, secret, epochTolerance: 30 }).valid;
}

export async function createRecoveryCodes() {
  const codes = Array.from({ length: 8 }, () => randomBytes(5).toString('hex').toUpperCase());
  const hashed = await Promise.all(codes.map((code) => bcrypt.hash(code, 12)));
  return { codes, hashed };
}
