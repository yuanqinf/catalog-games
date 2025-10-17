import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

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

    // Validate igdbGameId type and format
    if (
      typeof igdbGameId !== 'number' ||
      !Number.isInteger(igdbGameId) ||
      igdbGameId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'IGDB Game ID must be a positive integer',
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

    // Validate gameName type and length
    if (typeof gameName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Game name must be a string',
        },
        { status: 400 },
      );
    }

    if (gameName.trim().length === 0 || gameName.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game name must be between 1 and 200 characters',
        },
        { status: 400 },
      );
    }

    // Validate initialDislikeCount
    if (
      typeof initialDislikeCount !== 'number' ||
      !Number.isInteger(initialDislikeCount) ||
      initialDislikeCount < 1 ||
      initialDislikeCount > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Initial dislike count must be an integer between 1 and 100',
        },
        { status: 400 },
      );
    }

    // Create Supabase client (works for both authenticated and anonymous)
    const supabase = createClerkSupabaseClient();

    let supabaseUserId = null;

    // If user is signed in, get their Supabase user ID
    if (clerkUserId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userData) {
        supabaseUserId = userData.id;

        // Check if signed-in user already has a pending dislike for this game
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
        }
      }
    }

    // Insert new entry (user_id can be null for anonymous users)
    const { data, error } = await supabase
      .from('pending_dislike_games')
      .insert({
        user_id: supabaseUserId, // Will be null for anonymous users
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
