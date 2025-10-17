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

    // Basic validation to prevent malicious requests
    // Allow users to click rapidly for satisfaction, but prevent negative/invalid values
    if (
      typeof incrementBy !== 'number' ||
      incrementBy < 1 ||
      !Number.isInteger(incrementBy)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid increment value. Must be a positive integer',
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
