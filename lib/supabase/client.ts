import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

type ClerkSession = ReturnType<typeof useSession>['session'];

// Type for game data to insert/update
export interface GameDbData {
  igdb_id: number;
  name: string;
  storyline?: string;
  summary?: string;
  slug?: string;
  first_release_date?: string | null;
  igdb_update_date?: string | null;
  total_rating?: number;
  total_rating_count?: number;
  genre?: string[] | null;
  platforms?: string[] | null;
  involved_companies?: string[] | null;
  game_engines?: string[] | null;
  game_modes?: string[] | null;
  cover_url?: string | null;
  screenshots?: string[] | null;
  artworks?: string[] | null;
  videos?: string[] | null;
  updated_at?: string;
  publishers?: string[] | null;
  developers?: string[] | null;
}

// Type for IGDB game data from API
export interface IgdbGameData {
  id: number;
  name: string;
  storyline?: string;
  summary?: string;
  slug?: string;
  first_release_date?: number;
  updated_at?: number;
  total_rating?: number;
  total_rating_count?: number;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  game_engines?: Array<{ name: string }>;
  game_modes?: Array<{ name: string }>;
  cover?: { url: string };
  screenshots?: Array<{ url: string }>;
  artworks?: Array<{ url: string }>;
  videos?: Array<{ video_id: string }>;
  involved_companies?: Array<{
    publisher?: boolean;
    developer?: boolean;
    company?: { name: string };
  }>;
}

export function createClerkSupabaseClient(session: ClerkSession) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({ template: 'supabase' });
          const headers = new Headers(options?.headers);
          headers.set('Authorization', `Bearer ${clerkToken}`);
          return fetch(url, { ...options, headers });
        },
      },
    },
  );
}

export class GameService {
  private supabase;

  constructor(session: ClerkSession) {
    this.supabase = createClerkSupabaseClient(session);
  }

  /**
   * Transform IGDB game data to database format
   */
  private transformIgdbData(data: IgdbGameData): GameDbData {
    return {
      igdb_id: data.id,
      name: data.name,
      storyline: data.storyline,
      summary: data.summary,
      slug: data.slug,
      first_release_date: data.first_release_date
        ? new Date(data.first_release_date * 1000).toISOString()
        : null,
      igdb_update_date: data.updated_at
        ? new Date(data.updated_at * 1000).toISOString()
        : null,
      total_rating: data.total_rating,
      total_rating_count: data.total_rating_count,
      genre: data.genres
        ? data.genres.map((g) => g.name)
        : null,
      platforms: data.platforms
        ? data.platforms.map((p) => p.name)
        : null,
      game_engines: data.game_engines
        ? data.game_engines.map((e) => e.name)
        : null,
      game_modes: data.game_modes
        ? data.game_modes.map((m) => m.name)
        : null,
      cover_url: data.cover?.url || null,
      screenshots: data.screenshots
        ? data.screenshots.map((s) => s.url)
        : null,
      artworks: data.artworks
        ? data.artworks.map((a) => a.url)
        : null,
      videos: data.videos
        ? data.videos.map((v) => v.video_id)
        : null,
      updated_at: new Date().toISOString(),
      publishers: data.involved_companies
        ? data.involved_companies
            .filter((c) => c.publisher)
            .map((c) => c.company?.name || '')
        : null,
      developers: data.involved_companies
        ? data.involved_companies
            .filter((c) => c.developer)
            .map((c) => c.company?.name || '')
        : null,
    };
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
   * Add or update a game from IGDB data
   */
  async addOrUpdateGame(igdbData: IgdbGameData) {
    const dbData = this.transformIgdbData(igdbData);

    // Check if the game already exists
    const existingGame = await this.checkGameExists(igdbData.id);

    let result;
    if (existingGame) {
      // Update existing game
      result = await this.supabase
        .from('games')
        .update(dbData)
        .eq('igdb_id', igdbData.id);
    } else {
      // Insert new game
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

  /**
   * Delete a game by IGDB ID
   */
  async deleteGame(igdbId: number) {
    const { error } = await this.supabase
      .from('games')
      .delete()
      .eq('igdb_id', igdbId);

    if (error) {
      throw new Error(error.message || 'Failed to delete game');
    }

    return true;
  }
}
