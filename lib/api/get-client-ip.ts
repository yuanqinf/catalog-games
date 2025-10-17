import { NextRequest } from 'next/server';

/**
 * Safely extracts the client's IP address from a Next.js request
 *
 * This function prioritizes trusted sources and validates the IP format
 * to prevent IP spoofing attacks in rate limiting scenarios.
 *
 * Priority order:
 * 1. request.ip (Vercel's validated IP on production)
 * 2. x-forwarded-for header (first IP only, validated format)
 * 3. x-real-ip header (validated format)
 * 4. 'anonymous' fallback
 *
 * @param request - Next.js request object
 * @returns A valid IP address or 'anonymous'
 */
export function getClientIP(request: NextRequest): string {
  // On Vercel production, request.ip is already validated and trusted
  if (request.ip) {
    return request.ip;
  }

  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // We only trust the first IP in the chain
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIP = forwardedFor.split(',')[0].trim();
    if (isValidIPFormat(firstIP)) {
      return firstIP;
    }
  }

  // Fallback to x-real-ip header
  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIPFormat(realIP)) {
    return realIP;
  }

  // Ultimate fallback for cases where we can't determine IP
  // This ensures rate limiting still works (all anonymous users share one limit)
  return 'anonymous';
}

/**
 * Basic IP format validation (IPv4 and IPv6)
 * This prevents injection of malicious strings into rate limit keys
 */
function isValidIPFormat(ip: string): boolean {
  // IPv4 pattern: xxx.xxx.xxx.xxx
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

  // IPv6 pattern (simplified - covers most common cases)
  const ipv6Pattern = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;

  // Shortened IPv6 with ::
  const ipv6ShortPattern = /^([\da-f]{0,4}:){2,7}[\da-f]{0,4}$/i;

  if (ipv4Pattern.test(ip)) {
    // Validate IPv4 octets are in range 0-255
    const octets = ip.split('.');
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Pattern.test(ip) || ipv6ShortPattern.test(ip);
}

/**
 * Get a rate limit identifier that combines IP with optional user ID
 * This allows for more granular rate limiting for authenticated users
 *
 * @param request - Next.js request object
 * @param userId - Optional authenticated user ID
 * @returns A unique identifier for rate limiting
 */
export function getRateLimitIdentifier(
  request: NextRequest,
  userId?: string | null,
): string {
  const ip = getClientIP(request);

  // For authenticated users, combine IP + userID for more precise tracking
  if (userId) {
    return `${ip}:${userId}`;
  }

  return ip;
}
