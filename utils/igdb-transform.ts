/**
 * IGDB data transformation utility
 */

import type { GameDbData, IgdbGameData } from '@/types';
import {
  filterAgeRestrictedVideos,
  sortVideosByDate,
} from './youtube-validation';

/**
 * Transform IGDB game data to database format
 */
export async function transformIgdbData(
  data: IgdbGameData,
): Promise<GameDbData> {
  return {
    igdb_id: data.id,
    name: data.name,
    summary: data.summary,
    slug: data.slug,
    first_release_date: data.first_release_date
      ? new Date(data.first_release_date * 1000).toISOString()
      : null,
    total_rating: data.total_rating,
    genres: data.genres ? data.genres.map((g) => g.name) : null,
    platforms: data.platforms ? data.platforms.map((p) => p.name) : null,
    game_engines: data.game_engines
      ? data.game_engines.map((e) => e.name)
      : null,
    game_modes: data.game_modes ? data.game_modes.map((m) => m.name) : null,
    cover_url: data.cover?.url || null,
    screenshots: data.screenshots ? data.screenshots.map((s) => s.url) : null,
    artworks: data.artworks ? data.artworks.map((a) => a.url) : null,
    videos: data.videos
      ? await sortVideosByDate(
          await filterAgeRestrictedVideos(data.videos.map((v) => v.video_id)),
        )
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
    igdb_user_rating:
      data.rating != null ? Number((data.rating / 10).toFixed(1)) : null,
  };
}
