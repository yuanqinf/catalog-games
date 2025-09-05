'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  RotateCcw,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAdmin, UpcomingGameResult } from './AdminContext';

// Helper function for finding best match
const findBestMatch = (
  results: any[],
  originalName: string,
  searchQuery: string,
) => {
  const normalizeTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/['']/g, "'") // Normalize apostrophes
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const normalizedOriginal = normalizeTitle(originalName);
  const normalizedSearch = normalizeTitle(searchQuery);

  // Try different matching strategies
  for (const result of results) {
    if (!result.igdbData?.name) continue;

    const resultName = result.igdbData.name;
    const normalizedResult = normalizeTitle(resultName);

    // 1. Exact match with original name
    if (normalizedResult === normalizedOriginal) {
      return result;
    }

    // 2. Exact match with search query
    if (normalizedResult === normalizedSearch) {
      return result;
    }

    // 3. Contains match (for series/sequels)
    if (
      normalizedResult.includes(normalizedOriginal) ||
      normalizedOriginal.includes(normalizedResult)
    ) {
      return result;
    }

    // 4. Word-based match (at least 2 words in common)
    const originalWords = normalizedOriginal
      .split(' ')
      .filter((w) => w.length > 2);
    const resultWords = normalizedResult.split(' ').filter((w) => w.length > 2);
    const commonWords = originalWords.filter((word) =>
      resultWords.includes(word),
    );

    if (
      commonWords.length >= 2 &&
      commonWords.length >= originalWords.length * 0.6
    ) {
      return result;
    }
  }

  return null;
};

export const UpcomingGamesManager = () => {
  const { gameService } = useAdmin();

  // State
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGameResult[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [upcomingBatchProcessing, setUpcomingBatchProcessing] = useState(false);

  // Handle loading upcoming games from OpenCritic
  const handleLoadUpcomingGames = useCallback(async () => {
    setIsLoadingUpcoming(true);
    setUpcomingGames([]);

    try {
      console.log('🔍 Loading upcoming games from OpenCritic...');

      // Fetch upcoming games from OpenCritic API
      const upcomingResponse = await fetch('/api/openCritic/upcoming');
      if (!upcomingResponse.ok) {
        throw new Error('Failed to fetch upcoming games');
      }
      const upcomingData = await upcomingResponse.json();

      if (!upcomingData.success || !Array.isArray(upcomingData.data)) {
        throw new Error('Invalid response from OpenCritic API');
      }

      console.log(
        `📦 Found ${upcomingData.data.length} upcoming games from OpenCritic`,
      );

      // Process each upcoming game
      const results: UpcomingGameResult[] = [];

      for (const upcomingGame of upcomingData.data) {
        try {
          const gameName = upcomingGame.name;
          console.log(`🎮 Processing: ${gameName}`);

          // Search for this game in IGDB with multiple search strategies
          let igdbResponse;
          let searchQueries = [
            gameName, // Original name
            gameName.replace(/\s*\d+$/, '').trim(), // Remove trailing numbers (e.g., "Game 4" -> "Game")
            gameName.split(':')[0].trim(), // Remove subtitle (e.g., "Game: Subtitle" -> "Game")
            gameName
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(), // Clean special chars
          ];

          // Remove duplicates and empty strings
          searchQueries = [...new Set(searchQueries)].filter(
            (q) => q.length > 0,
          );

          console.log(
            `🔍 Trying ${searchQueries.length} search strategies for: ${gameName}`,
          );

          let igdbMatch = null;
          let existsInDb = false;
          let existsInUpcomingGames = false;
          let bestMatchData = null;

          // Try each search strategy until we find a match
          for (let i = 0; i < searchQueries.length && !igdbMatch; i++) {
            const searchQuery = searchQueries[i];
            console.log(
              `🔍 Search attempt ${i + 1}/${searchQueries.length}: "${searchQuery}"`,
            );

            try {
              igdbResponse = await fetch('/api/igdb/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
              });

              if (igdbResponse.ok) {
                const igdbData = await igdbResponse.json();

                if (igdbData.results && igdbData.results.length > 0) {
                  bestMatchData = igdbData; // Keep the best results so far
                  igdbMatch = findBestMatch(
                    igdbData.results,
                    gameName,
                    searchQuery,
                  );

                  if (igdbMatch) {
                    console.log(
                      `✅ Found match with strategy ${i + 1}: "${igdbMatch.igdbData?.name}"`,
                    );
                    break;
                  }
                }
              }
            } catch (err) {
              console.warn(`Search attempt ${i + 1} failed:`, err);
            }
          }

          // If still no match found after all search attempts, try one final fuzzy match on best data
          if (
            !igdbMatch &&
            bestMatchData &&
            bestMatchData.results &&
            bestMatchData.results.length > 0
          ) {
            console.log(
              `🔍 Final attempt: fuzzy matching on ${bestMatchData.results.length} results`,
            );
            igdbMatch = findBestMatch(
              bestMatchData.results,
              gameName,
              gameName,
            );

            if (igdbMatch) {
              console.log(
                `🎯 Final fuzzy match found: "${gameName}" -> "${igdbMatch.igdbData?.name}"`,
              );
            }
          }

          // Process the match if found
          if (igdbMatch) {
            // Fetch full IGDB data for the matched game
            console.log(
              `🔍 Fetching full IGDB data for: ${gameName} (ID: ${igdbMatch.igdbId})`,
            );
            const igdbFullDataResponse = await fetch(
              `/api/igdb/games/${igdbMatch.igdbId}`,
            );
            if (igdbFullDataResponse.ok) {
              const fullIgdbData = await igdbFullDataResponse.json();
              igdbMatch.igdbData = fullIgdbData; // Replace with full data
              console.log(`✅ Got full IGDB data for: ${gameName}`, {
                has_cover: !!fullIgdbData.cover,
                has_screenshots: !!fullIgdbData.screenshots,
                has_summary: !!fullIgdbData.summary,
                has_updated_at: !!fullIgdbData.updated_at,
              });
            } else {
              console.warn(
                `⚠️ Failed to fetch full IGDB data for: ${gameName}`,
              );
            }

            // Check if game exists in our database
            const existingGame = await gameService.checkGameExists(
              igdbMatch.igdbId,
            );
            existsInDb = !!existingGame;

            // If it exists in games table, check if it's already in upcoming_games
            if (existingGame) {
              const existingUpcomingGame =
                await gameService.checkUpcomingGameExists(existingGame.id);
              existsInUpcomingGames = !!existingUpcomingGame;
            }
          }

          // Create result object
          const result: UpcomingGameResult = {
            name: gameName,
            igdbId: igdbMatch?.igdbId,
            existsInDb,
            existsInUpcomingGames,
            isMatched: !!igdbMatch,
            igdbData: igdbMatch?.igdbData,
            selected: !!igdbMatch,
            highlight: false,
            status: 'pending',
          };

          results.push(result);

          // Enhanced logging with detailed status
          let statusText = '';
          if (existsInUpcomingGames) {
            statusText = '🔵 Already in Upcoming Games';
          } else if (existsInDb && igdbMatch) {
            statusText = '🟢 Found in Database (can add to upcoming)';
          } else if (igdbMatch) {
            statusText = '🟢 IGDB Match Found (new game)';
          } else {
            statusText = '❌ No IGDB Match';
          }

          console.log(
            `${gameName}: ${statusText}${igdbMatch ? ` (IGDB ID: ${igdbMatch.igdbId})` : ''}`,
          );

          // Debug info for failed matches
          if (!igdbMatch) {
            console.log(
              `🔍 Search attempts completed for "${gameName}" - no matches found in ${searchQueries.length} strategies`,
            );
            console.log(`📝 Tried these search queries:`, searchQueries);
            if (bestMatchData && bestMatchData.results) {
              console.log(
                `🎯 Best search results found (${bestMatchData.results.length}):`,
                bestMatchData.results.slice(0, 3).map((r) => ({
                  name: r.igdbData?.name,
                  id: r.igdbId,
                })),
              );
            }
          }
        } catch (error) {
          console.error(`❌ Error processing ${upcomingGame.name}:`, error);
          results.push({
            name: upcomingGame.name,
            existsInDb: false,
            existsInUpcomingGames: false,
            isMatched: false,
            selected: false,
            highlight: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'pending',
          });
        }
      }

      setUpcomingGames(results);

      const matchedCount = results.filter((r) => r.isMatched).length;
      const newCount = results.filter(
        (r) => r.isMatched && !r.existsInUpcomingGames,
      ).length;

      toast.success(
        `Loaded ${results.length} upcoming games. ${matchedCount} matched, ${newCount} new games available.`,
      );
    } catch (error) {
      console.error('Failed to load upcoming games:', error);
      toast.error('Failed to load upcoming games');
    } finally {
      setIsLoadingUpcoming(false);
    }
  }, [gameService]);

  // Handle upcoming game selection
  const handleUpcomingGameSelection = useCallback(
    (index: number, selected: boolean) => {
      setUpcomingGames((prev) =>
        prev.map((game, i) => (i === index ? { ...game, selected } : game)),
      );
    },
    [],
  );

  // Handle upcoming game highlight toggle
  const handleUpcomingGameHighlight = useCallback(
    (index: number, highlight: boolean) => {
      setUpcomingGames((prev) =>
        prev.map((game, i) => (i === index ? { ...game, highlight } : game)),
      );
    },
    [],
  );

  // Handle banner upload for upcoming games
  const handleUpcomingBannerUpload = useCallback(
    (index: number, file: File | null) => {
      setUpcomingGames((prev) =>
        prev.map((game, i) =>
          i === index ? { ...game, bannerFile: file } : game,
        ),
      );
    },
    [],
  );

  // Handle upcoming games batch processing
  const handleUpcomingBatchProcess = useCallback(async () => {
    const selectedGames = upcomingGames.filter(
      (game) => game.selected && game.isMatched,
    );

    if (selectedGames.length === 0) {
      toast.error('No games selected for processing');
      return;
    }

    setUpcomingBatchProcessing(true);

    try {
      console.log(`🚀 Adding ${selectedGames.length} upcoming games...`);

      for (const game of selectedGames) {
        // Update status to processing
        setUpcomingGames((prev) =>
          prev.map((g) =>
            g.name === game.name ? { ...g, status: 'processing' } : g,
          ),
        );

        try {
          if (game.existsInDb && game.igdbId) {
            // Game already exists in database, just add to upcoming_games
            const existingGame = await gameService.checkGameExists(game.igdbId);
            if (existingGame) {
              await gameService.addUpcomingGame(
                existingGame.id,
                game.highlight,
              );
            }
          } else if (game.igdbData && game.igdbId) {
            // Ensure we have full IGDB data before adding
            let fullIgdbData = game.igdbData;

            console.log(`🔍 Verifying IGDB data for: ${game.name}`, {
              has_cover: !!fullIgdbData.cover,
              has_screenshots: !!fullIgdbData.screenshots,
              has_summary: !!fullIgdbData.summary,
              has_updated_at: !!fullIgdbData.updated_at,
            });

            // If the IGDB data looks incomplete, fetch it again
            if (
              !fullIgdbData.cover ||
              !fullIgdbData.screenshots ||
              !fullIgdbData.summary ||
              !fullIgdbData.updated_at
            ) {
              console.log(`🔄 Fetching complete IGDB data for: ${game.name}`);
              const igdbFullDataResponse = await fetch(
                `/api/igdb/games/${game.igdbId}`,
              );
              if (igdbFullDataResponse.ok) {
                fullIgdbData = await igdbFullDataResponse.json();
                console.log(`✅ Updated IGDB data for: ${game.name}`, {
                  has_cover: !!fullIgdbData.cover,
                  has_screenshots: !!fullIgdbData.screenshots,
                  has_summary: !!fullIgdbData.summary,
                  has_updated_at: !!fullIgdbData.updated_at,
                });
              }
            }

            // Add to database first, then to upcoming_games
            console.log(`🚀 Adding ${game.name} to database with full data`);
            await gameService.addUpcomingGameByIgdbId(
              fullIgdbData,
              game.bannerFile || undefined,
              game.highlight,
            );
          }

          // Update status to completed
          setUpcomingGames((prev) =>
            prev.map((g) =>
              g.name === game.name
                ? { ...g, status: 'completed', existsInUpcomingGames: true }
                : g,
            ),
          );

          console.log(`✅ Successfully added: ${game.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          // Update status to failed
          setUpcomingGames((prev) =>
            prev.map((g) =>
              g.name === game.name
                ? { ...g, status: 'failed', errorMessage }
                : g,
            ),
          );

          console.error(`❌ Failed to add ${game.name}:`, error);
        }
      }

      const successCount = upcomingGames.filter(
        (g) => g.status === 'completed',
      ).length;
      toast.success(
        `Successfully added ${successCount}/${selectedGames.length} upcoming games`,
      );
    } catch (error) {
      console.error('Upcoming games batch processing failed:', error);
      toast.error('Failed to process upcoming games');
    } finally {
      setUpcomingBatchProcessing(false);
    }
  }, [upcomingGames, gameService]);

  // Handle retry individual upcoming game
  const handleRetryUpcomingGame = useCallback(
    async (index: number) => {
      const game = upcomingGames[index];
      if (!game.isMatched || !game.igdbId) return;

      // Update status to processing
      setUpcomingGames((prev) =>
        prev.map((g, i) =>
          i === index
            ? { ...g, status: 'processing', errorMessage: undefined }
            : g,
        ),
      );

      try {
        console.log(`🔄 Retrying: ${game.name}`);

        if (game.existsInDb && game.igdbId) {
          // Game already exists in database, just add to upcoming_games
          const existingGame = await gameService.checkGameExists(game.igdbId);
          if (existingGame) {
            // Check if already in upcoming_games
            const existingUpcomingGame =
              await gameService.checkUpcomingGameExists(existingGame.id);
            if (!existingUpcomingGame) {
              await gameService.addUpcomingGame(
                existingGame.id,
                game.highlight,
              );
            }
          }
        } else if (game.igdbData && game.igdbId) {
          // Fetch fresh IGDB data
          console.log(`🔍 Fetching fresh IGDB data for retry: ${game.name}`);
          const igdbFullDataResponse = await fetch(
            `/api/igdb/games/${game.igdbId}`,
          );
          let fullIgdbData = game.igdbData;

          if (igdbFullDataResponse.ok) {
            fullIgdbData = await igdbFullDataResponse.json();
          }

          // Add to database first, then to upcoming_games
          await gameService.addUpcomingGameByIgdbId(
            fullIgdbData,
            game.bannerFile || undefined,
            game.highlight,
          );
        }

        // Update status to completed
        setUpcomingGames((prev) =>
          prev.map((g, i) =>
            i === index
              ? {
                  ...g,
                  status: 'completed',
                  existsInUpcomingGames: true,
                  errorMessage: undefined,
                }
              : g,
          ),
        );

        toast.success(`Successfully added "${game.name}"`);
        console.log(`✅ Retry successful: ${game.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // Update status to failed
        setUpcomingGames((prev) =>
          prev.map((g, i) =>
            i === index ? { ...g, status: 'failed', errorMessage } : g,
          ),
        );

        toast.error(`Failed to retry "${game.name}": ${errorMessage}`);
        console.error(`❌ Retry failed for ${game.name}:`, error);
      }
    },
    [upcomingGames, gameService],
  );

  // Handle reupload game to games table for games already in upcoming_games
  const handleReuploadToGamesTable = useCallback(
    async (index: number) => {
      const game = upcomingGames[index];
      if (!game.isMatched || !game.igdbId || !game.existsInUpcomingGames)
        return;

      // Update status to processing
      setUpcomingGames((prev) =>
        prev.map((g, i) =>
          i === index
            ? { ...g, status: 'processing', errorMessage: undefined }
            : g,
        ),
      );

      try {
        console.log(`🔄 Reuploading to games table: ${game.name}`);

        // Fetch fresh IGDB data
        const igdbFullDataResponse = await fetch(
          `/api/igdb/games/${game.igdbId}`,
        );
        let fullIgdbData = game.igdbData;

        if (igdbFullDataResponse.ok) {
          fullIgdbData = await igdbFullDataResponse.json();
        }

        // Force update the game in the games table (even if it exists)
        await gameService.addOrUpdateGame(
          fullIgdbData,
          game.bannerFile || undefined,
          false, // skipSteamFetch
        );

        // Update status to completed
        setUpcomingGames((prev) =>
          prev.map((g, i) =>
            i === index
              ? {
                  ...g,
                  status: 'completed',
                  existsInDb: true,
                  errorMessage: undefined,
                }
              : g,
          ),
        );

        toast.success(`Successfully reuploaded "${game.name}" to games table`);
        console.log(`✅ Reupload successful: ${game.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // Update status to failed
        setUpcomingGames((prev) =>
          prev.map((g, i) =>
            i === index ? { ...g, status: 'failed', errorMessage } : g,
          ),
        );

        toast.error(`Failed to reupload "${game.name}": ${errorMessage}`);
        console.error(`❌ Reupload failed for ${game.name}:`, error);
      }
    },
    [upcomingGames, gameService],
  );

  const selectedCount = upcomingGames.filter(
    (g) => g.selected && g.isMatched,
  ).length;
  const newGamesCount = upcomingGames.filter(
    (g) => g.isMatched && !g.existsInUpcomingGames,
  ).length;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Calendar className="h-5 w-5 text-blue-400" />
        Upcoming Games Manager
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Load upcoming games from OpenCritic and add them to the database. These
        games will appear in upcoming releases sections.
      </p>

      {/* Load Button */}
      <div className="mb-6">
        <Button
          onClick={handleLoadUpcomingGames}
          disabled={isLoadingUpcoming}
          className="w-full"
        >
          {isLoadingUpcoming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading upcoming games from OpenCritic...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Upcoming Games
            </>
          )}
        </Button>
      </div>

      {/* Upcoming Games Results */}
      {upcomingGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Upcoming Games ({upcomingGames.length})
              </h3>
              <p className="text-sm text-zinc-400">
                {newGamesCount} new games available • {selectedCount} selected
              </p>
            </div>

            <Button
              onClick={handleUpcomingBatchProcess}
              disabled={selectedCount === 0 || upcomingBatchProcessing}
              size="sm"
            >
              {upcomingBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Selected ({selectedCount})
                </>
              )}
            </Button>
          </div>

          {/* Games List */}
          <div className="space-y-2">
            {upcomingGames.map((game, index) => (
              <div
                key={`${game.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-zinc-600 bg-zinc-800 p-4"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`upcoming-${index}`}
                    checked={game.selected || false}
                    onCheckedChange={(checked) =>
                      handleUpcomingGameSelection(index, checked as boolean)
                    }
                    disabled={
                      !game.isMatched ||
                      game.existsInUpcomingGames ||
                      upcomingBatchProcessing ||
                      game.status === 'processing'
                    }
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{game.name}</span>

                      {/* Show different badges based on game status */}
                      {game.existsInUpcomingGames ? (
                        <Badge className="bg-blue-600 text-xs hover:bg-blue-700">
                          Already in Upcoming
                        </Badge>
                      ) : game.existsInDb && game.isMatched ? (
                        <Badge
                          variant="outline"
                          className="border-green-400 text-xs text-green-400"
                        >
                          Found in DB
                        </Badge>
                      ) : game.isMatched ? (
                        <Badge
                          variant="outline"
                          className="border-green-400 text-xs text-green-400"
                        >
                          IGDB Match
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          No IGDB Match
                        </Badge>
                      )}
                    </div>

                    {game.igdbId && (
                      <p className="text-sm text-zinc-400">
                        IGDB ID: {game.igdbId}
                      </p>
                    )}

                    {game.error && (
                      <p className="text-sm text-red-400">
                        Error: {game.error}
                      </p>
                    )}

                    {game.errorMessage && (
                      <p className="text-sm text-red-400">
                        Failed: {game.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Highlight Toggle */}
                  {game.isMatched && !game.existsInUpcomingGames && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`highlight-${index}`}
                        checked={game.highlight || false}
                        onCheckedChange={(checked) =>
                          handleUpcomingGameHighlight(index, checked as boolean)
                        }
                        disabled={
                          upcomingBatchProcessing ||
                          game.status === 'processing'
                        }
                      />
                      <label htmlFor={`highlight-${index}`} className="text-xs">
                        <Sparkles className="mr-1 inline h-3 w-3" />
                        Highlight
                      </label>
                    </div>
                  )}

                  {/* Status Icon */}
                  {game.status === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  )}
                  {game.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {game.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}

                  {/* Action Buttons */}
                  {game.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryUpcomingGame(index)}
                      disabled={upcomingBatchProcessing}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}

                  {game.existsInUpcomingGames && game.isMatched && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReuploadToGamesTable(index)}
                      disabled={upcomingBatchProcessing}
                      title="Reupload to games table"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Banner Upload */}
                  {game.selected &&
                    game.isMatched &&
                    !game.existsInUpcomingGames && (
                      <FileUpload
                        onFileSelect={(file) =>
                          handleUpcomingBannerUpload(index, file)
                        }
                        label="Banner"
                        className="w-32"
                        accept="image/jpeg,image/png,image/webp"
                        maxSize={5 * 1024 * 1024}
                        preview={true}
                      />
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
