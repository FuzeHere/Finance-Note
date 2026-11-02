import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isGoogleOAuthConfigured, getAppBaseUrl } from '@/lib/server/auth';

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: 'GOOGLE_AUTH_NOT_CONFIGURED',
        message: 'Google Client ID dan Client Secret belum dikonfigurasi di file .env atau Docker environment.',
      },
      { status: 400 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const baseUrl = getAppBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const state = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 menit
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
