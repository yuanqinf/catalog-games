import { NextRequest, NextResponse } from 'next/server';
import { GameService, createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/api/rate-limit';
import { getClientIP } from '@/lib/api/get-client-ip';
import { validateBodySize, BODY_SIZE_LIMITS } from '@/lib/api/body-size-limit';

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
    // Validate request body size
    const bodySizeError = validateBodySize(request, BODY_SIZE_LIMITS.STANDARD);
    if (bodySizeError) return bodySizeError;

    // Rate limiting: 100 requests per minute per IP/user
    const identifier = getClientIP(request);
    const { success, resetAt } = rateLimit(identifier, {
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 100,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        },
      );
    }

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

    const clerkUser = await currentUser();
    const supabase = createClerkSupabaseClient(null);
    let newDislikeCount: number;

    if (clerkUser) {
      // For authenticated users: use upsert_user_dislike (updates both dislikes and games tables)
      const clerkUserId = clerkUser.id;

      const { data: result, error: upsertError } = await supabase.rpc(
        'upsert_user_dislike',
        {
          p_clerk_id: clerkUserId,
          p_game_id: game.id,
          p_increment: incrementBy,
        },
      );

      if (upsertError) {
        console.error('Failed to upsert user dislike via RPC:', upsertError);
        // Fallback to manual upsert
        const { data: existingDislike } = await supabase
          .from('dislikes')
          .select('count')
          .eq('clerk_id', clerkUserId)
          .eq('game_id', game.id)
          .maybeSingle();

        if (existingDislike) {
          await supabase
            .from('dislikes')
            .update({ count: existingDislike.count + incrementBy })
            .eq('clerk_id', clerkUserId)
            .eq('game_id', game.id);
        } else {
          await supabase.from('dislikes').insert({
            clerk_id: clerkUserId,
            game_id: game.id,
            count: incrementBy,
          });
        }

        // Manually increment game dislike count
        newDislikeCount = await gameService.incrementGameDislike(
          game.id,
          incrementBy,
        );
      } else if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to update dislike',
          },
          { status: 500 },
        );
      } else {
        // Get updated dislike count from games table
        const { data: gameData } = await supabase
          .from('games')
          .select('dislike_count')
          .eq('id', game.id)
          .single();
        newDislikeCount = gameData?.dislike_count || 0;
      }
    } else {
      // For anonymous users: only increment game dislike count
      newDislikeCount = await gameService.incrementGameDislike(
        game.id,
        incrementBy,
      );
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

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);
    const clerkUserId = clerkUser.id;

    // Use PostgreSQL function for atomic operation
    const { data: result, error: rpcError } = await supabase.rpc(
      'remove_user_dislike',
      {
        p_clerk_id: clerkUserId,
        p_game_id: parseInt(gameId),
      },
    );

    if (rpcError) {
      console.error('Failed to remove user dislike via RPC:', rpcError);

      // Fallback to manual deletion if RPC function doesn't exist
      const { data: existingDislike } = await supabase
        .from('dislikes')
        .select('count')
        .eq('clerk_id', clerkUserId)
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
        .eq('clerk_id', clerkUserId)
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
