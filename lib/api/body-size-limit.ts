import { NextRequest, NextResponse } from 'next/server';

/**
 * Body size limits for different API routes
 * These limits help prevent DOS attacks via large request bodies
 */
export const BODY_SIZE_LIMITS = {
  // Admin operations that may include images/banners
  ADMIN_WITH_IMAGES: 10 * 1024 * 1024, // 10MB

  // Regular API operations (reactions, dislikes, ratings)
  STANDARD: 1 * 1024 * 1024, // 1MB

  // Search and query operations (should be very small)
  QUERY: 100 * 1024, // 100KB
} as const;

/**
 * Gets the Content-Length header value from a request
 * @param request - Next.js request object
 * @returns Content length in bytes, or null if not specified
 */
function getContentLength(request: NextRequest): number | null {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) {
    return null;
  }

  const length = parseInt(contentLength, 10);
  return isNaN(length) ? null : length;
}

/**
 * Validates that a request body doesn't exceed the specified size limit
 *
 * @param request - Next.js request object
 * @param maxSize - Maximum allowed body size in bytes
 * @returns Response with 413 error if body too large, null if OK
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const sizeError = validateBodySize(request, BODY_SIZE_LIMITS.STANDARD);
 *   if (sizeError) return sizeError;
 *
 *   // Continue with normal processing...
 * }
 */
export function validateBodySize(
  request: NextRequest,
  maxSize: number,
): NextResponse | null {
  const contentLength = getContentLength(request);

  // If no content-length header, we can't validate upfront
  // Next.js will enforce the global limit from next.config.ts
  if (contentLength === null) {
    return null;
  }

  if (contentLength > maxSize) {
    return NextResponse.json(
      {
        success: false,
        error: 'Request body too large',
        details: `Maximum allowed size is ${formatBytes(maxSize)}, received ${formatBytes(contentLength)}`,
      },
      {
        status: 413, // Payload Too Large
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  return null;
}

/**
 * Formats bytes into human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
