'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GameService, type IgdbGameData } from '@/lib/supabase/client';

// TODO: Only allow admin users to access this page

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

  const gameService = useMemo(() => new GameService(session), [session]);

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
        const data: IgdbGameData = await res.json();

        // Use GameService to add or update the game
        await gameService.addOrUpdateGame(data);
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
    [igdbId, gameService],
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
