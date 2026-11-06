import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getNextDrawingNumber } from '@/lib/validation';
import { PublicDrawing } from '@/types';

export async function POST(request: Request) {
  let uploadedStoragePath: string | null = null;

  try {
    await requireOrganizer(request);

    const body = await request.json();
    const { storagePath, studentName, drawingTitle, category } = body;

    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ error: 'Valid storagePath is required.' }, { status: 400 });
    }

    if (!storagePath.startsWith('submissions/')) {
      return NextResponse.json(
        { error: 'Invalid storagePath. Path must start with "submissions/".' },
        { status: 400 }
      );
    }

    uploadedStoragePath = storagePath;

    const trimmedStudentName = studentName?.trim() || 'Anonymous Student';
    const trimmedTitle = drawingTitle?.trim() || null;
    const trimmedCategory = category?.trim() || null;

    // Server-controlled unique drawing number generation
    const drawingNumber = await getNextDrawingNumber();

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('drawings').getPublicUrl(storagePath);

    // Insert metadata and storage path into Neon PostgreSQL
    const inserted = await query<PublicDrawing>(
      `INSERT INTO drawings (drawing_number, student_name, drawing_title, category, image_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, drawing_number, student_name, drawing_title, category, image_path, created_at`,
      [drawingNumber, trimmedStudentName, trimmedTitle, trimmedCategory, publicUrl]
    );

    if (!inserted || inserted.length === 0) {
      throw new Error('Database insertion returned empty result.');
    }

    return NextResponse.json({
      success: true,
      drawing: inserted[0],
    });
  } catch (error: any) {
    console.error('Error in /api/organizer/drawings/register:', error);

    // Cleanup orphaned storage object if database insertion fails
    if (uploadedStoragePath) {
      try {
        console.warn(`Cleaning up orphaned storage object at "${uploadedStoragePath}" due to DB error...`);
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.storage.from('drawings').remove([uploadedStoragePath]);
      } catch (cleanupErr) {
        console.error('Failed to remove orphaned storage object:', cleanupErr);
      }
    }

    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to register drawing.' }, { status });
  }
}

