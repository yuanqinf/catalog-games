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

    const steamApp = await SteamIntegrationService.findSteamApp(query.trim());
    const exists = steamApp && steamApp.steamAppId ? true : false;

    return NextResponse.json({
      exists,
      steamAppId: exists ? steamApp.steamAppId : null,
      steamName: exists ? steamApp.steamName : null,
      query: query.trim(),
    });
  } catch (error) {
    console.error('Steam check game exists API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
