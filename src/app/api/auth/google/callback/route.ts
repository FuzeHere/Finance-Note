import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppBaseUrl, SESSION_COOKIE_NAME } from '@/lib/server/auth';
import { upsertUser, createSession } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = getAppBaseUrl();

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=missing_code`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=invalid_state`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=not_configured`);
    }

    // Tukar code dengan token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Google token exchange error:', errText);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Ambil info pengguna dari Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=userinfo_failed`);
    }

    const googleUser = await userinfoResponse.json();
    const email = googleUser.email;
    const name = googleUser.name || email.split('@')[0];
    const avatar = googleUser.picture || null;

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=no_email`);
    }

    // Simpan atau perbarui user di SQLite
    const user = upsertUser({
      email,
      name,
      avatar,
      provider: 'google',
    });

    // Buat session
    const sessionToken = createSession(user.id);

    // Set cookie sesi
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: '/',
    });

    // Bersihkan cookie state
    cookieStore.delete('google_oauth_state');

    return NextResponse.redirect(`${baseUrl}/?login=success`);
  } catch (err) {
    console.error('OAuth Callback unhandled error:', err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=server_error`);
  }
}
