import { NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET() {
  try {
    const gameService = new GameService();
    const heroGames = await gameService.getHeroGames();

    return NextResponse.json({
      success: true,
      data: heroGames,
    });
  } catch (error) {
    console.error('Failed to fetch hero games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
