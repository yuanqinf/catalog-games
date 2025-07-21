// lib/igdb/client.ts
import type { IgdbToken, IgdbGame } from '@/types';

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
        fields id, name, slug;
        where first_release_date != null;
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

    return games.map((game) => {
      if (game.cover?.url) {
        return {
          ...game,
          cover: {
            ...game.cover,
            url: `https:${game.cover.url}`.replace(
              '/t_thumb/',
              '/t_cover_big/',
            ),
          },
        };
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
        fields id, name, storyline, summary, slug, first_release_date, updated_at, total_rating, total_rating_count,
        
        genres.name, platforms.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, game_engines.name, game_modes.name,

        cover.url, screenshots.url, artworks.url, videos.video_id;

        where id = ${id};
        limit 10;
      `,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `IGDB game request failed: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data: IgdbGame[] = await res.json();
    const game = data[0] ?? null;

    if (game) {
      if (game.cover?.url) {
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
}

export const igdbClient = new IgdbClient();
