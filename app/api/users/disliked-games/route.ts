import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

export async function GET() {
  try {
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

    // Get all disliked games for this user with game details
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
    console.error('Failed to get user disliked games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
