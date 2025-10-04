import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
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

    // Get the user's dislike count for this specific game
    const { data: dislikeData, error: dislikeError } = await supabase
      .from('dislikes')
      .select('count')
      .eq('user_id', userData.id)
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
