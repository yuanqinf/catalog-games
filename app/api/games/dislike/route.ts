import { NextRequest, NextResponse } from 'next/server';
import { GameService, createClerkSupabaseClient } from '@/lib/supabase/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

// GET endpoint to fetch current dislike count for a game
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

    // Fetch the game's dislike count directly from the database
    const { data: game, error } = await supabase
      .from('games')
      .select('id, dislike_count')
      .eq('id', parseInt(gameId))
      .maybeSingle();

    if (error) {
      console.error('Error fetching game:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch game',
        },
        { status: 500 },
      );
    }

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: game.id,
        dislikeCount: game.dislike_count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dislike count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dislike count',
      },
      { status: 500 },
    );
  }
}

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

    // Validate incrementBy to prevent malicious requests
    // Allow users to accumulate clicks via throttling, but prevent extreme values
    if (
      typeof incrementBy !== 'number' ||
      incrementBy < 1 ||
      incrementBy > 100 ||
      !Number.isInteger(incrementBy)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid increment value. Must be an integer between 1 and 100',
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
    const authResult = await getAuthenticatedUser();
    if (!('error' in authResult)) {
      const { internalUserId, supabase } = authResult;

      if (internalUserId) {
        // Use PostgreSQL's INSERT ... ON CONFLICT for atomic upsert
        const { error: upsertError } = await supabase.rpc(
          'upsert_user_dislike',
          {
            p_user_id: internalUserId,
            p_game_id: game.id,
            p_increment: incrementBy,
          },
        );

        if (upsertError) {
          console.error('Failed to upsert user dislike:', upsertError);
          // Fallback to manual upsert if RPC function doesn't exist
          const { data: existingDislike } = await supabase
            .from('dislikes')
            .select('count')
            .eq('user_id', internalUserId)
            .eq('game_id', game.id)
            .maybeSingle();

          if (existingDislike) {
            await supabase
              .from('dislikes')
              .update({ count: existingDislike.count + incrementBy })
              .eq('user_id', internalUserId)
              .eq('game_id', game.id);
          } else {
            await supabase.from('dislikes').insert({
              user_id: internalUserId,
              game_id: game.id,
              count: incrementBy,
            });
          }
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

// DELETE endpoint to remove all user's dislikes for a game
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status },
      );
    }

    const { internalUserId, supabase } = authResult;

    // Use PostgreSQL function for atomic operation
    const { data: result, error: rpcError } = await supabase.rpc(
      'remove_user_dislike',
      {
        p_user_id: internalUserId,
        p_game_id: parseInt(gameId),
      },
    );

    if (rpcError) {
      console.error('Failed to remove user dislike via RPC:', rpcError);

      // Fallback to manual deletion if RPC function doesn't exist
      const { data: existingDislike } = await supabase
        .from('dislikes')
        .select('count')
        .eq('user_id', internalUserId)
        .eq('game_id', parseInt(gameId))
        .maybeSingle();

      if (!existingDislike || existingDislike.count === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No dislikes found for this game',
          },
          { status: 404 },
        );
      }

      const userDislikeCount = existingDislike.count;

      // Delete the user's dislike record
      const { error: deleteError } = await supabase
        .from('dislikes')
        .delete()
        .eq('user_id', internalUserId)
        .eq('game_id', parseInt(gameId));

      if (deleteError) {
        console.error('Failed to delete user dislike:', deleteError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to remove dislikes',
          },
          { status: 500 },
        );
      }

      // Decrement the game's total dislike count
      const gameService = new GameService();
      const newDislikeCount = await gameService.incrementGameDislike(
        parseInt(gameId),
        -userDislikeCount,
      );

      return NextResponse.json({
        success: true,
        data: {
          gameId: parseInt(gameId),
          removedCount: userDislikeCount,
          newDislikeCount,
        },
      });
    }

    // Check if the RPC function returned an error
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: parseInt(gameId),
        removedCount: result.removed_count,
        newDislikeCount: result.new_dislike_count,
      },
    });
  } catch (error) {
    console.error('Failed to remove game dislike:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
