import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { clearAllDrawings } from '@/lib/store';

export async function POST() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    clearAllDrawings();
    return NextResponse.json({ success: true, message: 'All drawings have been cleared.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to clear drawings.' }, { status: 500 });
  }
}

