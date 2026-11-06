import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { OrganizerDrawing } from '@/types';

export async function GET(request: Request) {
  try {
    await requireOrganizer(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';

    let sql = `
      SELECT 
        d.id,
        d.drawing_number,
        d.student_name,
        d.drawing_title,
        d.category,
        d.image_path,
        d.created_at,
        COUNT(vi.id)::int as vote_count
      FROM drawings d
      LEFT JOIN vote_items vi ON d.id = vi.drawing_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (d.drawing_number ILIKE $${params.length} OR d.student_name ILIKE $${params.length} OR d.drawing_title ILIKE $${params.length})`;
    }

    if (category && category !== 'ALL') {
      params.push(category);
      sql += ` AND d.category = $${params.length}`;
    }

    sql += ` GROUP BY d.id ORDER BY d.created_at DESC`;

    const drawings = await query<OrganizerDrawing>(sql, params);
    return NextResponse.json({ drawings });
  } catch (error: any) {
    console.error('Error fetching organizer drawings:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

