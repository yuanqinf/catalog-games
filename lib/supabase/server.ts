import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side operations (SSR/ISR)
 * This client uses the service role key for admin operations
 * or anon key for public read operations
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    },
  );
}

/**
 * Server-side GameService for SSR/ISR data fetching
 * No auth required for public read operations
 */
export class ServerGameService {
  private supabase;

  constructor() {
    this.supabase = createServerSupabaseClient();
  }

  /**
   * Get top disliked games (used in homepage SSR)
   */
  async getTopDislikedGames(limit: number = 10) {
    const { data, error } = await this.supabase
      .from('games')
      .select(
        'id, igdb_id, name, slug, cover_url, banner_url, developers, dislike_count',
      )
      .order('dislike_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch top disliked games:', error);
      return [];
    }

    // Type assertion to match expected structure
    return (data || []) as any;
  }

  /**
   * Get dead games (used in homepage SSR)
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
        games!inner (
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
      .order('user_reaction_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch dead games:', error);
      return [];
    }

    // Type assertion to match DeadGameFromAPI - Supabase returns correct structure
    return (data || []) as any;
  }

  /**
   * Get game by slug or ID (used in detail page SSR)
   */
  async getGameBySlugId(slugOrId: string) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch game:', error);
      return null;
    }

    return data;
  }

  /**
   * Get games for explore page (used in explore SSR)
   */
  async getGamesForExplorePage(
    offset: number,
    limit: number,
    topGamesLimit: number = 100,
  ) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .order('dislike_count', { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(topGamesLimit);

    if (error) {
      console.error('Failed to fetch games for explore page:', error);
      return [];
    }

    return data || [];
  }
}
