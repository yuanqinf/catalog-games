import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

// GET endpoint to fetch user's emoji reactions
export async function GET(request: NextRequest) {
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

    // Fetch all emoji reactions for this user, grouped by game_id
    const { data: emojiReactions, error } = await supabase
      .from('game_emoji_reactions')
      .select('game_id, count')
      .eq('clerk_id', clerkUserId);

    if (error) {
      console.error('Error fetching emoji reactions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch emoji reactions' },
        { status: 500 },
      );
    }

    // Aggregate counts by game_id
    const gameEmojiCounts: Record<number, number> = {};
    emojiReactions.forEach((reaction) => {
      if (!gameEmojiCounts[reaction.game_id]) {
        gameEmojiCounts[reaction.game_id] = 0;
      }
      gameEmojiCounts[reaction.game_id] += reaction.count;
    });

    return NextResponse.json({
      success: true,
      data: gameEmojiCounts,
    });
  } catch (error) {
    console.error('Failed to fetch user emoji reactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
