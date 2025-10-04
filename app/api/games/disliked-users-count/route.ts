import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game ID is required',
        },
        { status: 400 },
      );
    }

    const supabase = createClerkSupabaseClient(null);

    // Get count of distinct users who have disliked this game
    const { data: dislikedUsers, error } = await supabase
      .from('dislikes')
      .select('user_id')
      .eq('game_id', gameId);

    if (error) {
      throw new Error(error.message || 'Failed to fetch disliked users count');
    }

    // Count unique users (in case there are any duplicates, though there shouldn't be)
    const uniqueUserIds = new Set(dislikedUsers?.map((d) => d.user_id) || []);
    const userCount = uniqueUserIds.size;

    return NextResponse.json({
      success: true,
      data: {
        dislikedUsersCount: userCount,
      },
    });
  } catch (error) {
    console.error('Failed to get disliked users count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
