/**
 * Steam game matching utility
 * Finds the best Steam store match for an IGDB game name
 */

interface SteamSearchItem {
  id: number;
  type: string;
  name: string;
  price?: number;
  tiny_image?: string;
  metascore?: string;
  platforms?: string[];
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
    .replace(/δ|Δ/g, 'delta') // Convert Greek Delta to word "delta"
    .replace(/α|Α/g, 'alpha') // Convert Greek Alpha to word "alpha"
    .replace(/β|Β/g, 'beta') // Convert Greek Beta to word "beta"
    .replace(/γ|Γ/g, 'gamma') // Convert Greek Gamma to word "gamma"
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
    console.error('Error validating Steam game candidate:', error);
    return false;
  }
}

/**
 * Find the best Steam match for an IGDB game name
 * Returns Steam App ID and name if found, null otherwise
 */
/**
 * Perform Steam search with a query term
 */
async function performSteamSearch(
  searchTerm: string,
): Promise<SteamSearchItem[]> {
  const query = new URLSearchParams({
    term: searchTerm,
    cc: 'us',
    l: 'en',
  });

  const response = await fetch(
    `https://store.steampowered.com/api/storesearch/?${query.toString()}`,
  );

  if (!response.ok) {
    console.error(`Steam search API error: ${response.status}`);
    return [];
  }

  const data = await response.json();

  if (!data?.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.filter(isValidGameCandidate);
}

export async function findBestSteamMatch(
  igdbName: string,
): Promise<SteamMatchResult | null> {
  if (!igdbName?.trim()) {
    return null;
  }

  try {
    // Strategy 1: Direct search with original name
    let candidates = await performSteamSearch(igdbName.trim());

    // Strategy 2: If no results, try broader search with main keywords
    if (candidates.length === 0) {
      const keywords = extractKeywords(igdbName);
      if (keywords.length >= 2) {
        const broadSearch = keywords.slice(0, 3).join(' '); // Take first 3 keywords
        candidates = await performSteamSearch(broadSearch);
      }
    }

    // Strategy 3: For games with "Delta", also search for games with Greek Δ
    if (candidates.length === 0 && igdbName.toLowerCase().includes('delta')) {
      const deltaVariant = igdbName.replace(/delta/gi, 'Δ');
      candidates = await performSteamSearch(deltaVariant);
    }

    if (candidates.length === 0) {
      return null;
    }

    // Find best match from all candidates
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
