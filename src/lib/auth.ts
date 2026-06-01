import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_DEFAULT = 'dev-secret-change-me-please-32chars';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === JWT_DEFAULT) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET || JWT_DEFAULT);

export type SessionPayload = {
  uid: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export async function signSession(payload: SessionPayload, exp = '30d') {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export function comparePassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// API key utilities
export function generateApiKey() {
  // sk-a4c + 48 random hex chars.
  const raw = crypto.randomBytes(24).toString('hex');
  const key = `sk-a4c-${raw}`;
  const prefix = key.slice(0, 12);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

export function hashApiKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
