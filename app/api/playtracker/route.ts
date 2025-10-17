import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { cacheHeaders } from '@/lib/api/cache-headers';

interface PlaytimeData {
  gameName: string;
  averagePlaytime: string | null;
  url: string | null;
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
        message: 'No game found in search results',
      });
    }

    console.log(`🔗 Found game URL: ${gameUrl}`);

    // Step 3: Fetch the game page
    const gameHtml = await fetchWithBrowserHeaders(gameUrl);
    const gameDoc = cheerio.load(gameHtml);

    // Step 4: Extract average playtime data
    const averagePlaytime = extractPlaytime(gameDoc);

    const result: PlaytimeData = {
      gameName,
      averagePlaytime,
      url: gameUrl,
    };

    console.log(`✅ Playtracker result:`, result);

    return NextResponse.json(result, {
      headers: cacheHeaders.external(), // Playtime data changes slowly, cache for 24h
    });
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
