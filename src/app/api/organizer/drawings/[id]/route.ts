import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOrganizer(request);
    const { id } = await params;

    // Check if drawing exists
    const drawing = await query<{ id: string; image_path: string }>(
      'SELECT id, image_path FROM drawings WHERE id = $1',
      [id]
    );

    if (!drawing || drawing.length === 0) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    // Check if drawing has any votes
    const votesCheck = await query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM vote_items WHERE drawing_id = $1',
      [id]
    );

    const voteCount = parseInt(votesCheck[0]?.count || '0', 10);
    if (voteCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete drawing: It has already received votes from participants.' },
        { status: 400 }
      );
    }

    // Attempt to delete image from Supabase Storage
    try {
      const imagePath = drawing[0].image_path;
      const match = imagePath.match(/\/drawings\/(.+)$/);
      if (match && match[1]) {
        const filePath = decodeURIComponent(match[1]);
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.storage.from('drawings').remove([filePath]);
      }
    } catch (storageError) {
      console.warn('Storage delete warning:', storageError);
    }

    // Delete row from Neon PostgreSQL
    await query('DELETE FROM drawings WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Drawing deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting drawing:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

