import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/api/rate-limit';
import { getClientIP } from '@/lib/api/get-client-ip';
import { validateBodySize, BODY_SIZE_LIMITS } from '@/lib/api/body-size-limit';

// POST endpoint to add/increment emoji reaction
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
    const { gameId, emojiName, incrementBy = 1 } = body;

    if (!gameId || !emojiName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game ID and emoji name are required',
        },
        { status: 400 },
      );
    }

    // Validate emojiName type
    if (typeof emojiName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Emoji name must be a string',
        },
        { status: 400 },
      );
    }

    // Validate emojiName length
    if (emojiName.length === 0 || emojiName.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Emoji name must be between 1 and 50 characters',
        },
        { status: 400 },
      );
    }

    // Validate emojiName format (alphanumeric, hyphens, underscores only)
    const validEmojiNamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!validEmojiNamePattern.test(emojiName)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Emoji name can only contain letters, numbers, hyphens, and underscores',
        },
        { status: 400 },
      );
    }

    // Whitelist validation - only allow predefined emoji names
    const allowedEmojis = [
      'angry',
      'frown',
      'tired',
      'dizzy',
      'surprised',
      'grin-beam-sweat',
      'sad-tear',
      'rolling-eyes',
      'meh',
      'grimace',
      'flushed',
      'grin-tongue',
      'heart-crack',
      'bug',
      'poop',
    ];
    if (!allowedEmojis.includes(emojiName.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid emoji name',
        },
        { status: 400 },
      );
    }

    // Validate incrementBy parameter
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

    // Get the user's internal ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found in database',
        },
        { status: 404 },
      );
    }

    // Use PostgreSQL RPC function for atomic upsert to prevent racing conditions
    const { data: result, error: rpcError } = await supabase.rpc(
      'upsert_emoji_reaction',
      {
        p_user_id: userData.id,
        p_game_id: gameId,
        p_emoji_name: emojiName,
        p_increment: incrementBy,
      },
    );

    if (rpcError) {
      console.error('Failed to upsert emoji reaction via RPC:', rpcError);

      // Fallback to manual upsert if RPC function doesn't exist
      const { data: existingReaction } = await supabase
        .from('game_emoji_reactions')
        .select('id, count')
        .eq('game_id', gameId)
        .eq('user_id', userData.id)
        .eq('emoji_name', emojiName)
        .maybeSingle();

      if (existingReaction) {
        // Update existing reaction
        const { data: updatedData, error: updateError } = await supabase
          .from('game_emoji_reactions')
          .update({
            count: existingReaction.count + incrementBy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReaction.id)
          .select('count')
          .single();

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to update reaction',
            },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            gameId,
            emojiName,
            newCount: updatedData.count,
          },
        });
      } else {
        // Insert new reaction
        const { data: insertedData, error: insertError } = await supabase
          .from('game_emoji_reactions')
          .insert({
            game_id: gameId,
            user_id: userData.id,
            emoji_name: emojiName,
            count: incrementBy,
          })
          .select('count')
          .single();

        if (insertError) {
          console.error('Error inserting reaction:', insertError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to insert reaction',
            },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            gameId,
            emojiName,
            newCount: insertedData.count,
          },
        });
      }
    }

    // Check if the RPC function returned an error
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to upsert emoji reaction',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId,
        emojiName,
        newCount: result.count,
      },
    });
  } catch (error) {
    console.error('Failed to add emoji reaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch emoji reactions for a game
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

    // Get all emoji reactions for the game, aggregated by emoji_name
    const { data, error } = await supabase
      .from('game_emoji_reactions')
      .select('emoji_name, count')
      .eq('game_id', parseInt(gameId));

    if (error) {
      console.error('Error fetching emoji reactions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch emoji reactions',
        },
        { status: 500 },
      );
    }

    // Aggregate counts by emoji_name
    const aggregated: Record<string, number> = {};
    data.forEach((reaction) => {
      if (aggregated[reaction.emoji_name]) {
        aggregated[reaction.emoji_name] += reaction.count;
      } else {
        aggregated[reaction.emoji_name] = reaction.count;
      }
    });

    return NextResponse.json({
      success: true,
      data: aggregated,
    });
  } catch (error) {
    console.error('Failed to fetch emoji reactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// DELETE endpoint to remove all user's emoji reactions for a game
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

    // Get the user's internal ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 },
      );
    }

    // Use PostgreSQL function for atomic operation
    const { data: result, error: rpcError } = await supabase.rpc(
      'remove_user_emoji_reactions',
      {
        p_user_id: userData.id,
        p_game_id: parseInt(gameId),
      },
    );

    if (rpcError) {
      console.error('Failed to remove emoji reactions via RPC:', rpcError);

      // Fallback to manual deletion if RPC function doesn't exist
      const { error: deleteError } = await supabase
        .from('game_emoji_reactions')
        .delete()
        .eq('user_id', userData.id)
        .eq('game_id', parseInt(gameId));

      if (deleteError) {
        console.error('Failed to delete emoji reactions:', deleteError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to remove emoji reactions',
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          gameId: parseInt(gameId),
          removed_count: 0, // We don't know the exact count in fallback
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
      },
    });
  } catch (error) {
    console.error('Failed to remove emoji reactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
