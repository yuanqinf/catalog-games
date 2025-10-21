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
    const clerkUserId = clerkUser.id;

    // Use RPC function for atomic upsert
    const { data: result, error: rpcError } = await supabase.rpc(
      'upsert_emoji_reaction',
      {
        p_clerk_id: clerkUserId,
        p_game_id: gameId,
        p_emoji_name: emojiName,
        p_increment: incrementBy,
      },
    );

    if (rpcError) {
      console.error('Error upserting emoji reaction:', rpcError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update reaction',
        },
        { status: 500 },
      );
    }

    if (!result || !result.success) {
      console.error('RPC function returned failure:', result);
      return NextResponse.json(
        {
          success: false,
          error: result?.error || 'Unknown error',
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
    const clerkUserId = clerkUser.id;

    // Delete all emoji reactions for this user and game
    const { error: deleteError } = await supabase
      .from('game_emoji_reactions')
      .delete()
      .eq('clerk_id', clerkUserId)
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
