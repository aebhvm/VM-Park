import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { User } from '../src/types.js';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const PASSWORD_PREFIX = 'scrypt$';

export type SafeUser = Omit<User, 'password'>;

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function sanitizeAuditData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'password')
        .map(([key, item]) => [key, sanitizeAuditData(item)])
    );
  }
  return value;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (password.length > 128) return 'A senha deve ter no mÃ¡ximo 128 caracteres.';
  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `${PASSWORD_PREFIX}${salt}$${digest}`;
}

export function verifyPassword(password: string, storedPassword?: string): boolean {
  if (!storedPassword) return false;
  if (!storedPassword.startsWith(PASSWORD_PREFIX)) {
    const provided = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return provided.length === stored.length && timingSafeEqual(provided, stored);
  }

  const [, salt, storedDigest] = storedPassword.split('$');
  if (!salt || !storedDigest) return false;
  const calculatedDigest = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(calculatedDigest, 'hex'), Buffer.from(storedDigest, 'hex'));
}

export function needsPasswordUpgrade(storedPassword?: string): boolean {
  return Boolean(storedPassword && !storedPassword.startsWith(PASSWORD_PREFIX));
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, secret: string): string {
  const payload = encodeBase64Url(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_DURATION_MS }));
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function getSessionUserId(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const [payload, providedSignature] = token.split('.');
  if (!payload || !providedSignature) return null;

  const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url');
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as { userId?: string; expiresAt?: number };
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed.userId;
  } catch {
    return null;
  }
}
