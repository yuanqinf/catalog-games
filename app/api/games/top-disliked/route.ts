import { NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET() {
  try {
    const gameService = new GameService();
    const topDislikedGames = await gameService.getTopDislikedGames(5);

    return NextResponse.json({
      success: true,
      data: topDislikedGames,
    });
  } catch (error) {
    console.error('Failed to fetch top disliked games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
