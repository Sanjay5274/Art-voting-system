import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { deleteDrawing } from '@/lib/store';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { id } = await params;
    const ok = deleteDrawing(id);
    if (!ok) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Drawing deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete drawing.' }, { status: 500 });
  }
}

