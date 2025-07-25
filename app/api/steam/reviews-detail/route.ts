import { NextRequest, NextResponse } from 'next/server';
import { findSteamReviews } from '@/lib/steam/get-steam-reviews';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('q');

  if (!gameName) {
    return NextResponse.json(
      { error: 'Game name parameter (q) is required' },
      { status: 400 },
    );
  }

  try {
    const result = await findSteamReviews(gameName);

    if (!result.steamAppId) {
      return NextResponse.json(
        {
          error: 'No Steam match found for this game',
          steamAppId: null,
          steamName: null,
          reviews: [],
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Steam reviews API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Steam reviews' },
      { status: 500 },
    );
  }
}
