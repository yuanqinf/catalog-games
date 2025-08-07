import * as cheerio from 'cheerio';

export interface VGChartzData {
  url: string;
  shippedUnits: number | null;
  asOfDate: string | null;
}

export interface VGChartzResponse {
  success: boolean;
  data: VGChartzData;
  metadata: {
    source: string;
    fetchedAt: string;
    slug: string;
  };
}

class VGChartzClient {
  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    if (!html || html.length < 100) {
      throw new Error('Empty or invalid response');
    }

    return html;
  }

  private async findGameUrlFromSlug(slug: string): Promise<string | null> {
    try {
      const query = slug.replace(/-/g, '+');
      const searchUrl = `https://www.vgchartz.com/gamedb/games.php?name=${query}`;
      const html = await this.fetchHtml(searchUrl);
      const $ = cheerio.load(html);

      const rows = $('table tr[style^="background-image"]');
      const firstRow = rows.first();
      const relativeLink = firstRow.find('td a').attr('href');

      if (!relativeLink || !relativeLink.includes('/games/')) {
        return null;
      }

      return `https://www.vgchartz.com${relativeLink}`;
    } catch (error) {
      console.error('Failed to find game URL:', error);
      return null;
    }
  }

  private parseSalesText(salesText: string) {
    const numberMatch = salesText.match(/([\d,]+)\s*Units/i);
    const dateMatch = salesText.match(
      /As of:\s*([A-Za-z]+\s+\d{1,2}(st|nd|rd|th)?,\s+\d{4})/i,
    );

    const shippedUnits = numberMatch
      ? parseInt(numberMatch[1].replace(/,/g, ''))
      : null;

    const asOfDate = dateMatch
      ? new Date(dateMatch[1].replace(/(st|nd|rd|th)/, ''))
          .toISOString()
          .split('T')[0]
      : null;

    return { shippedUnits, asOfDate };
  }

  private async parseGameDetails(url: string): Promise<VGChartzData> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const salesText = $('#gameSalesBox').text().trim();
    const { shippedUnits, asOfDate } = this.parseSalesText(salesText);

    return {
      url,
      shippedUnits,
      asOfDate,
    };
  }

  async getGameBySlug(slug: string): Promise<VGChartzResponse | null> {
    try {
      if (!slug || slug.length < 2 || slug.length > 100) {
        throw new Error('Invalid slug length');
      }

      const gameUrl = await this.findGameUrlFromSlug(slug);

      if (!gameUrl) {
        return null;
      }

      const data = await this.parseGameDetails(gameUrl);

      // Validate that we got meaningful data
      if (!data.shippedUnits || data.shippedUnits === 0) {
        return null;
      }

      return {
        success: true,
        data,
        metadata: {
          source: 'VGChartz',
          fetchedAt: new Date().toISOString(),
          slug,
        },
      };
    } catch (error) {
      console.error('VGChartz client error:', error);
      return null;
    }
  }
}

export const vgchartzClient = new VGChartzClient();
