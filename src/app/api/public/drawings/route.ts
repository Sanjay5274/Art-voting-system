import { NextResponse } from 'next/server';
import { getAllDrawings } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    let drawings = getAllDrawings();

    if (search) {
      drawings = drawings.filter(
        (d) =>
          d.drawing_number.toLowerCase().includes(search) ||
          (d.drawing_title && d.drawing_title.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      drawings,
      totalCount: drawings.length,
    });
  } catch (error: any) {
    console.error('Error loading drawings:', error);
    return NextResponse.json({ drawings: [], totalCount: 0 }, { status: 200 });
  }
}
