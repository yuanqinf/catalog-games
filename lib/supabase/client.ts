import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import type { GameDbData, IgdbGameData } from '@/types';
import { transformIgdbData } from '@/utils/igdb-transform';
import { uploadBanner } from '@/utils/banner-upload';
import {
  fetchSteamReviewSummary,
  fetchSteamTags,
} from '@/utils/steam-integration';

type ClerkSession = ReturnType<typeof useSession>['session'];

export function createClerkSupabaseClient(session?: ClerkSession | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // Only add auth header if session exists
          if (session) {
            const clerkToken = await session.getToken({ template: 'supabase' });
            const headers = new Headers(options?.headers);
            headers.set('Authorization', `Bearer ${clerkToken}`);
            return fetch(url, { ...options, headers });
          }
          // Use default fetch for unauthenticated requests
          return fetch(url, options);
        },
      },
    },
  );
}

export class GameService {
  private supabase;

  constructor(session?: ClerkSession | null) {
    this.supabase = createClerkSupabaseClient(session);
  }

  /**
   * Check if a game exists by IGDB ID
   */
  async checkGameExists(igdbId: number) {
    const { data, error } = await this.supabase
      .from('games')
      .select('id')
      .eq('igdb_id', igdbId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to check if game exists');
    }

    return data;
  }

  /**
   * Add or update a game from IGDB data with optional banner and Steam reviews
   */
  async addOrUpdateGame(igdbData: IgdbGameData, bannerFile?: File) {
    const dbData = transformIgdbData(igdbData);

    // Upload banner if provided
    if (bannerFile) {
      try {
        const bannerUrl = await uploadBanner(this.supabase, {
          file: bannerFile,
          igdbId: igdbData.id,
          slug: igdbData.slug,
        });
        dbData.banner_url = bannerUrl;
        console.log(`🖼️ Banner uploaded and attached to game data`);
      } catch (error) {
        console.warn(
          'Banner upload failed, but continuing with game data save:',
          error,
        );
        // Continue with game data save even if banner upload fails
        throw error; // Re-throw to let the caller handle it
      }
    }

    // Fetch Steam data via API route
    const steamReviewSummary = await fetchSteamReviewSummary(igdbData.name);
    const steamTags = await fetchSteamTags(igdbData.name);
    Object.assign(dbData, steamReviewSummary, steamTags);

    // Check if the game already exists
    const existingGame = await this.checkGameExists(igdbData.id);

    let result;
    if (existingGame) {
      // Update existing game
      console.log(`🔄 Updating existing game: ${igdbData.name}`);
      result = await this.supabase
        .from('games')
        .update(dbData)
        .eq('igdb_id', igdbData.id);
    } else {
      // Insert new game
      console.log(`➕ Creating new game: ${igdbData.name}`);
      result = await this.supabase.from('games').insert([dbData]);
    }

    if (result.error) {
      throw new Error(result.error.message || 'Failed to save game data');
    }

    return result;
  }

  /**
   * Get all games
   */
  async getAllGames() {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch games');
    }

    return data;
  }

  /**
   * Get a game by IGDB ID
   */
  async getGameByIgdbId(igdbId: number) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('igdb_id', igdbId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to fetch game');
    }

    return data;
  }
}
