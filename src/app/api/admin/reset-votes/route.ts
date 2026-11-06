import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { resetAllVotes } from '@/lib/store';

export async function POST() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    resetAllVotes();
    return NextResponse.json({ success: true, message: 'All votes have been reset to 0.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset votes.' }, { status: 500 });
  }
}

