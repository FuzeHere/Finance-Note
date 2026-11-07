import { NextRequest, NextResponse } from 'next/server';
import { createLocalUser, getUserByEmail, upgradeUserToLocal, createSession } from '@/lib/server/db';
import { hashPassword, SESSION_COOKIE_NAME } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (cleanName.length < 2 || cleanName.length > 80) return NextResponse.json({ message: 'Nama harus terdiri dari 2–80 karakter.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ message: 'Alamat email tidak valid.' }, { status: 400 });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return NextResponse.json({ message: 'Kata sandi harus terdiri dari minimal 8 karakter.' }, { status: 400 });
    const existingUser = getUserByEmail(cleanEmail);
    if (existingUser?.provider === 'local') return NextResponse.json({ message: 'Email sudah terdaftar. Silakan masuk.' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const user = existingUser
      ? upgradeUserToLocal(existingUser.id, cleanName, passwordHash)
      : createLocalUser(cleanEmail, cleanName, passwordHash);
    const token = createSession(user.id);
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, provider: 'local', createdAt: user.created_at } });
    response.cookies.set(SESSION_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Pendaftaran gagal. Coba lagi.' }, { status: 500 });
  }
}
