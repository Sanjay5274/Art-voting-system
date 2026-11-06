import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { LeaderboardItem } from '@/types';

export async function GET(request: Request) {
  try {
    await requireOrganizer(request);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const category = searchParams.get('category');

    let sql = `
      SELECT 
        d.id,
        d.drawing_number,
        d.student_name,
        d.drawing_title,
        d.category,
        d.image_path,
        COUNT(vi.id)::int as vote_count
      FROM drawings d
      LEFT JOIN vote_items vi ON d.id = vi.drawing_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      params.push(category);
      sql += ` AND d.category = $${params.length}`;
    }

    sql += ` GROUP BY d.id ORDER BY vote_count DESC, d.drawing_number ASC`;

    const rawResults = await query<any>(sql, params);

    // Compute tied rankings (Standard 1224 competition ranking)
    const rankedResults: LeaderboardItem[] = [];
    let currentRank = 1;

    for (let i = 0; i < rawResults.length; i++) {
      const item = rawResults[i];
      if (i > 0 && item.vote_count < rawResults[i - 1].vote_count) {
        currentRank = i + 1;
      }

      rankedResults.push({
        id: item.id,
        drawing_number: item.drawing_number,
        student_name: item.student_name,
        drawing_title: item.drawing_title,
        category: item.category,
        image_path: item.image_path,
        vote_count: item.vote_count,
        rank: currentRank,
      });
    }

    // CSV Export option
    if (format === 'csv') {
      const headers = ['Rank', 'Drawing ID', 'Student Name', 'Drawing Title', 'Category', 'Total Votes'];
      const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const rows = rankedResults.map((r) => [
        r.rank,
        escapeCsv(r.drawing_number),
        escapeCsv(r.student_name),
        escapeCsv(r.drawing_title || 'N/A'),
        escapeCsv(r.category || 'General'),
        r.vote_count,
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\r\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="artvista-votes-leaderboard-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      results: rankedResults,
      count: rankedResults.length,
    });
  } catch (error: any) {
    console.error('Error fetching organizer results:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

