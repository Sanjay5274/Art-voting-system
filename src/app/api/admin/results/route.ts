import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getLeaderboard, getAllDrawings } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const leaderboard = await getLeaderboard();
    const all = await getAllDrawings();
    const totalVotes = all.reduce((sum, d) => sum + (d.votes || 0), 0);

    // CSV Export
    if (format === 'csv') {
      let csv = 'Rank,Drawing Number,Title,Total Likes,Liked By (Directors),Created At\n';
      for (const item of leaderboard) {
        const title = `"${(item.drawing_title || '').replace(/"/g, '""')}"`;
        const likedBy = `"${(item.liked_by || '—').replace(/"/g, '""')}"`;
        csv += `${item.rank},${item.drawing_number},${title},${item.votes},${likedBy},${item.created_at}\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="scm-drawings-results-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      leaderboard,
      totalDrawings: all.length,
      totalVotes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch results.' }, { status: 500 });
  }
}
