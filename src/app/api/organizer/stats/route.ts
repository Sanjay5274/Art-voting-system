import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { OrganizerStats, CompetitionSettings } from '@/types';

export async function GET(request: Request) {
  try {
    await requireOrganizer(request);

    // 1. Total drawings
    const drawingsCountRes = await query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM drawings'
    );
    const totalDrawings = parseInt(drawingsCountRes[0]?.count || '0', 10);

    // 2. Voting codes stats
    const tokensRes = await query<{ total_codes: string; used_codes: string }>(`
      SELECT 
        COUNT(*)::text as total_codes,
        COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END)::text as used_codes
      FROM voting_tokens
    `);
    const totalCodesIssued = parseInt(tokensRes[0]?.total_codes || '0', 10);
    const totalVotesSubmitted = parseInt(tokensRes[0]?.used_codes || '0', 10);
    const unusedCodes = Math.max(0, totalCodesIssued - totalVotesSubmitted);
    const votingCompletionPercentage =
      totalCodesIssued > 0
        ? Math.round((totalVotesSubmitted / totalCodesIssued) * 100)
        : 0;

    // 3. Settings
    const settingsRes = await query<CompetitionSettings>(
      'SELECT competition_name, max_selections, voting_open, results_published FROM competition_settings LIMIT 1'
    );
    const settings = settingsRes[0] || {
      competition_name: 'ArtVista Annual Drawing Competition',
      max_selections: 3,
      voting_open: true,
      results_published: false,
    };

    // 4. Top 3 drawings
    const topRows = await query<any>(`
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
      GROUP BY d.id
      ORDER BY vote_count DESC, d.drawing_number ASC
      LIMIT 3
    `);

    let currentRank = 1;
    const topDrawings = topRows.map((item: any, i: number) => {
      if (i > 0 && item.vote_count < topRows[i - 1].vote_count) {
        currentRank = i + 1;
      }
      return {
        id: item.id,
        drawing_number: item.drawing_number,
        student_name: item.student_name,
        drawing_title: item.drawing_title,
        category: item.category,
        image_path: item.image_path,
        vote_count: item.vote_count,
        rank: currentRank,
      };
    });

    const stats: OrganizerStats = {
      totalDrawings,
      totalCodesIssued,
      totalVotesSubmitted,
      unusedCodes,
      votingCompletionPercentage,
      votingOpen: settings.voting_open,
      resultsPublished: settings.results_published,
      maxSelections: settings.max_selections,
      topDrawings,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching organizer stats:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

