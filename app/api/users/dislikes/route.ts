import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

/**
 * Consolidated user dislikes endpoint
 *
 * Query parameters:
 * - gameId: Get user's dislike count for a specific game (returns count)
 * - total: Get user's total dislike count across all games (returns total)
 * - (none): Get all games user has disliked with details (returns array)
 *
 * Examples:
 * GET /api/users/dislikes?gameId=123 -> { userDislikeCount: 5 }
 * GET /api/users/dislikes?total=true -> { totalDislikes: 42 }
 * GET /api/users/dislikes -> [{ game details with user_dislike_count }]
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const total = searchParams.get('total');

    // Handle unauthenticated users for gameId query (return 0)
    if (gameId) {
      const authResult = await getAuthenticatedUser();

      if ('error' in authResult) {
        // Return 0 count for unauthenticated users instead of error
        if (authResult.status === 401) {
          return NextResponse.json({
            success: true,
            data: {
              userDislikeCount: 0,
            },
          });
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
    }

    // For total and list queries, require authentication
    const authResult = await getAuthenticatedUser();

    if ('error' in authResult) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status },
      );
    }

    const { internalUserId, supabase } = authResult;

    // Get user's total dislike count
    if (total === 'true') {
      const { data: dislikes, error: dislikesError } = await supabase
        .from('dislikes')
        .select('count')
        .eq('user_id', internalUserId);

      if (dislikesError) {
        throw new Error(dislikesError.message || 'Failed to fetch dislikes');
      }

      // Calculate total dislike count
      const totalDislikes =
        dislikes?.reduce((sum, dislike) => sum + (dislike.count || 0), 0) || 0;

      return NextResponse.json({
        success: true,
        data: {
          totalDislikes,
        },
      });
    }

    // Get all disliked games for this user with game details (default)
    const { data: dislikedGames, error: dislikesError } = await supabase
      .from('dislikes')
      .select(
        `
        count,
        games:game_id (
          id,
          igdb_id,
          name,
          slug,
          cover_url,
          banner_url,
          developers,
          publishers,
          genres,
          first_release_date,
          igdb_user_rating,
          dislike_count,
          steam_app_id,
          steam_popular_tags
        )
      `,
      )
      .eq('user_id', internalUserId)
      .order('count', { ascending: false });

    if (dislikesError) {
      throw new Error(
        dislikesError.message || 'Failed to fetch disliked games',
      );
    }

    // Transform the data to include user's dislike count
    const gamesWithDislikeCount =
      dislikedGames?.map((item) => ({
        ...item.games,
        user_dislike_count: item.count,
      })) || [];

    return NextResponse.json({
      success: true,
      data: gamesWithDislikeCount,
    });
  } catch (error) {
    console.error('Failed to fetch user dislikes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
