import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/server/auth';
import { deleteSession } from '@/lib/server/db';

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    deleteSession(sessionToken);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return NextResponse.json({ success: true });
}
