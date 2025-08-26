import { NextRequest, NextResponse } from 'next/server';
import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get('gameName');

    if (!gameName || !gameName.trim()) {
      return NextResponse.json(
        { error: 'Game name parameter is required' },
        { status: 400 },
      );
    }

    console.log(`🏷️ Fetching Steam tags for: ${gameName}`);

    const tagsData = await SteamIntegrationService.getTagsOnly(gameName.trim());
    const appInfo = await SteamIntegrationService.findSteamApp(gameName.trim());

    const result = {
      steam_app_id: appInfo?.steamAppId || null,
      steam_popular_tags: tagsData?.steam_popular_tags || null,
    };

    console.log(`🏷️ Steam tags result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Steam tags fetch API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
