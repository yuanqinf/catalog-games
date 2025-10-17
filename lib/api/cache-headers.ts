/**
 * Cache header utilities for API routes
 *
 * This module provides standardized cache control headers with
 * environment variable overrides for easy production tuning.
 */

/**
 * Cache duration presets in seconds
 * Can be overridden via environment variables
 */
export const CACHE_DURATIONS = {
  // Very short cache for real-time data
  REALTIME: parseInt(process.env.CACHE_REALTIME || '10', 10), // 10 seconds

  // Short cache for frequently updated data
  SHORT: parseInt(process.env.CACHE_SHORT || '60', 10), // 1 minute

  // Medium cache for moderately stable data
  MEDIUM: parseInt(process.env.CACHE_MEDIUM || '300', 10), // 5 minutes

  // Long cache for stable data
  LONG: parseInt(process.env.CACHE_LONG || '1800', 10), // 30 minutes

  // Very long cache for rarely changing data
  VERY_LONG: parseInt(process.env.CACHE_VERY_LONG || '86400', 10), // 24 hours
} as const;

/**
 * Cache strategies for different types of data
 */
export const CACHE_STRATEGIES = {
  // Real-time game stats (player counts, online users)
  GAME_STATS: {
    maxAge: CACHE_DURATIONS.REALTIME,
    staleWhileRevalidate: 60,
  },

  // Frequently changing data (dislike counts, rankings)
  DYNAMIC_CONTENT: {
    maxAge: CACHE_DURATIONS.SHORT,
    staleWhileRevalidate: 300,
  },

  // Moderately stable data (game lists, search results)
  STABLE_CONTENT: {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleWhileRevalidate: 600,
  },

  // Rarely changing data (game metadata, tags)
  STATIC_CONTENT: {
    maxAge: CACHE_DURATIONS.LONG,
    staleWhileRevalidate: 3600,
  },

  // Very stable external data (Steam tags, playtime)
  EXTERNAL_DATA: {
    maxAge: CACHE_DURATIONS.VERY_LONG,
    staleWhileRevalidate: 86400,
  },
} as const;

interface CacheOptions {
  maxAge: number; // Cache duration in seconds
  staleWhileRevalidate?: number; // How long to serve stale content while revalidating
  private?: boolean; // If true, cache is private (user-specific)
  noCache?: boolean; // If true, don't cache at all
}

/**
 * Generates Cache-Control header value
 *
 * @param options - Cache configuration options
 * @returns Object with Cache-Control header
 *
 * @example
 * return NextResponse.json(data, {
 *   headers: getCacheHeaders(CACHE_STRATEGIES.STABLE_CONTENT)
 * });
 */
export function getCacheHeaders(options: CacheOptions): Record<string, string> {
  if (options.noCache) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };
  }

  const visibility = options.private ? 'private' : 'public';
  const sMaxAge = options.private ? '' : `, s-maxage=${options.maxAge}`;
  const staleWhileRevalidate = options.staleWhileRevalidate
    ? `, stale-while-revalidate=${options.staleWhileRevalidate}`
    : '';

  return {
    'Cache-Control': `${visibility}, max-age=${options.maxAge}${sMaxAge}${staleWhileRevalidate}`,
  };
}

/**
 * Shorthand helper for common cache patterns
 */
export const cacheHeaders = {
  /**
   * For real-time game stats (10s cache)
   */
  gameStats: () => getCacheHeaders(CACHE_STRATEGIES.GAME_STATS),

  /**
   * For dynamic content like dislikes, reactions (1min cache)
   */
  dynamic: () => getCacheHeaders(CACHE_STRATEGIES.DYNAMIC_CONTENT),

  /**
   * For stable content like game lists (5min cache)
   */
  stable: () => getCacheHeaders(CACHE_STRATEGIES.STABLE_CONTENT),

  /**
   * For static content like game metadata (30min cache)
   */
  static: () => getCacheHeaders(CACHE_STRATEGIES.STATIC_CONTENT),

  /**
   * For external API data (24h cache)
   */
  external: () => getCacheHeaders(CACHE_STRATEGIES.EXTERNAL_DATA),

  /**
   * For user-specific data (private cache)
   */
  private: (maxAge: number = 60) => getCacheHeaders({ maxAge, private: true }),

  /**
   * No caching at all
   */
  noCache: () => getCacheHeaders({ maxAge: 0, noCache: true }),

  /**
   * Custom cache duration
   */
  custom: (maxAge: number, staleWhileRevalidate?: number) =>
    getCacheHeaders({ maxAge, staleWhileRevalidate }),
};
