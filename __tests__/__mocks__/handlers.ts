import { http, HttpResponse } from 'msw';

const BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

export const handlers = [
  // Search API
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return HttpResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      games: [
        {
          id: 1,
          igdb_id: 1001,
          name: 'Test Game',
          slug: 'test-game',
          cover_url: 'https://example.com/cover.jpg',
          developers: ['Test Developer'],
        },
      ],
    });
  }),

  // User dislikes API
  http.get('/api/users/dislikes', ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'count';

    if (mode === 'count') {
      return HttpResponse.json({ count: 5 });
    }

    if (mode === 'ids') {
      return HttpResponse.json({ igdb_ids: [1001, 1002, 1003] });
    }

    return HttpResponse.json({
      games: [
        {
          igdb_id: 1001,
          name: 'Disliked Game',
          slug: 'disliked-game',
          cover_url: 'https://example.com/cover.jpg',
          dislike_count: 100,
        },
      ],
    });
  }),

  // Games rating API
  http.post('/api/games/rating', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, rating: body });
  }),

  // Dead games reaction API
  http.post('/api/dead-games/react', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      dead_game_id: (body as { dead_game_id?: string }).dead_game_id,
      incrementBy: (body as { incrementBy?: number }).incrementBy || 1,
    });
  }),

  // Games emoji reaction API
  http.post('/api/games/update-emoji-reaction', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      emoji: (body as { emoji?: string }).emoji,
      game_id: (body as { game_id?: number }).game_id,
    });
  }),

  // Supabase mock endpoints
  http.get(`${BASE_URL}/rest/v1/games`, () => {
    return HttpResponse.json([
      {
        id: 1,
        igdb_id: 1001,
        name: 'Test Game',
        slug: 'test-game',
        cover_url: 'https://example.com/cover.jpg',
        dislike_count: 50,
      },
    ]);
  }),

  http.post(`${BASE_URL}/rest/v1/rpc/increment_dislike`, () => {
    return HttpResponse.json({ success: true });
  }),
];
