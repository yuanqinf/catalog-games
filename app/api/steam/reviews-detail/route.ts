import { NextRequest, NextResponse } from 'next/server';
import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';

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

    const result = await SteamIntegrationService.getDetailedReviews(
      query.trim(),
    );

    if (!result || !result.steamAppId) {
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

    return NextResponse.json(result);
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
