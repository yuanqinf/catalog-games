import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { igdbGameId, initialDislikeCount = 1, gameName } = body;

    if (!igdbGameId) {
      return NextResponse.json(
        {
          success: false,
          error: 'IGDB Game ID is required',
        },
        { status: 400 },
      );
    }

    if (!gameName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game name is required',
        },
        { status: 400 },
      );
    }

    // Create authenticated Supabase client
    const supabase = createClerkSupabaseClient();

    // Get Supabase user UUID from Clerk ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
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

    const supabaseUserId = userData.id;

    // Check if user already has a pending dislike for this game
    const { data: existingEntry } = await supabase
      .from('pending_dislike_games')
      .select('id, initial_dislike_count')
      .eq('user_id', supabaseUserId)
      .eq('igdb_game_id', igdbGameId)
      .maybeSingle();

    if (existingEntry) {
      // Return error indicating already submitted
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_SUBMITTED',
          message: 'You have already submitted a dislike for this game',
          data: {
            id: existingEntry.id,
            igdbGameId,
            userId: supabaseUserId,
            initialDislikeCount: existingEntry.initial_dislike_count,
          },
        },
        { status: 409 }, // Conflict status code
      );
    } else {
      // Insert new entry
      const { data, error } = await supabase
        .from('pending_dislike_games')
        .insert({
          user_id: supabaseUserId,
          igdb_game_id: igdbGameId,
          game_name: gameName,
          initial_dislike_count: initialDislikeCount,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create pending dislike');
      }

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          igdbGameId,
          userId: supabaseUserId,
          initialDislikeCount: data.initial_dislike_count,
          isUpdate: false,
        },
      });
    }
  } catch (error) {
    console.error('Failed to add pending dislike game:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
