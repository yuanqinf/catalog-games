import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClerkSupabaseClient(null);

    // Get sum of all dislike counts from games table
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('dislike_count');

    if (gamesError) {
      throw new Error(gamesError.message || 'Failed to fetch game dislikes');
    }

    // Calculate total dislike count across all games
    const totalDislikes =
      games?.reduce((sum, game) => sum + (game.dislike_count || 0), 0) || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalDislikes,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      },
    );
  } catch (error) {
    console.error('Failed to get total dislike count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
