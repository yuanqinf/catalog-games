import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } },
) {
  try {
    const gameId = parseInt(params.gameId);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const gameService = new GameService();
    const rankingData = await gameService.getGameRanking(gameId);

    return NextResponse.json(rankingData);
  } catch (error) {
    console.error('Failed to fetch game ranking:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Game not found')) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch game ranking' },
      { status: 500 },
    );
  }
}
