import { NextResponse } from 'next/server';
import { query } from '@/lib/neon';
import { CompetitionSettings, LeaderboardItem } from '@/types';

export async function GET() {
  try {
    // 1. Check if results are published
    const settingsRows = await query<CompetitionSettings>(
      'SELECT competition_name, results_published, voting_open FROM competition_settings LIMIT 1'
    );
    const settings = settingsRows[0];

    if (!settings?.results_published) {
      return NextResponse.json(
        {
          published: false,
          message: 'Competition results have not been published yet. Please check back later.',
        },
        { status: 200 }
      );
    }

    // 2. Fetch drawings with total votes
    const rows = await query<any>(`
      SELECT 
        d.id,
        d.drawing_number,
        d.drawing_title,
        d.category,
        d.image_path,
        COUNT(vi.id)::int as vote_count
      FROM drawings d
      LEFT JOIN vote_items vi ON d.id = vi.drawing_id
      GROUP BY d.id
      ORDER BY vote_count DESC, d.drawing_number ASC
    `);

    // 3. Compute tied rankings (Standard 1224 competition ranking)
    const rankedResults: LeaderboardItem[] = [];
    let currentRank = 1;

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      if (i > 0 && item.vote_count < rows[i - 1].vote_count) {
        currentRank = i + 1;
      }

      rankedResults.push({
        id: item.id,
        drawing_number: item.drawing_number,
        drawing_title: item.drawing_title,
        category: item.category,
        image_path: item.image_path,
        vote_count: item.vote_count,
        rank: currentRank,
      });
    }

    return NextResponse.json({
      published: true,
      competitionName: settings.competition_name,
      results: rankedResults,
    });
  } catch (error: any) {
    console.error('Error fetching public results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

