import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

// GET endpoint to fetch all games the user has interacted with
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);
    const clerkUserId = clerkUser.id;

    // Get all unique game IDs from dislikes, emoji reactions, and ratings
    const [dislikesResult, emojisResult, ratingsResult] = await Promise.all([
      supabase
        .from('dislikes')
        .select('game_id, count')
        .eq('clerk_id', clerkUserId),
      supabase
        .from('game_emoji_reactions')
        .select('game_id, count')
        .eq('clerk_id', clerkUserId),
      supabase
        .from('game_ratings')
        .select('game_id')
        .eq('clerk_id', clerkUserId),
    ]);

    if (dislikesResult.error) {
      console.error('Error fetching dislikes:', dislikesResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dislikes' },
        { status: 500 },
      );
    }

    if (emojisResult.error) {
      console.error('Error fetching emoji reactions:', emojisResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch emoji reactions' },
        { status: 500 },
      );
    }

    if (ratingsResult.error) {
      console.error('Error fetching ratings:', ratingsResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ratings' },
        { status: 500 },
      );
    }

    // Collect all unique game IDs and their dislike counts
    const gameDislikeCounts = new Map<number, number>();
    const gameEmojiCounts = new Map<number, number>();
    const gameIds = new Set<number>();

    // Process dislikes
    dislikesResult.data.forEach((dislike) => {
      gameIds.add(dislike.game_id);
      gameDislikeCounts.set(dislike.game_id, dislike.count);
    });

    // Process emoji reactions
    emojisResult.data.forEach((emoji) => {
      gameIds.add(emoji.game_id);
      const currentCount = gameEmojiCounts.get(emoji.game_id) || 0;
      gameEmojiCounts.set(emoji.game_id, currentCount + emoji.count);
    });

    // Process ratings
    ratingsResult.data.forEach((rating) => {
      gameIds.add(rating.game_id);
    });

    // If no interactions, return empty array
    if (gameIds.size === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Fetch game data for all unique game IDs
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .in('id', Array.from(gameIds));

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch games' },
        { status: 500 },
      );
    }

    // Combine game data with user interaction counts
    const gamesWithCounts = games.map((game) => ({
      ...game,
      user_dislike_count: gameDislikeCounts.get(game.id) || 0,
      user_emoji_count: gameEmojiCounts.get(game.id) || 0,
    }));

    // Sort by total interaction (dislike + emoji)
    gamesWithCounts.sort((a, b) => {
      const aTotal = a.user_dislike_count + a.user_emoji_count;
      const bTotal = b.user_dislike_count + b.user_emoji_count;
      return bTotal - aTotal;
    });

    return NextResponse.json({
      success: true,
      data: gamesWithCounts,
    });
  } catch (error) {
    console.error('Failed to fetch interacted games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
