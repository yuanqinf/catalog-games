import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

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

    const authResult = await getAuthenticatedUser();

    if ('error' in authResult) {
      // Return 0 count for unauthenticated users instead of error
      if (authResult.status === 401) {
        return NextResponse.json(
          {
            success: true,
            data: {
              userDislikeCount: 0,
            },
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status },
      );
    }

    const { internalUserId, supabase } = authResult;

    // Get the user's dislike count for this specific game
    const { data: dislikeData, error: dislikeError } = await supabase
      .from('dislikes')
      .select('count')
      .eq('user_id', internalUserId)
      .eq('game_id', gameId)
      .maybeSingle();

    if (dislikeError) {
      throw new Error(dislikeError.message || 'Failed to fetch dislike count');
    }

    return NextResponse.json({
      success: true,
      data: {
        userDislikeCount: dislikeData?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get user game dislike count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
