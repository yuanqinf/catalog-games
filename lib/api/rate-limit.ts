/**
 * Rate Limiting Utility for API Routes
 *
 * This provides a simple in-memory rate limiter for API routes.
 * For production, consider using external services like:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel Edge Config
 * - CloudFlare Rate Limiting
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: number[];
}

const rateLimitStore: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 },
) {
  const now = Date.now();
  const windowStart = now - config.interval;

  // Initialize or get existing timestamps for this identifier
  if (!rateLimitStore[identifier]) {
    rateLimitStore[identifier] = [];
  }

  // Remove timestamps outside the current window
  rateLimitStore[identifier] = rateLimitStore[identifier].filter(
    (timestamp) => timestamp > windowStart,
  );

  // Check if limit exceeded
  if (rateLimitStore[identifier].length >= config.uniqueTokenPerInterval) {
    return {
      success: false,
      remaining: 0,
      resetAt: rateLimitStore[identifier][0] + config.interval,
    };
  }

  // Add current request timestamp
  rateLimitStore[identifier].push(now);

  return {
    success: true,
    remaining:
      config.uniqueTokenPerInterval - rateLimitStore[identifier].length,
    resetAt: now + config.interval,
  };
}

/**
 * Clean up old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const key in rateLimitStore) {
    rateLimitStore[key] = rateLimitStore[key].filter(
      (timestamp) => now - timestamp < maxAge,
    );

    // Remove empty arrays
    if (rateLimitStore[key].length === 0) {
      delete rateLimitStore[key];
    }
  }
}

/**
 * Example usage in an API route:
 *
 * import { rateLimit } from '@/lib/api/rate-limit';
 *
 * export async function GET(request: NextRequest) {
 *   const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
 *
 *   const { success, remaining, resetAt } = rateLimit(ip, {
 *     interval: 60000, // 1 minute
 *     uniqueTokenPerInterval: 20, // 20 requests per minute
 *   });
 *
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': '20',
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': new Date(resetAt).toISOString(),
 *         },
 *       },
 *     );
 *   }
 *
 *   // Your API logic here
 *   return NextResponse.json({ data: 'success' }, {
 *     headers: {
 *       'X-RateLimit-Limit': '20',
 *       'X-RateLimit-Remaining': remaining.toString(),
 *       'X-RateLimit-Reset': new Date(resetAt).toISOString(),
 *     },
 *   });
 * }
 */
