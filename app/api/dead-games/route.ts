import { NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET() {
  try {
    const gameService = new GameService();
    const deadGames = await gameService.getDeadGames();

    return NextResponse.json({
      success: true,
      data: deadGames,
    });
  } catch (error) {
    console.error('Failed to fetch dead games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
