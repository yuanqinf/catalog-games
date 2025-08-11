import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface RecommendedGame {
  name: string;
  url: string;
  imageUrl?: string;
}

interface PlaytimeData {
  gameName: string;
  averagePlaytime: string | null;
  url: string | null;
  playersAlsoLiked: RecommendedGame[];
}

// Standard browser headers to avoid blocking
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  DNT: '1',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchWithBrowserHeaders(url: string) {
  const response = await fetch(url, { headers: BROWSER_HEADERS });
  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }
  return response.text();
}

function findFirstGameUrl($: cheerio.CheerioAPI): string | null {
  let gameUrl: string | null = null;

  $('a[href*="/game/"], a[href*="/insight/game/"]').each((index, element) => {
    if (index === 0) {
      const href = $(element).attr('href');
      if (href) {
        gameUrl = href.startsWith('http')
          ? href
          : `https://playtracker.net${href}`;
        return false; // Break the loop
      }
    }
  });

  return gameUrl;
}

function cleanGameName(rawName: string): string {
  return rawName
    .split('\n')[0] // Take only the first line
    .replace(/\s*\d+%\s*audience\s*match.*$/i, '') // Remove audience match text
    .replace(/\s*\d+\s*popularity.*$/i, '') // Remove popularity text
    .trim();
}

function extractPlaytime($: cheerio.CheerioAPI): string | null {
  // Target the specific playtime structure
  const playtimeElement = $('.big-stat-number');

  if (playtimeElement.length > 0) {
    const text = playtimeElement.text().trim();
    const timeMatch = text.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (timeMatch) {
      const playtime = `${timeMatch[1]} hours`;
      console.log(`⏱️ Found playtime: ${playtime}`);
      return playtime;
    }
  }

  // Fallback: look for "average total playtime" text nearby
  const avgPlaytimeSection = $(
    'div:contains("average total playtime")',
  ).parent();
  if (avgPlaytimeSection.length > 0) {
    const numberElement = avgPlaytimeSection.find('.big-stat-number');
    if (numberElement.length > 0) {
      const text = numberElement.text().trim();
      const timeMatch = text.match(/(\d+(?:\.\d+)?)\s*h/i);
      if (timeMatch) {
        const playtime = `${timeMatch[1]} hours`;
        console.log(`⏱️ Found playtime via fallback: ${playtime}`);
        return playtime;
      }
    }
  }

  return null;
}

function extractRecommendations(
  $: cheerio.CheerioAPI,
  currentGameUrl: string,
): RecommendedGame[] {
  const recommendations: RecommendedGame[] = [];

  // Target the specific "Players also liked" section
  const selectors = [
    'h3:contains("Players also liked")',
    'h2:contains("Players also liked")', // fallback
  ];

  // Try to find dedicated recommendation section
  for (const selector of selectors) {
    let sectionElement = $(selector);

    // If heading found, get next container
    if (sectionElement.is('h2, h3')) {
      sectionElement = sectionElement.nextAll().first();
    }

    if (sectionElement.length > 0) {
      sectionElement
        .find('a[href*="/game/"], a[href*="/insight/game/"]')
        .each((index, element) => {
          if (index < 5 && recommendations.length < 5) {
            const gameLink = $(element);
            const href = gameLink.attr('href');
            let rawName =
              gameLink.text().trim() ||
              gameLink.find('img').attr('alt') ||
              gameLink.attr('title');

            if (href && rawName) {
              const gameName = cleanGameName(rawName);
              const fullUrl = href.startsWith('http')
                ? href
                : `https://playtracker.net${href}`;

              // Get image if available
              const img = gameLink.find('img');
              const imageUrl = img.attr('src') || img.attr('data-src');

              recommendations.push({
                name: gameName,
                url: fullUrl,
                imageUrl: imageUrl
                  ? imageUrl.startsWith('http')
                    ? imageUrl
                    : `https://playtracker.net${imageUrl}`
                  : undefined,
              });
            }
          }
        });

      if (recommendations.length > 0) {
        console.log(`🎮 Found ${recommendations.length} recommended games`);
        break;
      }
    }
  }

  // Fallback: scan for game links if no dedicated section found
  if (recommendations.length === 0) {
    console.log(
      '🔍 No recommendations section found, trying fallback approach...',
    );

    const pageText = $.text().toLowerCase();
    if (
      pageText.includes('also liked') ||
      pageText.includes('similar') ||
      pageText.includes('recommend')
    ) {
      $('a[href*="/game/"], a[href*="/insight/game/"]').each(
        (index, element) => {
          if (recommendations.length >= 5) return false;

          const gameLink = $(element);
          const href = gameLink.attr('href');
          let rawName =
            gameLink.text().trim() ||
            gameLink.find('img').attr('alt') ||
            gameLink.attr('title');

          if (href && rawName && href !== currentGameUrl) {
            const gameName = cleanGameName(rawName);
            const fullUrl = href.startsWith('http')
              ? href
              : `https://playtracker.net${href}`;

            // Avoid duplicates
            if (!recommendations.some((g) => g.name === gameName)) {
              recommendations.push({
                name: gameName,
                url: fullUrl,
              });
            }
          }
        },
      );
    }
  }

  return recommendations;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get('q');

    if (!gameName) {
      return NextResponse.json(
        { error: 'Game name query parameter "q" is required' },
        { status: 400 },
      );
    }

    console.log(`🎮 Searching playtracker.net for: ${gameName}`);

    // Step 1: Search for the game
    const searchUrl = `https://playtracker.net/search/?q=${encodeURIComponent(gameName)}`;
    const searchHtml = await fetchWithBrowserHeaders(searchUrl);
    const searchDoc = cheerio.load(searchHtml);

    // Step 2: Find the first game result
    const gameUrl = findFirstGameUrl(searchDoc);

    if (!gameUrl) {
      console.log(`❌ No game found for: ${gameName}`);
      return NextResponse.json({
        gameName,
        averagePlaytime: null,
        url: null,
        playersAlsoLiked: [],
        message: 'No game found in search results',
      });
    }

    console.log(`🔗 Found game URL: ${gameUrl}`);

    // Step 3: Fetch the game page
    const gameHtml = await fetchWithBrowserHeaders(gameUrl);
    const gameDoc = cheerio.load(gameHtml);

    // Step 4: Extract average playtime data
    const averagePlaytime = extractPlaytime(gameDoc);

    // Step 5: Extract "Players also liked" recommendations
    const playersAlsoLiked = extractRecommendations(gameDoc, gameUrl);

    const result: PlaytimeData = {
      gameName,
      averagePlaytime,
      url: gameUrl,
      playersAlsoLiked,
    };

    console.log(`✅ Playtracker result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Playtracker API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch playtime data from playtracker.net',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
