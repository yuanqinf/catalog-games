import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const gameIdNum = parseInt(gameId);

    if (isNaN(gameIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 },
      );
    }

    // Get current user (optional - can be null for unauthenticated)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        {
          success: true,
          data: null, // No rating for unauthenticated users
        },
        {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        },
      );
    }

    const supabase = createClerkSupabaseClient(null);
    const clerkUserId = clerkUser.id;

    // Fetch user's rating
    const { data, error } = await supabase
      .from('game_ratings')
      .select('story, music, graphics, gameplay, longevity')
      .eq('game_id', gameIdNum)
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user rating:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user rating' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data || null,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch user rating:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
