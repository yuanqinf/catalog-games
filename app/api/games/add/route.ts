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

    // Fetch complete Steam data directly in the API route (server-side)
    console.log(`🔍 Fetching complete Steam data for: ${igdbData.name}`);
    let steamData = {};

    try {
      // First find the Steam app to get the app ID
      const appInfo = await SteamIntegrationService.findSteamApp(igdbData.name);
      if (appInfo) {
        // Get comprehensive Steam data including reviews and tags
        const completeResult =
          await SteamIntegrationService.getCompleteSteamDataByAppId(
            appInfo.steamAppId,
          );
        if (completeResult.success) {
          steamData = {
            steam_app_id: appInfo.steamAppId,
            steam_popular_tags: completeResult.data.steam_popular_tags || null,
            steam_all_review: completeResult.data.steam_all_review || null,
            steam_recent_review:
              completeResult.data.steam_recent_review || null,
          };
          console.log(
            `🏷️ Complete Steam data added: ${completeResult.data.steam_popular_tags?.length || 0} tags, reviews: ${completeResult.data.steam_all_review ? 'Yes' : 'No'}`,
          );
        } else {
          // Fallback: just get app ID and tags
          const tagsData = await SteamIntegrationService.getTagsOnly(
            igdbData.name,
          );
          steamData = {
            steam_app_id: appInfo.steamAppId,
            steam_popular_tags: tagsData?.steam_popular_tags || null,
          };
        }
      }
    } catch (steamError) {
      console.warn(
        'Failed to fetch Steam data, continuing without Steam integration:',
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
