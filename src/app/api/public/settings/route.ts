import { NextResponse } from 'next/server';
import { query } from '@/lib/neon';
import { CompetitionSettings } from '@/types';

export async function GET() {
  try {
    const rows = await query<CompetitionSettings>(
      'SELECT id, competition_name, max_selections, voting_open, results_published, created_at, updated_at FROM competition_settings LIMIT 1'
    );

    const settings = rows[0] || {
      id: 1,
      competition_name: 'ArtVista Annual Drawing Competition',
      max_selections: 3,
      voting_open: true,
      results_published: false,
    };

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

