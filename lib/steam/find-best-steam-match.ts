/**
 * Steam game matching utility
 * Finds the best Steam store match for an IGDB game name
 */

interface SteamSearchItem {
  id: number;
  type: string;
  name: string;
  price?: any;
  tiny_image?: string;
  metascore?: string;
  platforms?: any;
  streamingvideo?: boolean;
  controller_support?: string;
}

export interface SteamMatchResult {
  steamAppId: number;
  steamName: string;
}

/**
 * Normalize text for better comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[™®©]/g, '') // Remove trademark symbols
    .replace(/[:\-–—]/g, ' ') // Replace colons and dashes with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .trim();
}

/**
 * Extract meaningful words (filter out common stopwords)
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'edition',
    'game',
    'complete',
    'definitive',
    'ultimate',
    'deluxe',
    'special',
    'standard',
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate similarity score between two game names
 */
function calculateSimilarity(igdbName: string, steamName: string): number {
  const igdbKeywords = extractKeywords(igdbName);
  const steamKeywords = extractKeywords(steamName);

  if (igdbKeywords.length === 0 || steamKeywords.length === 0) return 0;

  // Exact match bonus
  if (normalizeText(igdbName) === normalizeText(steamName)) {
    return 1.0;
  }

  // Calculate keyword overlap
  const commonKeywords = igdbKeywords.filter((word) =>
    steamKeywords.some(
      (steamWord) =>
        steamWord.includes(word) ||
        word.includes(steamWord) ||
        steamWord === word,
    ),
  );

  return (
    commonKeywords.length / Math.max(igdbKeywords.length, steamKeywords.length)
  );
}

/**
 * Filter out unwanted Steam items
 */
function isValidGameCandidate(item: SteamSearchItem): boolean {
  try {
    // Validate item structure
    if (!item || typeof item !== 'object') {
      return false;
    }

    if (!item.name || typeof item.name !== 'string') {
      return false;
    }

    if (!item.type || typeof item.type !== 'string') {
      return false;
    }

    const name = item.name.toLowerCase();

    // Must be an app
    if (item.type !== 'app') {
      return false;
    }

    // Filter out common non-game items
    const exclusions = [
      'demo',
      'beta',
      'alpha',
      'test',
      'soundtrack',
      'ost',
      'music',
      'dlc',
      'expansion',
      'season pass',
      'pack',
      'bundle',
      'collection',
      'trailer',
      'video',
      'documentary',
      'wallpaper',
      'artbook',
      'comic',
    ];

    // Check which exclusion is matching - only match whole words, not substrings
    const words = name.split(/\s+/);
    const matchingExclusion = exclusions.find((exclusion) =>
      words.some((word) => word === exclusion),
    );
    const isValid = !matchingExclusion;

    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Find the best Steam match for an IGDB game name
 * Returns Steam App ID and name if found, null otherwise
 */
export async function findBestSteamMatch(
  igdbName: string,
): Promise<SteamMatchResult | null> {
  if (!igdbName?.trim()) {
    return null;
  }

  const query = new URLSearchParams({
    term: igdbName.trim(),
    cc: 'us',
    l: 'en',
  });

  try {
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?${query.toString()}`,
    );

    if (!response.ok) {
      console.error(`Steam search API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data?.items || !Array.isArray(data.items)) {
      return null;
    }

    // Filter valid candidates
    const candidates = data.items.filter(isValidGameCandidate);

    if (candidates.length === 0) {
      return null;
    }

    // Find best match
    let bestMatch: SteamSearchItem | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = calculateSimilarity(igdbName, candidate.name);

      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (!bestMatch) {
      return null;
    }

    return {
      steamAppId: bestMatch.id,
      steamName: bestMatch.name,
    };
  } catch (error) {
    console.error('Steam search failed:', error);
    return null;
  }
}
