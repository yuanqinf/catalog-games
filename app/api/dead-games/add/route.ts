import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

interface AddDeadGameRequest {
  igdbGameData: {
    id: number;
    name: string;
    cover?: {
      url: string;
    };
    first_release_date?: number;
    summary?: string;
  };
  deadDate: string;
  deadStatus: 'Shutdown' | 'Abandoned';
  userReactionCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddDeadGameRequest = await request.json();
    const { igdbGameData, deadDate, deadStatus, userReactionCount = 0 } = body;

    if (!igdbGameData || !deadDate || !deadStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: igdbGameData, deadDate, deadStatus',
        },
        { status: 400 },
      );
    }

    const gameService = new GameService();

    // Step 1: Check if game exists in games table, if not add it
    let gameId: number;
    const existingGame = await gameService.checkGameExists(igdbGameData.id);

    if (existingGame) {
      gameId = existingGame.id;
      console.log(`Game already exists with ID: ${gameId}`);
    } else {
      // Add game to games table first
      console.log(`Adding new game to games table: ${igdbGameData.name}`);
      const gameResult = await gameService.addOrUpdateGame(igdbGameData);
      gameId = gameResult.data.id;
      console.log(`Added new game with ID: ${gameId}`);
    }

    // Step 2: Add to dead_games table
    const data = await gameService.addDeadGame(
      gameId,
      deadDate,
      deadStatus,
      userReactionCount,
    );

    return NextResponse.json({
      success: true,
      data: {
        deadGameId: data.id,
        gameId,
        deadDate,
        deadStatus,
        userReactionCount,
      },
    });
  } catch (error) {
    console.error('Failed to add dead game:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
