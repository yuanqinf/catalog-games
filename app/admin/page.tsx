'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { GameService } from '@/lib/supabase/client';

import { Loader2, CheckCircle, XCircle, Upload, Search } from 'lucide-react';
import { checkGameExistsInSteam } from '@/utils/steam-integration';

// TODO: Only allow admin users to access this page

interface GameResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  isInSteam?: boolean;
  igdbData?: any;
  error?: string;
  selected?: boolean;
  bannerFile?: File | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

interface BatchReport {
  total: number;
  successful: number;
  failed: number;
  details: Array<{
    name: string;
    status: 'success' | 'failed';
    message: string;
  }>;
}

export default function AddGamePage() {
  // Form states
  const [gameNames, setGameNames] = useState('');
  const [searchResults, setSearchResults] = useState<GameResult[]>([]);
  const [igdbId, setIgdbId] = useState('');
  const [idSearchResult, setIdSearchResult] = useState<GameResult | null>(null);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingSteam, setIsCheckingSteam] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchStopped, setBatchStopped] = useState(false);
  const [isSearchingById, setIsSearchingById] = useState(false);
  const [isAddingById, setIsAddingById] = useState(false);

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [batchReport, setBatchReport] = useState<BatchReport | null>(null);

  const router = useRouter();
  const { isLoaded, isSignedIn, session } = useSession();

  // Redirect if not signed in (side effect)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  const gameService = useMemo(() => new GameService(session), [session]);

  // Handle batch game search
  const handleBatchSearch = useCallback(async () => {
    console.log('handleBatchSearch gameNames: ', gameNames);

    if (!gameNames.trim()) {
      toast.error('Please enter game names');
      return;
    }

    setIsSearching(true);
    try {
      // Parse game names (split by new lines and filter empty)
      const names = gameNames
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      if (names.length === 0) {
        toast.error('No valid game names found');
        return;
      }

      console.log(`🔍 Searching for ${names.length} games...`);

      const response = await fetch('/api/igdb/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameNames: names }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      console.log(
        `✅ IGDB search complete, checking Steam availability for ${data.results.length} games...`,
      );

      // Set Steam checking state
      setIsCheckingSteam(true);

      // Add selection state and Steam check to results
      const resultsWithSelection = await Promise.all(
        data.results.map(async (result: GameResult) => {
          // Check if this game exists on Steam
          const isInSteam = await checkGameExistsInSteam(result.name);

          return {
            ...result,
            isInSteam,
            selected: !result.existsInDb && !result.error,
            status: 'pending' as const,
          };
        }),
      );

      setIsCheckingSteam(false);

      setSearchResults(resultsWithSelection);

      toast.success(
        `Found ${data.summary.found}/${data.summary.total} games. ${data.summary.new} new games available to add.`,
      );
    } catch (error) {
      console.error('Batch search failed:', error);
      toast.error('Failed to search games');
    } finally {
      setIsSearching(false);
    }
  }, [gameNames]);

  // Handle search by IGDB ID
  const handleSearchById = useCallback(async () => {
    if (!igdbId.trim() || isNaN(Number(igdbId))) {
      toast.error('Please enter a valid IGDB ID');
      return;
    }

    setIsSearchingById(true);
    setIdSearchResult(null);

    try {
      const id = Number(igdbId);
      console.log(`🔍 Searching for game with ID: ${id}`);

      // Check if game already exists in database
      const existsResponse = await fetch(`/api/igdb/games/${id}`);
      let existsInDb = false;
      let igdbData = null;

      if (existsResponse.ok) {
        igdbData = await existsResponse.json();
        // For now, assume game doesn't exist in our DB (we'll let the add function handle duplicates)
        existsInDb = false;
      } else {
        throw new Error('Game not found in IGDB');
      }

      // Check if this game exists on Steam
      const isInSteam = await checkGameExistsInSteam(
        igdbData?.name || `Game ID ${id}`,
      );

      const result: GameResult = {
        name: igdbData?.name || `Game ID ${id}`,
        igdbId: id,
        existsInDb,
        isInSteam,
        igdbData,
        selected: !existsInDb,
        status: 'pending',
      };

      setIdSearchResult(result);

      if (existsInDb) {
        toast.info(`Game "${result.name}" already exists in database`);
      } else {
        toast.success(`Found game: "${result.name}"`);
      }
    } catch (error) {
      console.error('ID search failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setIdSearchResult({
        name: `Game ID ${igdbId}`,
        igdbId: Number(igdbId),
        existsInDb: false,
        isInSteam: false,
        error: errorMessage,
        selected: false,
        status: 'pending',
      });

      toast.error(`Failed to find game: ${errorMessage}`);
    } finally {
      setIsSearchingById(false);
    }
  }, [igdbId, gameService]);

  // Handle add single game by ID
  const handleAddById = useCallback(async () => {
    if (!idSearchResult || idSearchResult.error || idSearchResult.existsInDb) {
      return;
    }

    setIsAddingById(true);

    try {
      console.log(
        `🚀 Adding game: ${idSearchResult.name} (ID: ${idSearchResult.igdbId})`,
      );

      // Add the game to database
      await gameService.addOrUpdateGame(
        idSearchResult.igdbData,
        idSearchResult.bannerFile || undefined,
      );

      // Update the result to show it's completed
      setIdSearchResult((prev) =>
        prev ? { ...prev, status: 'completed', existsInDb: true } : null,
      );

      toast.success(`Successfully added "${idSearchResult.name}" to database`);
    } catch (error) {
      console.error('Failed to add game:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setIdSearchResult((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              errorMessage,
            }
          : null,
      );

      toast.error(`Failed to add game: ${errorMessage}`);
    } finally {
      setIsAddingById(false);
    }
  }, [idSearchResult, gameService]);

  // Handle banner upload for ID search result
  const handleIdBannerUpload = useCallback((file: File | null) => {
    setIdSearchResult((prev) => (prev ? { ...prev, bannerFile: file } : null));
  }, []);

  // Handle individual game selection
  const handleGameSelection = useCallback(
    (index: number, selected: boolean) => {
      setSearchResults((prev) =>
        prev.map((result, i) =>
          i === index ? { ...result, selected } : result,
        ),
      );
    },
    [],
  );

  // Handle banner upload for individual game
  const handleBannerUpload = useCallback((index: number, file: File | null) => {
    setSearchResults((prev) =>
      prev.map((result, i) =>
        i === index ? { ...result, bannerFile: file } : result,
      ),
    );
  }, []);

  // Handle batch processing
  const handleBatchProcess = useCallback(async () => {
    const selectedGames = searchResults.filter(
      (game) => game.selected && !game.error,
    );

    if (selectedGames.length === 0) {
      toast.error('No games selected for processing');
      return;
    }

    setBatchProcessing(true);
    setBatchStopped(false);
    setProgress(0);

    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < selectedGames.length; i += batchSize) {
      batches.push(selectedGames.slice(i, i + batchSize));
    }

    setTotalBatches(batches.length);
    setCurrentBatch(0);

    const report: BatchReport = {
      total: selectedGames.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    console.log(
      `🚀 Starting batch processing: ${selectedGames.length} games in ${batches.length} batches`,
    );

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (batchStopped) {
        console.log('🛑 Batch processing stopped by user');
        break;
      }

      setCurrentBatch(batchIndex + 1);
      const batch = batches[batchIndex];

      console.log(
        `📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} games)`,
      );

      // Process games in current batch
      for (const game of batch) {
        if (batchStopped) break;

        // Update game status to processing
        setSearchResults((prev) =>
          prev.map((r) =>
            r.igdbId === game.igdbId ? { ...r, status: 'processing' } : r,
          ),
        );

        try {
          // Fetch full IGDB data
          const igdbResponse = await fetch(`/api/igdb/games/${game.igdbId}`);
          if (!igdbResponse.ok) {
            throw new Error('Failed to fetch IGDB data');
          }
          const igdbData = await igdbResponse.json();

          // Add/update game
          await gameService.addOrUpdateGame(
            igdbData,
            game.bannerFile || undefined,
          );

          // Update status to completed
          setSearchResults((prev) =>
            prev.map((r) =>
              r.igdbId === game.igdbId ? { ...r, status: 'completed' } : r,
            ),
          );

          report.successful++;
          report.details.push({
            name: game.name,
            status: 'success',
            message: 'Successfully added to database',
          });

          console.log(`✅ Successfully processed: ${game.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          // Update status to failed
          setSearchResults((prev) =>
            prev.map((r) =>
              r.igdbId === game.igdbId
                ? {
                    ...r,
                    status: 'failed',
                    errorMessage,
                  }
                : r,
            ),
          );

          report.failed++;
          report.details.push({
            name: game.name,
            status: 'failed',
            message: errorMessage,
          });

          console.error(`❌ Failed to process ${game.name}:`, error);
        }

        // Update progress
        const processed = report.successful + report.failed;
        setProgress((processed / selectedGames.length) * 100);
      }

      // Small delay between batches to avoid overwhelming the system
      if (batchIndex < batches.length - 1 && !batchStopped) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setBatchProcessing(false);
    setBatchReport(report);

    const successMessage = batchStopped
      ? `Batch processing stopped. Processed ${report.successful + report.failed}/${report.total} games.`
      : `Batch processing complete! Successfully added ${report.successful}/${report.total} games.`;

    toast.success(successMessage);
    console.log('📊 Final Report:', report);
  }, [searchResults, gameService, batchStopped]);

  // Stop batch processing
  const handleStopBatch = useCallback(() => {
    setBatchStopped(true);
    toast.info('Stopping batch processing...');
  }, []);

  if (isLoaded && !isSignedIn) {
    return null;
  }

  const selectedCount = searchResults.filter((game) => game.selected).length;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Game Batch Upload</h1>

      {/* Search Form */}
      <div className="mb-6 space-y-4 rounded-lg border p-6">
        <div>
          <label className="text-sm font-medium">
            Game Names (one per line)
          </label>
          <textarea
            placeholder="Zelda&#10;Mario&#10;Final Fantasy"
            value={gameNames}
            onChange={(e) => setGameNames(e.target.value)}
            disabled={
              isSearching ||
              isCheckingSteam ||
              batchProcessing ||
              isSearchingById ||
              isAddingById
            }
            className="mt-1 min-h-32 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <Button
          onClick={handleBatchSearch}
          disabled={
            isSearching ||
            isCheckingSteam ||
            batchProcessing ||
            isSearchingById ||
            isAddingById ||
            !gameNames.trim()
          }
          className="w-full"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching IGDB...
            </>
          ) : isCheckingSteam ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Steam...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search Games
            </>
          )}
        </Button>
      </div>

      {/* Search by IGDB ID */}
      <div className="mb-6 space-y-4 rounded-lg border p-6">
        <div>
          <label className="text-sm font-medium">Add Game by IGDB ID</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              placeholder="Enter IGDB ID (e.g. 1234)"
              value={igdbId}
              onChange={(e) => setIgdbId(e.target.value)}
              disabled={
                isSearchingById ||
                isAddingById ||
                isSearching ||
                isCheckingSteam ||
                batchProcessing
              }
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <Button
              onClick={handleSearchById}
              disabled={
                isSearchingById ||
                isAddingById ||
                isSearching ||
                isCheckingSteam ||
                batchProcessing ||
                !igdbId.trim()
              }
              variant="outline"
            >
              {isSearchingById ? (
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

        {/* ID Search Result */}
        {idSearchResult && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {idSearchResult.igdbData?.name || idSearchResult.name}
                  </span>

                  {idSearchResult.existsInDb && (
                    <Badge variant="secondary">Already in DB</Badge>
                  )}
                  {idSearchResult.isInSteam && (
                    <Badge variant="outline" className="text-blue-600">
                      Steam
                    </Badge>
                  )}
                  {idSearchResult.error && (
                    <Badge variant="destructive">Error</Badge>
                  )}
                  {idSearchResult.status === 'completed' && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Added
                    </Badge>
                  )}
                  {idSearchResult.status === 'failed' && (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">
                  IGDB ID: {idSearchResult.igdbId}
                </p>

                {(idSearchResult.error || idSearchResult.errorMessage) && (
                  <p className="text-sm text-red-500">
                    {idSearchResult.error || idSearchResult.errorMessage}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!idSearchResult.error && !idSearchResult.existsInDb && (
                  <>
                    <FileUpload
                      label=""
                      onFileSelect={handleIdBannerUpload}
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                      className="w-32"
                    />
                    {idSearchResult.bannerFile && (
                      <span className="text-xs text-green-600">✓ Banner</span>
                    )}
                    <Button
                      onClick={handleAddById}
                      disabled={
                        isAddingById || idSearchResult.status === 'completed'
                      }
                      size="sm"
                    >
                      {isAddingById ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Add Game
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Found {searchResults.length} games
              </h2>
              <div className="text-muted-foreground flex gap-2 text-sm">
                <span>Selected: {selectedCount}</span>
                <span>•</span>
                <span>
                  On Steam: {searchResults.filter((r) => r.isInSteam).length}
                </span>
                <span>•</span>
                <span>
                  New:{' '}
                  {
                    searchResults.filter((r) => !r.existsInDb && !r.error)
                      .length
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {searchResults.filter((r) => r.isInSteam).length > 0 && (
                <Badge variant="outline" className="text-blue-600">
                  Steam: {searchResults.filter((r) => r.isInSteam).length}
                </Badge>
              )}
              <Badge variant="outline">{selectedCount} selected</Badge>
            </div>
          </div>

          {/* Game List */}
          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={result.selected}
                    onCheckedChange={(checked: boolean) =>
                      handleGameSelection(index, checked)
                    }
                    disabled={
                      !!result.error ||
                      batchProcessing ||
                      isSearchingById ||
                      isAddingById
                    }
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {result.igdbData?.name || result.name}
                      </span>

                      {result.existsInDb && (
                        <Badge variant="secondary">In DB</Badge>
                      )}
                      {result.isInSteam && (
                        <Badge variant="outline" className="text-blue-600">
                          Steam
                        </Badge>
                      )}
                      {result.error && (
                        <Badge variant="destructive">Error</Badge>
                      )}
                      {result.status === 'processing' && (
                        <Badge variant="outline">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Processing
                        </Badge>
                      )}
                      {result.status === 'completed' && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Done
                        </Badge>
                      )}
                      {result.status === 'failed' && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </div>

                    {result.igdbId > 0 && (
                      <p className="text-muted-foreground text-sm">
                        ID: {result.igdbId}
                      </p>
                    )}

                    <p className="text-muted-foreground text-sm">
                      Steam: {result.isInSteam ? 'Yes' : 'No'}
                    </p>

                    {(result.error || result.errorMessage) && (
                      <p className="text-sm text-red-500">
                        {result.error || result.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Banner Upload */}
                {result.selected && !result.error && (
                  <div className="flex items-center gap-2">
                    <FileUpload
                      label=""
                      onFileSelect={(file) => handleBannerUpload(index, file)}
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                      className="w-32"
                    />
                    {result.bannerFile && (
                      <span className="text-xs text-green-600">✓ Banner</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Batch Controls */}
          {selectedCount > 0 && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Ready to upload {selectedCount} games
                </span>

                {!batchProcessing ? (
                  <Button onClick={handleBatchProcess}>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Upload
                  </Button>
                ) : (
                  <Button onClick={handleStopBatch} variant="destructive">
                    Stop
                  </Button>
                )}
              </div>

              {batchProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Batch {currentBatch}/{totalBatches}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          )}

          {/* Report */}
          {batchReport && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Upload Complete</h3>

              <div className="mb-4 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {batchReport.successful}
                  </div>
                  <div className="text-muted-foreground text-sm">Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {batchReport.failed}
                  </div>
                  <div className="text-muted-foreground text-sm">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{batchReport.total}</div>
                  <div className="text-muted-foreground text-sm">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      searchResults.filter(
                        (r) => r.isInSteam && r.status === 'completed',
                      ).length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Steam Games
                  </div>
                </div>
              </div>

              <div className="max-h-48 space-y-1 overflow-y-auto">
                {batchReport.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {detail.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>
                      {detail.name}: {detail.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
