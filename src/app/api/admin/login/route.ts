import { NextResponse } from 'next/server';
import { validateAdminCredentials, setAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    await setAdminSession();
    return NextResponse.json({ success: true, message: 'Logged in successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 500 });
  }
}

