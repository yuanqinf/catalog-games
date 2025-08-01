import { NextRequest, NextResponse } from 'next/server';
import { findSteamPopularTags } from '@/lib/steam/get-steam-popular-tags';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    const result = await findSteamPopularTags(query.trim());

    if (!result.steamAppId) {
      return NextResponse.json(
        {
          message: 'No Steam tags found - game not found on Steam',
          query,
          result: {
            steamAppId: null,
            steamName: null,
            steam_popular_tags: null,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      query,
      result,
    });
  } catch (error) {
    console.error('Steam tags API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
