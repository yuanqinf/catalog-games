'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  Search,
  RotateCcw,
} from 'lucide-react';
import { checkGameExistsInSteam } from '@/utils/steam-integration';
import {
  useAdmin,
  GameResult,
  BatchReport,
  validateGameNames,
} from './AdminContext';

export const GameBatchSearch = () => {
  const { gameService } = useAdmin();

  // Form states
  const [gameNames, setGameNames] = useState('');
  const [searchResults, setSearchResults] = useState<GameResult[]>([]);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingSteam, setIsCheckingSteam] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchStopped, setBatchStopped] = useState(false);

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [batchReport, setBatchReport] = useState<BatchReport | null>(null);

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
      const names = validateGameNames(gameNames);

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
        data.results.map(async (result: any) => {
          // Check if this game exists on Steam
          const isInSteam = await checkGameExistsInSteam(result.name);

          return {
            name: result.name,
            igdbId: result.igdbId,
            existsInDb: result.existsInDb,
            isInSteam,
            igdbData: result.igdbData,
            error: result.error,
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

  // Handle game selection toggle
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

  // Handle banner upload
  const handleBannerUpload = useCallback((index: number, file: File | null) => {
    setSearchResults((prev) =>
      prev.map((result, i) =>
        i === index ? { ...result, bannerFile: file } : result,
      ),
    );
  }, []);

  // Handle batch processing
  const handleBatchProcess = useCallback(async () => {
    const selectedResults = searchResults.filter((result) => result.selected);
    if (selectedResults.length === 0) {
      toast.error('Please select games to add');
      return;
    }

    setBatchProcessing(true);
    setBatchStopped(false);
    setProgress(0);
    setCurrentBatch(0);
    setTotalBatches(selectedResults.length);

    const report: BatchReport = {
      total: selectedResults.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < selectedResults.length; i += batchSize) {
      batches.push(selectedResults.slice(i, i + batchSize));
    }

    setTotalBatches(batches.length);
    setCurrentBatch(0);

    try {
      console.log(
        `🚀 Starting batch processing: ${selectedResults.length} games in ${batches.length} batches`,
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
            console.log(`🎮 Processing: ${game.name} (${game.igdbId})`);

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
          setProgress((processed / selectedResults.length) * 100);
        }

        // Small delay between batches to avoid overwhelming the system
        if (batchIndex < batches.length - 1 && !batchStopped) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setBatchReport(report);

      const successMessage = batchStopped
        ? `Batch processing stopped. Processed ${report.successful + report.failed}/${report.total} games.`
        : `Batch processing complete! Successfully added ${report.successful}/${report.total} games.`;

      toast.success(successMessage);
      console.log('📊 Final Report:', report);
    } catch (error) {
      console.error('Batch processing failed:', error);
      toast.error('Batch processing encountered an error');
    } finally {
      setBatchProcessing(false);
    }
  }, [searchResults, gameService, batchStopped]);

  // Handle stop batch processing
  const handleStopBatch = useCallback(() => {
    setBatchStopped(true);
    toast.info('Stopping batch processing after current game...');
  }, []);

  // Handle retry single game
  const handleRetryGame = useCallback(
    async (index: number) => {
      const result = searchResults[index];

      // Update status to processing
      setSearchResults((prev) =>
        prev.map((r, i) =>
          i === index
            ? { ...r, status: 'processing', errorMessage: undefined }
            : r,
        ),
      );

      try {
        console.log(`🔄 Retrying: ${result.name}`);

        // Fetch full IGDB data
        const igdbResponse = await fetch(`/api/igdb/games/${result.igdbId}`);
        if (!igdbResponse.ok) {
          throw new Error('Failed to fetch IGDB data');
        }
        const igdbData = await igdbResponse.json();

        await gameService.addOrUpdateGame(
          igdbData,
          result.bannerFile || undefined,
        );

        // Update status to completed
        setSearchResults((prev) =>
          prev.map((r, i) => (i === index ? { ...r, status: 'completed' } : r)),
        );

        toast.success(`Successfully added "${result.name}"`);
        console.log(`✅ Retry successful: ${result.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // Update status to failed
        setSearchResults((prev) =>
          prev.map((r, i) =>
            i === index ? { ...r, status: 'failed', errorMessage } : r,
          ),
        );

        toast.error(`Failed to retry "${result.name}": ${errorMessage}`);
        console.error(`❌ Retry failed for ${result.name}:`, error);
      }
    },
    [searchResults, gameService],
  );

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Batch Game Search & Add</h2>

      {/* Search Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Game Names (one per line):
          </label>
          <textarea
            value={gameNames}
            onChange={(e) => setGameNames(e.target.value)}
            placeholder="Enter game names, one per line..."
            className="min-h-[120px] w-full rounded-md border border-zinc-600 bg-zinc-800 p-3 text-white placeholder-zinc-400"
            rows={6}
          />
        </div>
        <Button
          onClick={handleBatchSearch}
          disabled={isSearching || isCheckingSteam}
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
              Checking Steam availability...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search Games
            </>
          )}
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length} games)
            </h3>
            <div className="flex gap-2">
              {batchProcessing ? (
                <Button
                  onClick={handleStopBatch}
                  disabled={batchStopped}
                  variant="destructive"
                  size="sm"
                >
                  {batchStopped ? 'Stopping...' : 'Stop Processing'}
                </Button>
              ) : (
                <Button
                  onClick={handleBatchProcess}
                  disabled={
                    !searchResults.some((r) => r.selected) || batchProcessing
                  }
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add Selected Games
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {batchProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing games...</span>
                <span>
                  {currentBatch}/{totalBatches}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results List */}
          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <div
                key={`${result.name}-${result.igdbId}`}
                className="flex items-center justify-between rounded-lg border border-zinc-600 bg-zinc-800 p-4"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`game-${index}`}
                    checked={result.selected || false}
                    onCheckedChange={(checked) =>
                      handleGameSelection(index, checked as boolean)
                    }
                    disabled={
                      result.existsInDb ||
                      !!result.error ||
                      batchProcessing ||
                      result.status === 'processing'
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      {result.isInSteam && (
                        <Badge variant="secondary" className="text-xs">
                          Steam
                        </Badge>
                      )}
                      {result.existsInDb && (
                        <Badge variant="outline" className="text-xs">
                          In DB
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">
                      IGDB ID: {result.igdbId}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-400">
                        Error: {result.error}
                      </p>
                    )}
                    {result.errorMessage && (
                      <p className="text-sm text-red-400">
                        Failed: {result.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Icon */}
                  {result.status === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  )}
                  {result.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {result.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryGame(index)}
                        disabled={batchProcessing}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Banner Upload */}
                  {result.selected && !result.existsInDb && !result.error && (
                    <FileUpload
                      onFileSelect={(file) => handleBannerUpload(index, file)}
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

          {/* Batch Report */}
          {batchReport && (
            <div className="mt-6 rounded-lg border border-zinc-600 bg-zinc-800 p-4">
              <h4 className="mb-3 font-semibold">Batch Processing Report</h4>
              <div className="mb-3 flex gap-4">
                <span className="text-green-400">
                  ✅ Successful: {batchReport.successful}
                </span>
                <span className="text-red-400">
                  ❌ Failed: {batchReport.failed}
                </span>
                <span className="text-zinc-400">
                  📊 Total: {batchReport.total}
                </span>
              </div>
              <details className="cursor-pointer">
                <summary className="text-sm text-zinc-400 hover:text-white">
                  View detailed results
                </summary>
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {batchReport.details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{detail.name}</span>
                      <span
                        className={
                          detail.status === 'success'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        {detail.message}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
