'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skull, Search, Calendar, AlertTriangle, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

// Types for dead game form
interface DeadGameForm {
  igdbId: string;
  deadDate: string;
  deadStatus: 'Shutdown' | 'Abandoned';
  userReactionCount: string;
}

// Type for IGDB game data (simplified)
interface IgdbGameData {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  summary?: string;
}

const DeadGameAdd: React.FC = () => {
  const [form, setForm] = useState<DeadGameForm>({
    igdbId: '',
    deadDate: '',
    deadStatus: 'Shutdown',
    userReactionCount: '0',
  });

  const [searchedGame, setSearchedGame] = useState<IgdbGameData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof DeadGameForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchGame = async () => {
    if (!form.igdbId.trim()) {
      toast.error('Please enter an IGDB ID');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/igdb/games/${form.igdbId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch game');
      }

      setSearchedGame(data);
      toast.success(`Found game: ${data.name}`);
    } catch (error) {
      console.error('Error searching game:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to search game',
      );
      setSearchedGame(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchedGame) {
      toast.error('Please search and select a game first');
      return;
    }

    if (!form.deadDate) {
      toast.error('Please enter the dead date');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the dead game entry
      const response = await fetch('/api/dead-games/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          igdbGameData: searchedGame,
          deadDate: form.deadDate,
          deadStatus: form.deadStatus,
          userReactionCount: parseInt(form.userReactionCount) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add dead game');
      }

      toast.success(
        `Successfully added ${searchedGame.name} to Game Graveyard`,
      );

      // Reset form
      setForm({
        igdbId: '',
        deadDate: '',
        deadStatus: 'Shutdown',
        userReactionCount: '0',
      });
      setSearchedGame(null);
    } catch (error) {
      console.error('Error adding dead game:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add dead game',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      igdbId: '',
      deadDate: '',
      deadStatus: 'Shutdown',
      userReactionCount: '0',
    });
    setSearchedGame(null);
  };

  return (
    <div className="space-y-6">
      {/* Game Search Section */}
      <Card className="border-zinc-700 bg-zinc-900/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Search Game</h3>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter IGDB ID (e.g., 1942)"
              value={form.igdbId}
              onChange={(e) => handleInputChange('igdbId', e.target.value)}
              type="number"
              className="border-zinc-600 bg-zinc-800"
            />
          </div>
          <Button
            onClick={handleSearchGame}
            disabled={isSearching || !form.igdbId.trim()}
            className="px-6"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Game Preview */}
        {searchedGame && (
          <div className="mt-4 rounded-lg border border-zinc-600 bg-zinc-800/50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {searchedGame.cover?.url ? (
                  <img
                    src={searchedGame.cover.url.replace(
                      't_thumb',
                      't_cover_small',
                    )}
                    alt={searchedGame.name}
                    className="h-20 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-16 items-center justify-center rounded bg-zinc-700">
                    <Gamepad2 className="h-6 w-6 text-zinc-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">
                  {searchedGame.name}
                </h4>
                {searchedGame.first_release_date && (
                  <p className="text-sm text-zinc-400">
                    Released:{' '}
                    {new Date(
                      searchedGame.first_release_date * 1000,
                    ).getFullYear()}
                  </p>
                )}
                {searchedGame.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {searchedGame.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dead Game Information Form */}
      <Card className="border-zinc-700 bg-zinc-900/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Skull className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-semibold">Dead Game Information</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dead Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              <Calendar className="mr-1 inline h-4 w-4" />
              Dead Date *
            </label>
            <Input
              type="date"
              value={form.deadDate}
              onChange={(e) => handleInputChange('deadDate', e.target.value)}
              required
              className="border-zinc-600 bg-zinc-800"
            />
          </div>

          {/* Dead Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              Status *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deadStatus"
                  value="Shutdown"
                  checked={form.deadStatus === 'Shutdown'}
                  onChange={(e) =>
                    handleInputChange(
                      'deadStatus',
                      e.target.value as 'Shutdown' | 'Abandoned',
                    )
                  }
                  className="mr-2"
                />
                <span className="text-red-300">Shutdown</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deadStatus"
                  value="Abandoned"
                  checked={form.deadStatus === 'Abandoned'}
                  onChange={(e) =>
                    handleInputChange(
                      'deadStatus',
                      e.target.value as 'Shutdown' | 'Abandoned',
                    )
                  }
                  className="mr-2"
                />
                <span className="text-orange-300">Abandoned</span>
              </label>
            </div>
          </div>

          {/* Initial Reaction Count */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Initial Reaction Count (optional)
            </label>
            <Input
              type="number"
              min="0"
              value={form.userReactionCount}
              onChange={(e) =>
                handleInputChange('userReactionCount', e.target.value)
              }
              placeholder="0"
              className="border-zinc-600 bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Starting number of user reactions (defaults to 0)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!searchedGame || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting
                ? 'Adding to Graveyard...'
                : 'Add to Game Graveyard'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DeadGameAdd;
