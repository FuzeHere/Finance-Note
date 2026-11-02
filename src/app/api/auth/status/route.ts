import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured } from '@/lib/server/auth';

export async function GET() {
  return NextResponse.json({
    configured: isGoogleOAuthConfigured(),
  });
}
