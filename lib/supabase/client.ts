import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import type { GameDbData, IgdbGameData } from '@/types';

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
      genre: data.genre ? data.genre.map((g) => g.name) : null,
      platforms: data.platforms ? data.platforms.map((p) => p.name) : null,
      game_engines: data.game_engines
        ? data.game_engines.map((e) => e.name)
        : null,
      game_modes: data.game_modes ? data.game_modes.map((m) => m.name) : null,
      cover_url: data.cover?.url || null,
      screenshots: data.screenshots ? data.screenshots.map((s) => s.url) : null,
      artworks: data.artworks ? data.artworks.map((a) => a.url) : null,
      videos: data.videos ? data.videos.map((v) => v.video_id) : null,
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
   * Upload a banner image to Supabase storage
   */
  async uploadBanner(
    file: File,
    igdbId: number,
    slug: string,
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${igdbId}_${slug}_banner.${fileExt}`;
    const filePath = `banners/${fileName}`;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Banner file size must be less than 5MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Banner must be a JPEG, PNG, or WebP image');
    }

    // Check if file already exists (for logging purposes)
    const { data: existingFile } = await this.supabase.storage
      .from('game-image-assets')
      .list('banners', {
        search: `${igdbId}_${slug}_banner`,
      });

    const fileExists = existingFile && existingFile.length > 0;

    if (fileExists) {
      console.log(`🔄 Replacing existing banner for game ${igdbId} (${slug})`);
    } else {
      console.log(`📤 Uploading new banner for game ${igdbId} (${slug})`);
    }

    const { error: uploadError } = await this.supabase.storage
      .from('game-image-assets')
      .upload(filePath, file, {
        upsert: true, // Replace existing file if it exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload banner: ${uploadError.message}`);
    }

    // Get public URL with cache busting timestamp
    const { data } = this.supabase.storage
      .from('game-image-assets')
      .getPublicUrl(filePath);

    // Add cache busting parameter to ensure fresh image loads
    const timestamp = Date.now();
    const urlWithCacheBust = `${data.publicUrl}?updated=${timestamp}`;

    console.log(`✅ Banner uploaded successfully: ${urlWithCacheBust}`);

    return urlWithCacheBust;
  }

  /**
   * Add or update a game from IGDB data with optional banner and Steam reviews
   */
  async addOrUpdateGame(igdbData: IgdbGameData, bannerFile?: File) {
    const dbData = this.transformIgdbData(igdbData);

    // Upload banner if provided
    if (bannerFile) {
      try {
        const bannerUrl = await this.uploadBanner(
          bannerFile,
          igdbData.id,
          igdbData.slug,
        );
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

    // Fetch Steam reviews via API route
    try {
      console.log(`🎮 Fetching Steam reviews for: ${igdbData.name}`);
      const response = await fetch(
        `/api/steam/reviews?q=${encodeURIComponent(igdbData.name)}`,
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.result.steamAppId) {
          dbData.steam_app_id = result.result.steamAppId;
          dbData.steam_all_review = result.result.steam_all_review;
          dbData.steam_recent_review = result.result.steam_recent_review;
          console.log(
            `📊 Steam reviews added: Overall="${result.result.steam_all_review}", Recent="${result.result.steam_recent_review}"`,
          );
        } else {
          console.log(`❌ No Steam match found for: ${igdbData.name}`);
        }
      } else {
        console.log(
          `⚠️ Steam API request failed with status: ${response.status}`,
        );
      }
    } catch (error) {
      console.warn(
        'Steam reviews fetch failed, continuing without Steam data:',
        error,
      );
      // Continue without Steam data if fetch fails
    }

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
