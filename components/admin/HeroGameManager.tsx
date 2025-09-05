'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  RotateCcw,
  Star,
} from 'lucide-react';
import {
  useAdmin,
  HeroGameResult,
  searchAndProcessGameById,
  validateIgdbId,
} from './AdminContext';

export const HeroGameManager = () => {
  const { gameService } = useAdmin();

  // Form states
  const [heroIgdbId, setHeroIgdbId] = useState('');
  const [heroSearchResult, setHeroSearchResult] =
    useState<HeroGameResult | null>(null);

  // Loading states
  const [isSearchingHeroById, setIsSearchingHeroById] = useState(false);
  const [isAddingHeroById, setIsAddingHeroById] = useState(false);

  // Handle search by IGDB ID for hero games
  const handleSearchHeroById = useCallback(async () => {
    if (!validateIgdbId(heroIgdbId)) {
      toast.error('Please enter a valid IGDB ID');
      return;
    }

    setIsSearchingHeroById(true);
    setHeroSearchResult(null);

    try {
      const id = Number(heroIgdbId);
      const gameInfo = await searchAndProcessGameById(gameService, id, {
        checkHeroGames: true,
      });

      const result: HeroGameResult = {
        name: gameInfo.name,
        igdbId: gameInfo.igdbId,
        existsInDb: gameInfo.existsInDb,
        existsInHeroGames: gameInfo.existsInHeroGames,
        isInSteam: gameInfo.isInSteam,
        igdbData: gameInfo.igdbData,
        status: 'pending',
      };

      setHeroSearchResult(result);

      if (gameInfo.existsInHeroGames) {
        toast.info(`Game "${result.name}" is already a hero game`);
      } else if (gameInfo.existsInDb) {
        toast.success(
          `Found game: "${result.name}" (ready to add to hero games)`,
        );
      } else {
        toast.success(
          `Found game: "${result.name}" (will be added to database first)`,
        );
      }
    } catch (error) {
      console.error('Hero game ID search failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setHeroSearchResult({
        name: `Game ID ${heroIgdbId}`,
        igdbId: Number(heroIgdbId),
        existsInDb: false,
        existsInHeroGames: false,
        isInSteam: false,
        error: errorMessage,
        status: 'pending',
      });

      toast.error(`Failed to find game: ${errorMessage}`);
    } finally {
      setIsSearchingHeroById(false);
    }
  }, [heroIgdbId, gameService]);

  // Handle add single game to hero games by ID
  const handleAddHeroById = useCallback(async () => {
    if (
      !heroSearchResult ||
      heroSearchResult.error ||
      heroSearchResult.existsInHeroGames
    ) {
      return;
    }

    setIsAddingHeroById(true);

    try {
      console.log(
        `🚀 Adding hero game: ${heroSearchResult.name} (ID: ${heroSearchResult.igdbId})`,
      );

      if (heroSearchResult.existsInDb) {
        // Game already exists in database, just add to hero_games
        const existingGame = await gameService.checkGameExists(
          heroSearchResult.igdbId,
        );
        if (existingGame) {
          await gameService.addHeroGame(existingGame.id);
        }
      } else {
        // Add to database first, then add to hero_games
        await gameService.addHeroGameByIgdbId(
          heroSearchResult.igdbData,
          heroSearchResult.bannerFile || undefined,
        );
      }

      // Update the result to show it's completed
      setHeroSearchResult((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              existsInHeroGames: true,
              existsInDb: true,
            }
          : null,
      );

      toast.success(
        `Successfully added "${heroSearchResult.name}" as a hero game`,
      );
    } catch (error) {
      console.error('Failed to add hero game:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setHeroSearchResult((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              errorMessage,
            }
          : null,
      );

      toast.error(`Failed to add hero game: ${errorMessage}`);
    } finally {
      setIsAddingHeroById(false);
    }
  }, [heroSearchResult, gameService]);

  // Handle banner upload for hero game
  const handleHeroBannerUpload = useCallback((file: File | null) => {
    setHeroSearchResult((prev) =>
      prev ? { ...prev, bannerFile: file } : null,
    );
  }, []);

  // Handle retry hero game
  const handleRetryHeroGame = useCallback(async () => {
    if (
      !heroSearchResult ||
      heroSearchResult.error ||
      heroSearchResult.existsInHeroGames
    ) {
      return;
    }

    // Reset status and try again
    setHeroSearchResult((prev) =>
      prev ? { ...prev, status: 'processing', errorMessage: undefined } : null,
    );

    try {
      console.log(`🔄 Retrying hero game: ${heroSearchResult.name}`);

      if (heroSearchResult.existsInDb) {
        // Game already exists in database, just add to hero_games
        const existingGame = await gameService.checkGameExists(
          heroSearchResult.igdbId,
        );
        if (existingGame) {
          await gameService.addHeroGame(existingGame.id);
        }
      } else {
        // Add to database first, then add to hero_games
        await gameService.addHeroGameByIgdbId(
          heroSearchResult.igdbData,
          heroSearchResult.bannerFile || undefined,
        );
      }

      setHeroSearchResult((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              existsInHeroGames: true,
              existsInDb: true,
            }
          : null,
      );

      toast.success(
        `Successfully added "${heroSearchResult.name}" as hero game`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setHeroSearchResult((prev) =>
        prev ? { ...prev, status: 'failed', errorMessage } : null,
      );

      toast.error(
        `Failed to retry "${heroSearchResult.name}": ${errorMessage}`,
      );
    }
  }, [heroSearchResult, gameService]);

  const canAddHeroGame =
    heroSearchResult &&
    !heroSearchResult.error &&
    !heroSearchResult.existsInHeroGames;
  const heroGameDisabled =
    heroSearchResult?.existsInHeroGames ||
    !!heroSearchResult?.error ||
    isAddingHeroById ||
    heroSearchResult?.status === 'processing';

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Star className="h-5 w-5 text-yellow-400" />
        Hero Game Manager
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Add games to the homepage hero carousel. Hero games appear prominently
        on the main page.
      </p>

      {/* Search Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">IGDB ID:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={heroIgdbId}
              onChange={(e) => setHeroIgdbId(e.target.value)}
              placeholder="Enter IGDB game ID for hero game..."
              className="flex-1 rounded-md border border-zinc-600 bg-zinc-800 p-3 text-white placeholder-zinc-400"
            />
            <Button
              onClick={handleSearchHeroById}
              disabled={isSearchingHeroById}
              variant="outline"
            >
              {isSearchingHeroById ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Game Search Result */}
      {heroSearchResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Hero Game Candidate</h3>

          <div className="rounded-lg border border-zinc-600 bg-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-lg font-medium">
                    {heroSearchResult.name}
                  </h4>
                  {heroSearchResult.isInSteam && (
                    <Badge variant="secondary" className="text-xs">
                      Steam
                    </Badge>
                  )}
                  {heroSearchResult.existsInDb && (
                    <Badge variant="outline" className="text-xs">
                      In DB
                    </Badge>
                  )}
                  {heroSearchResult.existsInHeroGames && (
                    <Badge className="bg-yellow-600 text-xs hover:bg-yellow-700">
                      Hero Game
                    </Badge>
                  )}

                  {/* Status Icons */}
                  {heroSearchResult.status === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  )}
                  {heroSearchResult.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {heroSearchResult.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>

                <p className="mb-2 text-sm text-zinc-400">
                  IGDB ID: {heroSearchResult.igdbId}
                </p>

                {heroSearchResult.error && (
                  <p className="mb-2 text-sm text-red-400">
                    Error: {heroSearchResult.error}
                  </p>
                )}

                {heroSearchResult.errorMessage && (
                  <p className="mb-2 text-sm text-red-400">
                    Failed: {heroSearchResult.errorMessage}
                  </p>
                )}

                {heroSearchResult.existsInHeroGames && (
                  <p className="text-sm text-yellow-400">
                    ⭐ Game is already a hero game
                  </p>
                )}

                {!heroSearchResult.existsInDb && !heroSearchResult.error && (
                  <p className="text-sm text-blue-400">
                    ℹ️ Game will be added to database first, then set as hero
                    game
                  </p>
                )}

                {heroSearchResult.existsInDb &&
                  !heroSearchResult.existsInHeroGames &&
                  !heroSearchResult.error && (
                    <p className="text-sm text-green-400">
                      ✅ Ready to add as hero game
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-2">
                {/* Banner Upload */}
                {canAddHeroGame && (
                  <FileUpload
                    onFileSelect={handleHeroBannerUpload}
                    label="Hero Banner"
                    className="w-40"
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={5 * 1024 * 1024}
                    preview={true}
                  />
                )}

                {/* Retry Button */}
                {heroSearchResult.status === 'failed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetryHeroGame}
                    disabled={isAddingHeroById}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Retry
                  </Button>
                )}

                {/* Add Button */}
                {canAddHeroGame && heroSearchResult.status !== 'completed' && (
                  <Button
                    onClick={handleAddHeroById}
                    disabled={heroGameDisabled}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isAddingHeroById ||
                    heroSearchResult.status === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Add as Hero Game
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Game Details */}
            {heroSearchResult.igdbData && !heroSearchResult.error && (
              <div className="mt-4 border-t border-zinc-700 pt-4">
                <h5 className="mb-2 text-sm font-medium">Game Details:</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {heroSearchResult.igdbData.summary && (
                    <div className="col-span-2">
                      <span className="font-medium text-zinc-300">
                        Summary:
                      </span>
                      <p className="mt-1 line-clamp-3 text-zinc-400">
                        {heroSearchResult.igdbData.summary}
                      </p>
                    </div>
                  )}

                  {heroSearchResult.igdbData.first_release_date && (
                    <div>
                      <span className="font-medium text-zinc-300">
                        Release Date:
                      </span>
                      <p className="text-zinc-400">
                        {new Date(
                          heroSearchResult.igdbData.first_release_date * 1000,
                        ).getFullYear()}
                      </p>
                    </div>
                  )}

                  {heroSearchResult.igdbData.total_rating && (
                    <div>
                      <span className="font-medium text-zinc-300">
                        IGDB Rating:
                      </span>
                      <p className="text-zinc-400">
                        {Math.round(heroSearchResult.igdbData.total_rating)}/100
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
