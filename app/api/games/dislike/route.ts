import { NextRequest, NextResponse } from 'next/server';
import { GameService, createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { igdbId, incrementBy = 1 } = body;

    if (!igdbId) {
      return NextResponse.json(
        {
          success: false,
          error: 'IGDB ID is required',
        },
        { status: 400 },
      );
    }

    if (incrementBy < 1 || incrementBy > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Increment amount must be between 1 and 10',
        },
        { status: 400 },
      );
    }

    const gameService = new GameService();

    // Get the game by IGDB ID to get the internal ID
    const game = await gameService.getGameByIgdbId(igdbId);

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game not found',
        },
        { status: 404 },
      );
    }

    // Increment the dislike count
    const newDislikeCount = await gameService.incrementGameDislike(
      game.id,
      incrementBy,
    );

    // Record the user's dislike in the dislikes table
    const clerkUser = await currentUser();
    if (clerkUser) {
      const supabase = createClerkSupabaseClient(null);

      // Get the user's internal ID from the users table
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userData) {
        // Upsert the dislike record (insert or update if exists)
        const { data: existingDislike } = await supabase
          .from('dislikes')
          .select('id, count')
          .eq('user_id', userData.id)
          .eq('game_id', game.id)
          .maybeSingle();

        if (existingDislike) {
          // Update existing dislike record
          await supabase
            .from('dislikes')
            .update({ count: existingDislike.count + incrementBy })
            .eq('id', existingDislike.id);
        } else {
          // Insert new dislike record
          await supabase.from('dislikes').insert({
            user_id: userData.id,
            game_id: game.id,
            count: incrementBy,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: game.id,
        igdbId: game.igdb_id,
        newDislikeCount,
        incrementBy,
      },
    });
  } catch (error) {
    console.error('Failed to increment game dislike:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
