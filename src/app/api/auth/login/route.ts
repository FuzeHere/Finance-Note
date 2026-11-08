import { NextRequest, NextResponse } from 'next/server';
import { createSession, getLocalUserByEmail } from '@/lib/server/db';
import { SESSION_COOKIE_NAME, shouldUseSecureCookie, verifyPassword } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = getLocalUserByEmail(cleanEmail);
    if (!user?.password_hash || typeof password !== 'string' || !await verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ message: 'Email atau kata sandi salah.' }, { status: 401 });
    }
    const token = createSession(user.id);
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, provider: 'local', createdAt: user.created_at } });
    response.cookies.set(SESSION_COOKIE_NAME, token, { httpOnly: true, secure: shouldUseSecureCookie(request), sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Tidak dapat masuk saat ini. Coba lagi.' }, { status: 500 });
  }
}
