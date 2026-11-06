import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { addDrawings } from '@/lib/store';
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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedFiles: Array<{ filename: string; image_path: string; title: string }> = [];

    for (const file of files) {
      if (!file || typeof file === 'string' || !file.name) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename and keep unique
      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
      const uniqueFilename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      savedFiles.push({
        filename: uniqueFilename,
        image_path: `/uploads/${uniqueFilename}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
    }

    if (savedFiles.length === 0) {
      return NextResponse.json({ error: 'No valid image files found.' }, { status: 400 });
    }

    const added = addDrawings(savedFiles);

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

