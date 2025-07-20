'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// TODO: Only allow admin users to access this page

// Type for game data to insert/update
interface GameDbData {
  igdb_id: number;
  name: string;
  storyline?: string;
  summary?: string;
  slug?: string;
  first_release_date?: string | null;
  igdb_update_date?: string | null;
  total_rating?: number;
  total_rating_count?: number;
  genre?: string[] | null;
  platforms?: string[] | null;
  involved_companies?: string[] | null;
  game_engines?: string[] | null;
  game_modes?: string[] | null;
  cover_url?: string | null;
  screenshots?: string[] | null;
  artworks?: string[] | null;
  videos?: string[] | null;
  updated_at?: string;
  publishers?: string[] | null;
  developers?: string[] | null;
}

type ClerkSession = ReturnType<typeof useSession>['session'];

export function createClerkSupabaseClient(session: ClerkSession) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // session will be typed, so you get autocomplete on getToken()
          const clerkToken = await session?.getToken({ template: 'supabase' });
          const headers = new Headers(options?.headers);
          headers.set('Authorization', `Bearer ${clerkToken}`);
          return fetch(url, { ...options, headers });
        },
      },
    },
  );
}

export default function AddGamePage() {
  const [igdbId, setIgdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isLoaded, isSignedIn, session } = useSession();

  // Redirect if not signed in (side effect)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  const supabase = useMemo(() => createClerkSupabaseClient(session), [session]);

  // Handles form submission for adding/updating a game
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!igdbId) {
        toast.error('Please enter an IGDB game ID');
        return;
      }
      setLoading(true);
      try {
        // Fetch IGDB game data from local API
        const res = await fetch(`/api/igdb/games/${igdbId}`);
        if (!res.ok) {
          toast.error('Failed to fetch game data');
          setLoading(false);
          return;
        }
        const data = await res.json();

        // Prepare data for Supabase
        const dbData: GameDbData = {
          igdb_id: data.id,
          name: data.name,
          storyline: data.storyline,
          summary: data.summary,
          slug: data.slug,
          first_release_date: data.first_release_date
            ? new Date(data.first_release_date * 1000).toISOString()
            : null,
          igdb_update_date: data.updated_at
            ? new Date(data.updated_at * 1000).toISOString()
            : null,
          total_rating: data.total_rating,
          total_rating_count: data.total_rating_count,
          genre: data.genres
            ? data.genres.map((g: { name: string }) => g.name)
            : null,
          platforms: data.platforms
            ? data.platforms.map((p: { name: string }) => p.name)
            : null,
          game_engines: data.game_engines
            ? data.game_engines.map((e: { name: string }) => e.name)
            : null,
          game_modes: data.game_modes
            ? data.game_modes.map((m: { name: string }) => m.name)
            : null,
          cover_url: data.cover?.url || null,
          screenshots: data.screenshots
            ? data.screenshots.map((s: { url: string }) => s.url)
            : null,
          artworks: data.artworks
            ? data.artworks.map((a: { url: string }) => a.url)
            : null,
          videos: data.videos
            ? data.videos.map((v: { video_id: string }) => v.video_id)
            : null,
          updated_at: new Date().toISOString(),
          publishers: data.involved_companies
            ? data.involved_companies
                .filter((c: any) => c.publisher)
                .map((c: any) => c.company?.name || '')
            : null,
          developers: data.involved_companies
            ? data.involved_companies
                .filter((c: any) => c.developer)
                .map((c: any) => c.company?.name || '')
            : null,
        };

        // Check if the game already exists
        const { data: exist, error: existError } = await supabase
          .from('games')
          .select('id')
          .eq('igdb_id', data.id)
          .maybeSingle();

        if (existError) {
          toast.error(existError.message || 'Failed to check if game exists');
          setLoading(false);
          return;
        }

        let dbRes;
        if (exist) {
          // Update
          dbRes = await supabase
            .from('games')
            .update(dbData)
            .eq('igdb_id', data.id);
        } else {
          // Insert
          dbRes = await supabase.from('games').insert([dbData]);
        }
        if (dbRes.error)
          throw new Error(dbRes.error.message || 'Supabase error');
        toast.success('Game data added/updated successfully!');
        setIgdbId('');
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          toast.error(err.message || 'Operation failed');
        } else if (typeof err === 'string') {
          toast.error(err);
        } else {
          toast.error('Operation failed');
        }
      } finally {
        setLoading(false);
      }
    },
    [igdbId, supabase],
  );

  if (isLoaded && !isSignedIn) {
    return null;
  }

  return (
    <div className="bg-card mx-auto mt-10 max-w-md rounded-lg p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Add IGDB Game</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          placeholder="Enter IGDB game ID"
          aria-label="IGDB game ID"
          value={igdbId}
          onChange={(e) => setIgdbId(e.target.value)}
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          aria-label="Add or update game"
        >
          {loading ? 'Submitting...' : 'Add/Update Game'}
        </Button>
      </form>
    </div>
  );
}
