import { NextRequest, NextResponse } from 'next/server';
import { findSteamReviews } from '@/lib/steam/get-required-steam-reviews';

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

    const result = await findSteamReviews(query.trim());

    if (!result.steamAppId) {
      return NextResponse.json(
        {
          message: 'No Steam reviews found - game not found on Steam',
          query,
          result: {
            steamAppId: null,
            steam_all_review: null,
            steam_recent_review: null,
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
    console.error('Steam reviews API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
