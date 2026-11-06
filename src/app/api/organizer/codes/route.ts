import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/organizer-auth';
import { query } from '@/lib/neon';
import { generateRandomVotingCode, hashVotingCode } from '@/lib/voting-codes';

export async function GET(request: Request) {
  try {
    await requireOrganizer(request);

    const tokens = await query<any>(`
      SELECT 
        id, 
        used_at, 
        created_at,
        (used_at IS NOT NULL) as is_used
      FROM voting_tokens
      ORDER BY created_at DESC
      LIMIT 500
    `);

    const summary = {
      total: tokens.length,
      used: tokens.filter((t: any) => t.is_used).length,
      unused: tokens.filter((t: any) => !t.is_used).length,
    };

    return NextResponse.json({
      summary,
      tokens,
    });
  } catch (error: any) {
    console.error('Error fetching voting tokens:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireOrganizer(request);

    const body = await request.json();
    const count = Math.min(Math.max(parseInt(body.count || '10', 10), 1), 200);

    const generatedPairs: Array<{ code: string; hash: string }> = [];
    const generatedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = generateRandomVotingCode();
      const hash = hashVotingCode(code);
      generatedPairs.push({ code, hash });
      generatedCodes.push(code);
    }

    // Insert hashes into voting_tokens table
    for (const pair of generatedPairs) {
      await query(
        `INSERT INTO voting_tokens (token_hash, created_at)
         VALUES ($1, NOW())
         ON CONFLICT (token_hash) DO NOTHING`,
        [pair.hash]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCodes.length} single-use voting codes.`,
      count: generatedCodes.length,
      codes: generatedCodes,
    });
  } catch (error: any) {
    console.error('Error generating voting tokens:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

