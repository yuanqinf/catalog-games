/**
 * IGDB data transformation utility
 */

import type { GameDbData, IgdbGameData } from '@/types';

/**
 * Transform IGDB game data to database format
 */
export function transformIgdbData(data: IgdbGameData): GameDbData {
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