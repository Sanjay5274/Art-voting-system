import { NextResponse } from 'next/server';
import { voteDrawing } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drawing_id, action = 'like' } = body;

    if (!drawing_id || typeof drawing_id !== 'string') {
      return NextResponse.json({ error: 'Drawing ID is required.' }, { status: 400 });
    }

    const voteAction = action === 'unlike' ? 'unlike' : 'like';
    const result = voteDrawing(drawing_id, voteAction);
    if (!result.success || !result.drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      action: voteAction,
      message:
        voteAction === 'like'
          ? `Liked ${result.drawing.drawing_number}!`
          : `Removed like from ${result.drawing.drawing_number}`,
      drawing_number: result.drawing.drawing_number,
      totalVotes: result.totalVotes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit vote.' },
      { status: 500 }
    );
  }
}
