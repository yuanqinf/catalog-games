import { NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const gameService = new GameService();
    const topDislikedGames = await gameService.getTopDislikedGames(limit);

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
