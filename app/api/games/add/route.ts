import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';
import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';

export async function POST(request: NextRequest) {
  try {
    const { igdbData, bannerFile } = await request.json();

    if (!igdbData) {
      return NextResponse.json(
        { error: 'IGDB data is required' },
        { status: 400 },
      );
    }

    console.log(
      `🎮 Adding game to database: ${igdbData.name} (ID: ${igdbData.id})`,
    );

    const gameService = new GameService();

    // Fetch Steam data directly in the API route (server-side)
    console.log(`🔍 Fetching Steam data for: ${igdbData.name}`);
    let steamData = {};

    try {
      const tagsData = await SteamIntegrationService.getTagsOnly(igdbData.name);
      if (tagsData && tagsData.steam_popular_tags) {
        const appInfo = await SteamIntegrationService.findSteamApp(
          igdbData.name,
        );
        steamData = {
          steam_app_id: appInfo?.steamAppId || null,
          steam_popular_tags: tagsData.steam_popular_tags,
        };
        console.log(
          `🏷️ Steam data added: ${tagsData.steam_popular_tags?.length || 0} tags found`,
        );
      }
    } catch (steamError) {
      console.warn(
        'Failed to fetch Steam data, continuing without Steam tags:',
        steamError,
      );
    }

    // Prepare game data with Steam info
    const gameDataWithSteam = {
      ...igdbData,
      ...steamData,
    };

    // Add the game to the database (skip Steam fetch since we already did it)
    const result = await gameService.addOrUpdateGame(
      gameDataWithSteam,
      bannerFile,
      true,
    );

    console.log(`✅ Successfully added game: ${igdbData.name}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to add game:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
