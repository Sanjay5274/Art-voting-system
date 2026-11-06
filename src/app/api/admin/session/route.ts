import { NextResponse } from 'next/server';
import { isAdminAuthenticated, ADMIN_EMAIL } from '@/lib/auth';

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({
    authenticated,
    email: authenticated ? ADMIN_EMAIL : null,
  });
}

