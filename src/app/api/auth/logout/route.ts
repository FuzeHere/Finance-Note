import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/server/auth';
import { deleteSession } from '@/lib/server/db';

export async function POST() {
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    const authHeader = (await headers()).get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.slice(7).trim();
    }
  }

  if (sessionToken) {
    deleteSession(sessionToken);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return NextResponse.json({ success: true });
}
