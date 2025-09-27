import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deadGameId, incrementBy = 1 } = body;

    if (!deadGameId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dead game ID is required',
        },
        { status: 400 },
      );
    }

    if (incrementBy < 1 || incrementBy > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Increment amount must be between 1 and 10',
        },
        { status: 400 },
      );
    }

    const gameService = new GameService();
    const newReactionCount = await gameService.incrementDeadGameReaction(
      deadGameId,
      incrementBy,
    );

    return NextResponse.json({
      success: true,
      data: {
        deadGameId,
        newReactionCount,
        incrementBy,
      },
    });
  } catch (error) {
    console.error('Failed to increment dead game reaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
