import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { addDrawings } from '@/lib/store';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Please select at least one image file.' }, { status: 400 });
    }

    const savedFiles: Array<{ filename: string; image_path: string; title: string }> = [];

    // Check if Supabase Storage is available
    let supabase = null;
    try {
      supabase = getSupabaseAdmin();
    } catch (e) {
      console.warn('Supabase not configured, using local filesystem:', e);
    }

    for (const file of files) {
      if (!file || typeof file === 'string' || !file.name) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
      const uniqueFilename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
      const title = file.name.replace(/\.[^/.]+$/, '');

      let imagePath = '';

      if (supabase) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('drawings')
            .upload(uniqueFilename, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('drawings')
              .getPublicUrl(uniqueFilename);
            imagePath = publicData.publicUrl;
          } else {
            console.error('Supabase upload error:', uploadError);
          }
        } catch (err) {
          console.error('Supabase upload exception:', err);
        }
      }

      // Local filesystem fallback
      if (!imagePath) {
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, uniqueFilename);
          fs.writeFileSync(filePath, buffer);
          imagePath = `/uploads/${uniqueFilename}`;
        } catch (err) {
          console.error('Local write error:', err);
        }
      }

      if (imagePath) {
        savedFiles.push({
          filename: uniqueFilename,
          image_path: imagePath,
          title,
        });
      }
    }

    if (savedFiles.length === 0) {
      return NextResponse.json({ error: 'No valid image files could be saved.' }, { status: 400 });
    }

    const added = await addDrawings(savedFiles);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${added.length} drawing${added.length > 1 ? 's' : ''}.`,
      count: added.length,
      drawings: added,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload images.' },
      { status: 500 }
    );
  }
}
