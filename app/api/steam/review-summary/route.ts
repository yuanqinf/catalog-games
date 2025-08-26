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

    const result = await SteamIntegrationService.getCompleteSteamDataByName(
      query.trim(),
    );

    if (!result.success || !result.data.steamAppId) {
      return NextResponse.json(
        {
          message: 'No Steam reviews found - game not found on Steam',
          query,
          result: {
            steamAppId: null,
            steamName: null,
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
      result: {
        steamAppId: result.data.steamAppId,
        steamName: result.data.steamName,
        steam_all_review: result.data.steam_all_review,
        steam_recent_review: result.data.steam_recent_review,
      },
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
