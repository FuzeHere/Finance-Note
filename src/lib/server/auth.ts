import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getUserBySession, DbUser } from './db';

export const SESSION_COOKIE_NAME = 'finance_note_session';
const scrypt = promisify(scryptCallback);

export function shouldUseSecureCookie(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  return request.nextUrl.protocol === 'https:' || forwardedProto === 'https';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, savedHex] = stored.split(':');
  if (!salt || !savedHex) return false;
  const saved = Buffer.from(savedHex, 'hex');
  const candidate = await scrypt(password, salt, saved.length) as Buffer;
  return saved.length === candidate.length && timingSafeEqual(saved, candidate);
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getUserBySession(sessionToken);
}

