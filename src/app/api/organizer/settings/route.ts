import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';

export async function GET(request: Request) {
  try {
    await requireOrganizer(request);

    const rows = await query(
      'SELECT id, competition_name, max_selections, voting_open, results_published, created_at, updated_at FROM competition_settings LIMIT 1'
    );

    return NextResponse.json({ settings: rows[0] });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    await requireOrganizer(request);

    const body = await request.json();
    const { competition_name, max_selections, voting_open, results_published } = body;

    const rows = await query(
      `UPDATE competition_settings 
       SET 
         competition_name = COALESCE($1, competition_name),
         max_selections = COALESCE($2, max_selections),
         voting_open = COALESCE($3, voting_open),
         results_published = COALESCE($4, results_published),
         updated_at = NOW()
       WHERE id = (SELECT id FROM competition_settings LIMIT 1)
       RETURNING *`,
      [
        competition_name?.trim() || null,
        typeof max_selections === 'number' && max_selections > 0 ? max_selections : null,
        typeof voting_open === 'boolean' ? voting_open : null,
        typeof results_published === 'boolean' ? results_published : null,
      ]
    );

    return NextResponse.json({
      success: true,
      settings: rows[0],
      message: 'Competition settings updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

