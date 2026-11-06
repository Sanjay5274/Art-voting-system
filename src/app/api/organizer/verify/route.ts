import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret } = body;

    const expectedSecret = process.env.ORGANIZER_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'ORGANIZER_SECRET is not configured on the server.' },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid organizer secret key.' },
        { status: 401 }
      );
    }

    // Set cookie for session persistence in organizer portal
    const cookieStore = await cookies();
    cookieStore.set('organizer_secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: 'Organizer authenticated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

