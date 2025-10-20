import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';
import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';
import { getAuthenticatedAdmin } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/api/rate-limit';
import { getClientIP } from '@/lib/api/get-client-ip';
import { validateBodySize, BODY_SIZE_LIMITS } from '@/lib/api/body-size-limit';

export async function POST(request: NextRequest) {
  try {
    // Validate request body size (admin routes may include images)
    const bodySizeError = validateBodySize(
      request,
      BODY_SIZE_LIMITS.ADMIN_WITH_IMAGES,
    );
    if (bodySizeError) return bodySizeError;

    // Rate limiting: 10 requests per minute (strict for admin operations)
    const identifier = getClientIP(request);
    const { success, resetAt } = rateLimit(identifier, {
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 10,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Check if user is authenticated and is an admin
    const adminResult = await getAuthenticatedAdmin();
    if ('error' in adminResult) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: adminResult.status },
      );
    }

    const { igdbData, bannerFile } = await request.json();

    if (!igdbData) {
      return NextResponse.json(
        { error: 'IGDB data is required' },
        { status: 400 },
      );
    }

    const gameService = new GameService();

    // Fetch complete Steam data directly in the API route (server-side)
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
