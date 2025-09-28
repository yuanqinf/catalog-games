// lib/igdb/client.ts
import type { IgdbToken, IgdbGame } from '@/types';

interface TwitchStream {
  viewer_count?: number;
}

class IgdbClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private tokenRequest: Promise<string> | null = null;

  constructor() {
    this.clientId = process.env.IGDB_CLIENT_ID!;
    this.clientSecret = process.env.IGDB_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in environment variables.',
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (this.tokenRequest) {
      return this.tokenRequest;
    }

    this.tokenRequest = (async () => {
      try {
        const res = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials',
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to get IGDB access token: ${res.status} ${res.statusText} - ${errorText}`,
          );
        }

        const data: IgdbToken = await res.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000; // refresh 1min early
        return this.accessToken;
      } finally {
        this.tokenRequest = null;
      }
    })();

    return this.tokenRequest;
  }

  public async searchGames(query: string): Promise<IgdbGame[]> {
    const token = await this.getAccessToken();

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${query}";
        fields id, name, aggregated_rating_count, slug, game_type, cover.url, screenshots.url, artworks.url, videos, summary, first_release_date, involved_companies.company.name;
        where game_type = (0,1) & aggregated_rating_count > 0;
        limit 10;
      `,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `IGDB games search request failed: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const games: IgdbGame[] = await res.json();

    // Filter out special editions, deluxe editions, GOTY, etc.
    const filteredGames = games.filter((game) => {
      const name = game.name.toLowerCase();
      const excludePatterns = [
        'deluxe edition',
        'deluxe',
        'goty',
        'game of the year',
        "collector's edition",
        'collector edition',
        'premium edition',
        'ultimate edition',
        'enhanced edition',
        'definitive edition',
        'complete edition',
        'gold edition',
        'legendary edition',
        'special edition',
        'limited edition',
        "director's cut",
        'remastered',
        'hd edition',
        'anniversary edition',
      ];

      return !excludePatterns.some((pattern) => name.includes(pattern));
    });

    return filteredGames.map((game) => {
      if (game.cover && typeof game.cover === 'object' && 'url' in game.cover) {
        game.cover.url = `https:${game.cover.url}`.replace(
          '/t_thumb/',
          '/t_1080p/',
        );
        (game as any).cover_url = game.cover.url;
      }
      if (game.screenshots) {
        game.screenshots = game.screenshots.map((screenshot) => ({
          ...screenshot,
          url: `https:${screenshot.url}`.replace('/t_thumb/', '/t_1080p/'),
        }));
      }
      if (game.artworks) {
        game.artworks = game.artworks.map((artwork) => ({
          ...artwork,
          url: `https:${artwork.url}`.replace('/t_thumb/', '/t_1080p/'),
        }));
      }

      return game;
    });
  }

  public async getGameById(id: number): Promise<IgdbGame | null> {
    const token = await this.getAccessToken();

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        fields id, name, summary, slug, first_release_date, updated_at, total_rating,
        genres.name, platforms.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, game_engines.name, game_modes.name,
        cover.url, screenshots.url, artworks.url, videos.video_id, rating;
        where id = ${id};
        limit 1;
      `,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `IGDB game request failed: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data: IgdbGame[] = await res.json();
    const game = data[0] || null;

    if (game) {
      if (game.cover && typeof game.cover === 'object' && 'url' in game.cover) {
        game.cover.url = `https:${game.cover.url}`.replace(
          '/t_thumb/',
          '/t_1080p/',
        );
      }
      if (game.screenshots) {
        game.screenshots = game.screenshots.map((screenshot) => ({
          ...screenshot,
          url: `https:${screenshot.url}`.replace('/t_thumb/', '/t_1080p/'),
        }));
      }
      if (game.artworks) {
        game.artworks = game.artworks.map((artwork) => ({
          ...artwork,
          url: `https:${artwork.url}`.replace('/t_thumb/', '/t_1080p/'),
        }));
      }
    }

    return game;
  }

  public async getTwitchGameIdByName(gameName: string): Promise<string | null> {
    const token = await this.getAccessToken();

    const url = new URL('https://api.twitch.tv/helix/games');
    url.searchParams.set('name', gameName);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error(`Twitch Games API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return null;
    }

    // Return the first game's ID
    return data.data[0].id;
  }

  public async getGameViewersFromTwitchByGameId(
    gameId: string,
  ): Promise<number> {
    const token = await this.getAccessToken();

    const allStreams: TwitchStream[] = [];
    let cursor: string | undefined;
    const maxRequests = 5; // Get 500 streams total (100 per request)

    // Make multiple API calls to get more streams
    for (let i = 0; i < maxRequests; i++) {
      const url = new URL('https://api.twitch.tv/helix/streams');
      url.searchParams.set('game_id', gameId);
      url.searchParams.set('first', '100');

      if (cursor) {
        url.searchParams.set('after', cursor);
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(`Twitch API error: ${res.status} ${res.statusText}`);
        break; // Stop on error but return what we have so far
      }

      const data = await res.json();

      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        break; // No more data available
      }

      allStreams.push(...data.data);

      // Get cursor for next page
      cursor = data.pagination?.cursor;

      // If no cursor, we've reached the end
      if (!cursor) {
        break;
      }
    }

    if (allStreams.length === 0) {
      return 0;
    }

    // Sum up all viewers from all live streams to get total live viewers
    const totalLiveViewers = allStreams.reduce(
      (sum: number, stream: TwitchStream) => {
        return sum + (stream.viewer_count || 0);
      },
      0,
    );

    return totalLiveViewers;
  }
}

export const igdbClient = new IgdbClient();
