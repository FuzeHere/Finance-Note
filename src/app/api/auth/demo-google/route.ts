import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/server/auth';
import { upsertUser, createSession } from '@/lib/server/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email || 'pengguna.gmail@gmail.com';
    const name = body.name || 'Pengguna Google';
    const avatar = body.avatar || null;

    const user = upsertUser({
      email,
      name,
      avatar,
      provider: 'google',
    });

    const sessionToken = createSession(user.id);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.created_at,
        isGuest: false,
      },
    });
  } catch (err) {
    console.error('Demo auth error:', err);
    return NextResponse.json({ error: 'Gagal melakukan login simulasi' }, { status: 500 });
  }
}
