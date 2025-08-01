import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import type { IgdbGameData, ExternalGameReview, GameRating } from '@/types';
import { transformIgdbData } from '@/utils/igdb-transform';
import { uploadBanner } from '@/utils/banner-upload';
import {
  fetchSteamReviewSummary,
  fetchSteamTags,
  fetchSteamReviewsData,
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
   * Add external reviews for a game
   */
  async addGameReviews(
    gameId: number,
    reviews: Omit<ExternalGameReview, 'game_id'>[],
  ) {
    // Set the game_id for each review
    const reviewsWithGameId = reviews.map((review) => ({
      ...review,
      game_id: gameId,
    }));

    const { data, error } = await this.supabase
      .from('external_game_reviews')
      .insert(reviewsWithGameId);

    if (error) {
      throw new Error(error.message || 'Failed to insert game reviews');
    }

    return data;
  }

  /**
   * Get reviews for a specific game
   */
  async getGameReviews(gameId: number) {
    const { data, error } = await this.supabase
      .from('external_game_reviews')
      .select('*')
      .eq('game_id', gameId)
      .order('original_published_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch game reviews');
    }

    return data;
  }

  /**
   * Check if a review already exists (to avoid duplicates)
   */
  async checkReviewExists(reviewId: string) {
    const { data, error } = await this.supabase
      .from('external_game_reviews')
      .select('id')
      .eq('review_id', reviewId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to check if review exists');
    }

    return data;
  }

  /**
   * Add or update a game from IGDB data with optional banner, Steam data, and reviews
   */
  async addOrUpdateGame(igdbData: IgdbGameData, bannerFile?: File) {
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

    // Fetch Steam data via API route
    const steamReviewSummary = await fetchSteamReviewSummary(igdbData.name);
    const steamTags = await fetchSteamTags(igdbData.name);
    Object.assign(dbData, steamReviewSummary, steamTags);

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

    // Fetch and add Steam reviews if Steam data was found
    if (steamReviewSummary.steam_app_id) {
      try {
        console.log(`📝 Fetching Steam reviews for: ${igdbData.name}`);
        const steamReviewsData = await fetchSteamReviewsData(igdbData.name);
        if (steamReviewsData.reviews && steamReviewsData.reviews.length > 0) {
          // Check for duplicates and filter out existing reviews
          const newReviews = [];
          for (const review of steamReviewsData.reviews) {
            const exists = await this.checkReviewExists(review.review_id);
            if (!exists) {
              newReviews.push({
                review_id: review.review_id,
                source: review.source,
                content: review.content,
                original_published_at: review.original_published_at,
              });
            }
          }

          if (newReviews.length > 0) {
            await this.addGameReviews(gameId, newReviews);
            console.log(`📝 Added ${newReviews.length} new Steam reviews`);
          } else {
            console.log(`📝 No new reviews to add (all reviews already exist)`);
          }
        }
      } catch (reviewError) {
        console.warn(
          'Failed to fetch/save Steam reviews, but game data was saved:',
          reviewError,
        );
        // Don't throw here - we want game data to be saved even if reviews fail
      }
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
}
