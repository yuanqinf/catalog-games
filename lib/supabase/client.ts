import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import type { IgdbGameData, GameRating } from '@/types';
import { transformIgdbData } from '@/utils/igdb-transform';
import { uploadBanner } from '@/utils/banner-upload';
import { fetchSteamTags } from '@/utils/steam-integration';

type ClerkSession = ReturnType<typeof useSession>['session'];

// Singleton pattern for Supabase client
let supabaseInstance: SupabaseClient | null = null;

export function createClerkSupabaseClient(session?: ClerkSession | null) {
  // For server-side usage without session, create a new instance
  if (typeof window === 'undefined' || session !== undefined) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            // Only add auth header if session exists
            if (session) {
              const clerkToken = await session.getToken({
                template: 'supabase',
              });
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

  // For client-side, use singleton pattern
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            // Use default fetch for unauthenticated requests
            return fetch(url, options);
          },
        },
      },
    );
  }

  return supabaseInstance;
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
   * Add or update a game from IGDB data with optional banner and Steam data
   */
  async addOrUpdateGame(
    igdbData: IgdbGameData,
    bannerFile?: File,
    skipSteamFetch: boolean = false,
  ) {
    const dbData = await transformIgdbData(igdbData);

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
        throw error;
      }
    }

    // Fetch Steam tags only if not skipped (reviews will be fetched client-side)
    if (!skipSteamFetch) {
      const steamTags = await fetchSteamTags(igdbData.name);
      Object.assign(dbData, steamTags);
    }

    // Check if the game already exists
    const existingGame = await this.checkGameExists(igdbData.id);

    let result;
    let gameId: number;

    if (existingGame) {
      // Update existing game
      console.log(`🔄 Updating existing game: ${igdbData.name}`);
      result = await this.supabase
        .from('games')
        .update(dbData)
        .eq('igdb_id', igdbData.id)
        .select('id')
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update game data');
      }

      gameId = result.data.id;
    } else {
      // Insert new game
      console.log(`➕ Creating new game: ${igdbData.name}`);
      result = await this.supabase
        .from('games')
        .insert([dbData])
        .select('id')
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create game data');
      }

      gameId = result.data.id;
    }

    // Fetch and add OpenCritic reviews
    try {
      console.log(`📝 Fetching OpenCritic reviews for: ${igdbData.name}`);
      await this.addOpenCriticReviews(gameId, igdbData.name);
    } catch (reviewError) {
      console.warn(
        'Failed to fetch/save OpenCritic reviews, but game data was saved:',
        reviewError,
      );
      // Don't throw here - we want game data to be saved even if reviews fail
    }

    return result;
  }

  /**
   * Get games for explore page with pagination and sorting
   * @param offset - Number of games to skip
   * @param limit - Number of games to fetch (default: 15)
   * @param sortBy - Sort field: 'latest' | 'rating' | 'trend' (default: 'trend')
   * @param sortOrder - Sort order: 'asc' | 'desc' (default: 'desc')
   */
  async getGamesForExplorePage(
    offset: number = 0,
    limit: number = 15,
    sortBy: 'latest' | 'rating' | 'trend' = 'trend',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    let query = this.supabase.from('games').select('*');

    // Apply sorting based on sortBy option
    switch (sortBy) {
      case 'latest':
        // Sort by release date, handling nulls (put them at end)
        query = query.order('first_release_date', {
          ascending: sortOrder === 'asc',
          nullsFirst: false,
        });
        break;
      case 'rating':
        // TODO: Implement rating-based sorting
        // This could be total_rating, user ratings average, or steam ratings
        query = query.order('total_rating', {
          ascending: sortOrder === 'asc',
          nullsFirst: false,
        });
        break;
      case 'trend':
      default:
        // TODO: Implement trend-based sorting
        // This could be based on recent activity, views, searches, etc.
        // For now, fallback to updated_at
        query = query.order('updated_at', { ascending: sortOrder === 'asc' });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(
        error.message || 'Failed to fetch games for explore page',
      );
    }

    return data;
  }

  /**
   * Get total count of games for pagination calculation
   */
  async getTotalGamesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(error.message || 'Failed to get total games count');
    }

    return count || 0;
  }

  /**
   * Get a game by IGDB ID
   */
  async getGameBySlugId(slug: string) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to fetch game');
    }

    return data;
  }

  /**
   * Get user rating for a specific game
   */
  async getUserRating(gameId: number, userId: string) {
    const { data, error } = await this.supabase
      .from('game_ratings')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to fetch user rating');
    }

    return data;
  }

  /**
   * Save or update user rating for a game
   */
  async saveUserRating(
    gameId: number,
    userId: string,
    rating: {
      story: number;
      music: number;
      graphics: number;
      gameplay: number;
      longevity: number;
    },
  ) {
    // Check if rating already exists
    const existingRating = await this.getUserRating(gameId, userId);

    if (existingRating) {
      // Update existing rating
      const { data, error } = await this.supabase
        .from('game_ratings')
        .update({
          story: rating.story,
          music: rating.music,
          graphics: rating.graphics,
          gameplay: rating.gameplay,
          longevity: rating.longevity,
          updated_at: new Date().toISOString(),
        })
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update rating');
      }

      return data;
    } else {
      // Insert new rating
      const { data, error } = await this.supabase
        .from('game_ratings')
        .insert({
          game_id: gameId,
          user_id: userId,
          story: rating.story,
          music: rating.music,
          graphics: rating.graphics,
          gameplay: rating.gameplay,
          longevity: rating.longevity,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to save rating');
      }

      return data;
    }
  }

  /**
   * Search games in database using PostgreSQL full-text search
   */
  async searchGames(query: string, limit: number = 10) {
    if (!query.trim()) {
      return [];
    }

    const searchQuery = query.trim().replace(/'/g, "''");

    try {
      // First try: FTS on name field with ranking
      const { data: nameResults, error: nameError } = await this.supabase
        .from('games')
        .select('id, name, slug, cover_url, developers, first_release_date')
        .textSearch('name', `'${searchQuery}'`, {
          type: 'websearch',
          config: 'english',
        })
        .limit(limit);

      if (!nameError && nameResults && nameResults.length > 0) {
        return nameResults;
      }

      // Second try: FTS on multiple fields (if available)
      const { data: multiFieldResults, error: multiFieldError } =
        await this.supabase.rpc('search_games_fts', {
          search_query: searchQuery,
          result_limit: limit,
        });

      if (
        !multiFieldError &&
        multiFieldResults &&
        multiFieldResults.length > 0
      ) {
        return multiFieldResults;
      }

      // Fallback: ILIKE search on name and developers
      console.warn('FTS search failed, falling back to ILIKE search');

      const { data: fallbackResults, error: fallbackError } =
        await this.supabase
          .from('games')
          .select('id, name, slug, cover_url, developers, first_release_date')
          .or(`name.ilike.%${searchQuery}%,developers.cs.{${searchQuery}}`)
          .order('name')
          .limit(limit);

      if (fallbackError) {
        throw new Error(fallbackError.message || 'Failed to search games');
      }

      return fallbackResults || [];
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to search games');
    }
  }

  /**
   * Get averaged user ratings for each rating type for a specific game
   */
  async getAverageGameRatingsByGameId(gameId: number): Promise<GameRating> {
    const { data, error } = await this.supabase
      .from('game_ratings')
      .select('story, music, graphics, gameplay, longevity')
      .eq('game_id', gameId);

    if (error) {
      throw new Error(error.message || 'Failed to fetch game ratings');
    }

    if (!data || data.length === 0) {
      return {
        story: 0,
        music: 0,
        graphics: 0,
        gameplay: 0,
        longevity: 0,
      };
    }

    // Calculate averages for each rating type
    const totalRatings = data.length;
    const averages = {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    };

    // Sum up all ratings for each category
    data.forEach((rating) => {
      averages.story += rating.story || 0;
      averages.music += rating.music || 0;
      averages.graphics += rating.graphics || 0;
      averages.gameplay += rating.gameplay || 0;
      averages.longevity += rating.longevity || 0;
    });

    // Calculate averages
    Object.keys(averages).forEach((key) => {
      averages[key as keyof typeof averages] = Number(
        (averages[key as keyof typeof averages] / totalRatings).toFixed(1),
      );
    });

    return averages;
  }

  /**
   * Check if a game is already in hero_games
   */
  async checkHeroGameExists(gameId: number) {
    const { data, error } = await this.supabase
      .from('hero_games')
      .select('id')
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to check if hero game exists');
    }

    return data;
  }

  /**
   * Add a game to hero_games
   */
  async addHeroGame(gameId: number) {
    // Check if already exists
    const existingHeroGame = await this.checkHeroGameExists(gameId);
    if (existingHeroGame) {
      throw new Error('Game is already in hero games');
    }

    const { data, error } = await this.supabase
      .from('hero_games')
      .insert({ game_id: gameId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to add hero game');
    }

    return data;
  }

  /**
   * Remove a game from hero_games
   */
  async removeHeroGame(gameId: number) {
    const { data, error } = await this.supabase
      .from('hero_games')
      .delete()
      .eq('game_id', gameId)
      .select();

    if (error) {
      throw new Error(error.message || 'Failed to remove hero game');
    }

    return data;
  }

  /**
   * Get all hero games
   */
  async getHeroGames() {
    const { data, error } = await this.supabase
      .from('hero_games')
      .select(
        `
        id,
        game_id,
        added_at,
        games:game_id (
          id,
          name,
          slug,
          cover_url,
          banner_url,
          developers,
          igdb_id
        )
      `,
      )
      .order('added_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(error.message || 'Failed to fetch hero games');
    }

    return data;
  }

  /**
   * Add game to hero_games by IGDB ID (will add to games table first if doesn't exist)
   */
  async addHeroGameByIgdbId(igdbData: IgdbGameData, bannerFile?: File) {
    // First, add or update the game in the games table
    const gameResult = await this.addOrUpdateGame(igdbData, bannerFile);
    const gameId = gameResult.data.id;

    // Then add it to hero_games
    await this.addHeroGame(gameId);

    return { gameId, heroGame: await this.checkHeroGameExists(gameId) };
  }


}
