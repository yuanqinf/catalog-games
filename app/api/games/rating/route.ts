import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { gameId, rating } = body;

    if (!gameId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Game ID and rating are required' },
        { status: 400 },
      );
    }

    const supabase = createClerkSupabaseClient(null);
    const clerkUserId = clerkUser.id;

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from('game_ratings')
      .select('id')
      .eq('game_id', parseInt(gameId))
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    if (existingRating) {
      // Delete old rating before inserting new one
      const { error: deleteError } = await supabase
        .from('game_ratings')
        .delete()
        .eq('id', existingRating.id);

      if (deleteError) {
        console.error('Error deleting old rating:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to update rating' },
          { status: 500 },
        );
      }
    }

    // Insert new rating
    const { data, error } = await supabase
      .from('game_ratings')
      .insert({
        game_id: parseInt(gameId),
        clerk_id: clerkUserId,
        story: rating.story,
        music: rating.music,
        graphics: rating.graphics,
        gameplay: rating.gameplay,
        longevity: rating.longevity,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving rating:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save rating' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/games/rating:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Game ID is required' },
        { status: 400 },
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);
    const clerkUserId = clerkUser.id;

    // Delete rating using clerk_id
    const { error: deleteError } = await supabase
      .from('game_ratings')
      .delete()
      .eq('clerk_id', clerkUserId)
      .eq('game_id', parseInt(gameId));

    if (deleteError) {
      console.error('Error removing rating:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove rating' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rating removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/games/rating:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
