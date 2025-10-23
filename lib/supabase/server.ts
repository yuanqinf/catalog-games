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
   * Get top dead games for homepage (used in homepage SSR)
   * Note: Ordered by user_reaction_count (most popular first), limited to 10
   * For all dead games by date, use GameService.getDeadGames
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
      .order('user_reaction_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch dead games:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get game by slug or ID (used in detail page SSR)
   */
  async getGameBySlugId(slugOrId: string) {
    // Check if slugOrId is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(slugOrId);

    let query = this.supabase.from('games').select('*');

    if (isNumeric) {
      // If numeric, search by ID
      query = query.eq('id', parseInt(slugOrId, 10));
    } else {
      // If not numeric, search by slug
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.maybeSingle();

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
