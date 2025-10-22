import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import type { IgdbGameData, GameRating } from '@/types';
import { transformIgdbData } from '@/utils/igdb-transform';
import { uploadBanner } from '@/utils/banner-upload';
import { fetchSteamTags } from '@/utils/steam-integration';

type ClerkSession = ReturnType<typeof useSession>['session'];

export function createClerkSupabaseClient(session?: ClerkSession | null) {
  // Always create a new instance with the provided session
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

    if (existingGame) {
      // Update existing game
      result = await this.supabase
        .from('games')
        .update(dbData)
        .eq('igdb_id', igdbData.id)
        .select('id')
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update game data');
      }
    } else {
      // Insert new game
      result = await this.supabase
        .from('games')
        .insert([dbData])
        .select('id')
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create game data');
      }
    }

    return result;
  }

  /**
   * Get game ranking for game detail page
   * @param gameId - The game ID to get ranking for
   * @returns Ranking data with current game (if within top 100)
   */
  async getGameRanking(gameId: number) {
    try {
      // First, get the current game's data
      const { data: currentGameData, error: gameError } = await this.supabase
        .from('games')
        .select('id, name, slug, dislike_count')
        .eq('id', gameId)
        .single();

      if (gameError || !currentGameData) {
        throw new Error(gameError?.message || 'Game not found');
      }

      // Get all games sorted by dislike count to calculate ranking
      const { data: allGames, error: rankingError } = await this.supabase
        .from('games')
        .select('id, name, slug, dislike_count')
        .order('dislike_count', { ascending: false, nullsFirst: false })
        .limit(100); // Only get top 100 for ranking

      if (rankingError) {
        throw new Error(rankingError.message || 'Failed to fetch ranking data');
      }

      // Find current game's position in the ranking
      const currentGameIndex = allGames.findIndex((game) => game.id === gameId);

      if (currentGameIndex === -1) {
        // Game is not in top 100
        return {
          currentGame: {
            ...currentGameData,
            rank: null, // Outside top 100
          },
        };
      }

      const currentRank = currentGameIndex + 1;

      return {
        currentGame: {
          ...currentGameData,
          rank: currentRank,
        },
      };
    } catch (error) {
      console.error('Failed to get game ranking:', error);
      throw error;
    }
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
   * Search games in database using PostgreSQL full-text search
   */
  async searchGames(query: string, limit: number = 10) {
    if (!query.trim()) {
      return [];
    }

    const searchQuery = query.trim().replace(/'/g, "''");

    try {
      // Use RPC function for comprehensive search across multiple fields
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
        // If multiFieldResults doesn't include dislike_count, query again to get it
        if (
          multiFieldResults.length > 0 &&
          !('dislike_count' in multiFieldResults[0])
        ) {
          const gameIds = multiFieldResults.map(
            (game: { id: number }) => game.id,
          );

          // Get dead games data
          const { data: deadGames } = await this.supabase
            .from('dead_games')
            .select('game_id, user_reaction_count')
            .in('game_id', gameIds);

          const deadGamesMap = new Map(
            deadGames?.map((dg) => [dg.game_id, dg.user_reaction_count]) || [],
          );

          const { data: enrichedResults } = await this.supabase
            .from('games')
            .select(
              'id, name, slug, cover_url, developers, first_release_date, dislike_count',
            )
            .in('id', gameIds);

          if (enrichedResults) {
            // Maintain the original order from RPC results and add dead game info
            const enrichedMap = new Map(
              enrichedResults.map((game) => [game.id, game]),
            );
            const orderedResults = multiFieldResults.map(
              (originalGame: { id: number }) => {
                const game = enrichedMap.get(originalGame.id) || originalGame;
                const ghostCount = deadGamesMap.get(originalGame.id);
                return {
                  ...game,
                  is_dead: ghostCount !== undefined,
                  ghost_count: ghostCount || null,
                };
              },
            );
            return orderedResults;
          }
        }
        return multiFieldResults;
      }

      // Fallback: FTS on name field if RPC fails
      const { data: nameResults, error: nameError } = await this.supabase
        .from('games')
        .select(
          'id, name, slug, cover_url, developers, first_release_date, dislike_count',
        )
        .textSearch('name', `'${searchQuery}'`, {
          type: 'websearch',
          config: 'english',
        })
        .limit(limit);

      if (!nameError && nameResults && nameResults.length > 0) {
        // Add dead game info to name results
        const gameIds = nameResults.map((game) => game.id);
        const { data: deadGames } = await this.supabase
          .from('dead_games')
          .select('game_id, user_reaction_count')
          .in('game_id', gameIds);

        const deadGamesMap = new Map(
          deadGames?.map((dg) => [dg.game_id, dg.user_reaction_count]) || [],
        );

        return nameResults.map((game) => {
          const ghostCount = deadGamesMap.get(game.id);
          return {
            ...game,
            is_dead: ghostCount !== undefined,
            ghost_count: ghostCount || null,
          };
        });
      }

      // Fallback: ILIKE search on name and developers
      console.warn('FTS search failed, falling back to ILIKE search');

      const { data: fallbackResults, error: fallbackError } =
        await this.supabase
          .from('games')
          .select(
            'id, name, slug, cover_url, developers, first_release_date, dislike_count',
          )
          .or(`name.ilike.%${searchQuery}%,developers.cs.{${searchQuery}}`)
          .order('name')
          .limit(limit);

      if (fallbackError) {
        throw new Error(fallbackError.message || 'Failed to search games');
      }

      if (fallbackResults && fallbackResults.length > 0) {
        // Add dead game info to fallback results
        const gameIds = fallbackResults.map((game) => game.id);
        const { data: deadGames } = await this.supabase
          .from('dead_games')
          .select('game_id, user_reaction_count')
          .in('game_id', gameIds);

        const deadGamesMap = new Map(
          deadGames?.map((dg) => [dg.game_id, dg.user_reaction_count]) || [],
        );

        return fallbackResults.map((game) => {
          const ghostCount = deadGamesMap.get(game.id);
          return {
            ...game,
            is_dead: ghostCount !== undefined,
            ghost_count: ghostCount || null,
          };
        });
      }

      return fallbackResults || [];
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to search games');
    }
  }

  /**
   * Get top disliked games ordered by dislike count
   */
  async getTopDislikedGames(limit: number = 5) {
    const { data, error } = await this.supabase
      .from('games')
      .select(
        'id, igdb_id, name, slug, cover_url, banner_url, developers, dislike_count',
      )
      .order('dislike_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message || 'Failed to fetch top disliked games');
    }

    return data || [];
  }

  /**
   * Increment dislike count for a game by game ID
   */
  async incrementGameDislike(gameId: number, incrementBy: number = 1) {
    const { data, error } = await this.supabase.rpc('increment_game_dislike', {
      game_id: gameId,
      increment_amount: incrementBy,
    });

    if (error) {
      throw new Error(error.message || 'Failed to increment game dislike');
    }

    return data;
  }

  /**
   * Get game by IGDB ID for dislike functionality
   */
  async getGameByIgdbId(igdbId: number) {
    const { data, error } = await this.supabase
      .from('games')
      .select('id, igdb_id, name, dislike_count')
      .eq('igdb_id', igdbId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to fetch game by IGDB ID');
    }

    return data;
  }

  /**
   * Get games by their names for deduplication
   */
  async getGamesByNames(gameNames: string[]) {
    if (gameNames.length === 0) return [];

    const { data, error } = await this.supabase
      .from('games')
      .select('id, name, slug, dislike_count')
      .in('name', gameNames);

    if (error) {
      console.error('Failed to fetch games by names:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add a dead game entry to the dead_games table
   */
  async addDeadGame(
    gameId: number,
    deadDate: string,
    deadStatus: 'Shutdown' | 'Abandoned',
    userReactionCount: number = 0,
  ) {
    const { data, error } = await this.supabase
      .from('dead_games')
      .insert({
        game_id: gameId,
        dead_date: deadDate,
        dead_status: deadStatus,
        user_reaction_count: userReactionCount,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to add dead game');
    }

    return data;
  }

  /**
   * Get all dead games for the graveyard page
   */
  async getDeadGames() {
    const { data, error } = await this.supabase
      .from('dead_games')
      .select(
        `
        id,
        dead_date,
        dead_status,
        user_reaction_count,
        created_at,
        games:game_id (
          id,
          igdb_id,
          name,
          slug,
          cover_url,
          banner_url,
          developers,
          publishers
        )
      `,
      )
      .order('dead_date', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch dead games');
    }

    return data;
  }

  /**
   * Update reaction count for a dead game
   */
  async incrementDeadGameReaction(deadGameId: string, incrementBy: number = 1) {
    const { data, error } = await this.supabase.rpc(
      'increment_dead_game_reaction',
      {
        dead_game_id: deadGameId,
        increment_amount: incrementBy,
      },
    );

    if (error) {
      throw new Error(
        error.message || 'Failed to increment dead game reaction',
      );
    }

    return data;
  }
}
