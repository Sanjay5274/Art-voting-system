import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { getSupabaseAdmin, ensureDrawingsBucket } from '@/lib/supabase-admin';
import { validateImageMetadata } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    await requireOrganizer(request);
    await ensureDrawingsBucket();

    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'Missing required file attributes (fileName, fileType, fileSize).' },
        { status: 400 }
      );
    }

    // 1. Validate file format and size
    const validation = validateImageMetadata(fileName, fileType, fileSize);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Generate a secure, server-controlled unique storage path
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `submissions/${crypto.randomUUID()}.${ext}`;

    // 3. Create signed upload URL via Supabase Storage Admin API
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error: storageError } = await supabaseAdmin.storage
      .from('drawings')
      .createSignedUploadUrl(storagePath);

    if (storageError || !data) {
      console.error('Error creating signed upload URL:', storageError);
      return NextResponse.json(
        { error: storageError?.message || 'Failed to generate signed upload URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      path: storagePath,
      token: data.token,
    });
  } catch (error: any) {
    console.error('Error in /api/organizer/drawings/presign:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

