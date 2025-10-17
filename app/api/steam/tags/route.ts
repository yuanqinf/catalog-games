import { NextRequest, NextResponse } from 'next/server';
import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';
import { cacheHeaders } from '@/lib/api/cache-headers';

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

    const result = await SteamIntegrationService.getCompleteSteamDataByName(
      query.trim(),
    );

    if (!result.success || !result.data.steamAppId) {
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

    return NextResponse.json(
      {
        success: true,
        query,
        result: {
          steamAppId: result.data.steamAppId,
          steamName: result.data.steamName,
          steam_popular_tags: result.data.steam_popular_tags,
        },
      },
      {
        headers: cacheHeaders.static(), // Steam tags rarely change
      },
    );
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
