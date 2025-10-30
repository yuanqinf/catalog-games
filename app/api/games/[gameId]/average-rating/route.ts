import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    const supabase = createServerSupabaseClient();

    // Fetch all ratings for this game
    const { data, error } = await supabase
      .from('game_ratings')
      .select('story, music, graphics, gameplay, longevity')
      .eq('game_id', gameIdNum);

    if (error) {
      console.error('Error fetching game ratings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch game ratings' },
        { status: 500 },
      );
    }

    // Calculate averages
    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            story: 0,
            music: 0,
            graphics: 0,
            gameplay: 0,
            longevity: 0,
          },
        },
        {
          headers: {
            // No cache for rating data - always return fresh data
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    }

    const totalRatings = data.length;
    const averages = {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    };

    // Sum up all ratings for each category
    data.forEach((rating) => {
      averages.story += rating.story || 0;
      averages.music += rating.music || 0;
      averages.graphics += rating.graphics || 0;
      averages.gameplay += rating.gameplay || 0;
      averages.longevity += rating.longevity || 0;
    });

    // Calculate averages
    Object.keys(averages).forEach((key) => {
      averages[key as keyof typeof averages] = Number(
        (averages[key as keyof typeof averages] / totalRatings).toFixed(1),
      );
    });

    return NextResponse.json(
      {
        success: true,
        data: averages,
      },
      {
        headers: {
          // No cache for rating data - always return fresh data
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch average game ratings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
