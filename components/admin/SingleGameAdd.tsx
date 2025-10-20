'use client';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  useAdmin,
  GameResult,
  searchAndProcessGameById,
  validateIgdbId,
} from './AdminContext';

export const SingleGameAdd = () => {
  const { gameService } = useAdmin();

  // Form states
  const [igdbId, setIgdbId] = useState('');
  const [idSearchResult, setIdSearchResult] = useState<GameResult | null>(null);

  // Loading states
  const [isSearchingById, setIsSearchingById] = useState(false);
  const [isAddingById, setIsAddingById] = useState(false);

  // Handle search by IGDB ID
  const handleSearchById = useCallback(async () => {
    if (!validateIgdbId(igdbId)) {
      toast.error('Please enter a valid IGDB ID');
      return;
    }

    setIsSearchingById(true);
    setIdSearchResult(null);

    try {
      const id = Number(igdbId);
      const gameInfo = await searchAndProcessGameById(gameService, id);

      const result: GameResult = {
        name: gameInfo.name,
        igdbId: gameInfo.igdbId,
        existsInDb: gameInfo.existsInDb,
        isInSteam: gameInfo.isInSteam,
        igdbData: gameInfo.igdbData,
        selected: !gameInfo.existsInDb,
        status: 'pending',
      };

      setIdSearchResult(result);

      if (gameInfo.existsInDb) {
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
      } as GameResult);

      toast.error(`Failed to find game: ${errorMessage}`);
    } finally {
      setIsSearchingById(false);
    }
  }, [igdbId, gameService]);

  // Handle add single game by ID or update existing game
  const handleAddById = useCallback(async () => {
    if (!idSearchResult || idSearchResult.error) {
      return;
    }

    setIsAddingById(true);

    try {
      const isUpdate = idSearchResult.existsInDb;

      // Add or update the game in database
      await gameService.addOrUpdateGame(
        idSearchResult.igdbData,
        idSearchResult.bannerFile || undefined,
      );

      // Update the result to show it's completed
      setIdSearchResult((prev) =>
        prev ? { ...prev, status: 'completed', existsInDb: true } : null,
      );

      toast.success(
        `Successfully ${isUpdate ? 'updated' : 'added'} "${idSearchResult.name}" ${isUpdate ? 'in' : 'to'} database`,
      );
    } catch (error) {
      console.error('Failed to add/update game:', error);
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

      toast.error(
        `Failed to ${idSearchResult.existsInDb ? 'update' : 'add'} game: ${errorMessage}`,
      );
    } finally {
      setIsAddingById(false);
    }
  }, [idSearchResult, gameService]);

  // Handle banner upload for ID search result
  const handleIdBannerUpload = useCallback((file: File | null) => {
    setIdSearchResult((prev) => (prev ? { ...prev, bannerFile: file } : null));
  }, []);

  // Handle retry
  const handleRetryGame = useCallback(async () => {
    if (!idSearchResult || idSearchResult.error) {
      return;
    }

    // Reset status and try again
    setIdSearchResult((prev) =>
      prev ? { ...prev, status: 'processing', errorMessage: undefined } : null,
    );

    try {
      await gameService.addOrUpdateGame(
        idSearchResult.igdbData,
        idSearchResult.bannerFile || undefined,
      );

      setIdSearchResult((prev) =>
        prev ? { ...prev, status: 'completed', existsInDb: true } : null,
      );

      const isUpdate = idSearchResult.existsInDb;
      toast.success(
        `Successfully ${isUpdate ? 'updated' : 'added'} "${idSearchResult.name}"`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setIdSearchResult((prev) =>
        prev ? { ...prev, status: 'failed', errorMessage } : null,
      );

      toast.error(`Failed to retry "${idSearchResult.name}": ${errorMessage}`);
    }
  }, [idSearchResult, gameService]);

  const canAddOrUpdateGame = idSearchResult && !idSearchResult.error;
  const gameDisabled =
    !!idSearchResult?.error ||
    isAddingById ||
    idSearchResult?.status === 'processing';

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Add Single Game by IGDB ID</h2>

      {/* Search Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">IGDB ID:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={igdbId}
              onChange={(e) => setIgdbId(e.target.value)}
              placeholder="Enter IGDB game ID..."
              className="flex-1 rounded-md border border-zinc-600 bg-zinc-800 p-3 text-white placeholder-zinc-400"
            />
            <Button
              onClick={handleSearchById}
              disabled={isSearchingById}
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
      </div>

      {/* Search Result */}
      {idSearchResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Result</h3>

          <div className="rounded-lg border border-zinc-600 bg-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-lg font-medium">{idSearchResult.name}</h4>
                  {idSearchResult.isInSteam && (
                    <Badge variant="secondary" className="text-xs">
                      Steam
                    </Badge>
                  )}
                  {idSearchResult.existsInDb && (
                    <Badge variant="outline" className="text-xs">
                      In DB
                    </Badge>
                  )}

                  {/* Status Icons */}
                  {idSearchResult.status === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  )}
                  {idSearchResult.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {idSearchResult.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>

                <p className="mb-2 text-sm text-gray-400">
                  IGDB ID: {idSearchResult.igdbId}
                </p>

                {idSearchResult.error && (
                  <p className="mb-2 text-sm text-red-400">
                    Error: {idSearchResult.error}
                  </p>
                )}

                {idSearchResult.errorMessage && (
                  <p className="mb-2 text-sm text-red-400">
                    Failed: {idSearchResult.errorMessage}
                  </p>
                )}

                {idSearchResult.existsInDb && (
                  <p className="text-sm text-yellow-400">
                    ⚠️ Game exists in database (can update with new banner)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Banner Upload - Now available for both new and existing games */}
                {canAddOrUpdateGame &&
                  idSearchResult.status !== 'completed' && (
                    <FileUpload
                      onFileSelect={handleIdBannerUpload}
                      label={
                        idSearchResult.existsInDb
                          ? 'Update Banner'
                          : 'Upload Banner'
                      }
                      className="w-40"
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                      preview={true}
                    />
                  )}

                {/* Retry Button */}
                {idSearchResult.status === 'failed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetryGame}
                    disabled={isAddingById}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Retry
                  </Button>
                )}

                {/* Add/Update Button */}
                {canAddOrUpdateGame &&
                  idSearchResult.status !== 'completed' && (
                    <Button
                      onClick={handleAddById}
                      disabled={gameDisabled}
                      size="sm"
                      variant={
                        idSearchResult.existsInDb ? 'outline' : 'default'
                      }
                    >
                      {isAddingById ||
                      idSearchResult.status === 'processing' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {idSearchResult.existsInDb
                            ? 'Updating...'
                            : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {idSearchResult.existsInDb
                            ? 'Update Game'
                            : 'Add to Database'}
                        </>
                      )}
                    </Button>
                  )}
              </div>
            </div>

            {/* Game Details */}
            {idSearchResult.igdbData && !idSearchResult.error && (
              <div className="mt-4 border-t border-zinc-700 pt-4">
                <h5 className="mb-2 text-sm font-medium">Game Details:</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {idSearchResult.igdbData.summary && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-300">
                        Summary:
                      </span>
                      <p className="mt-1 line-clamp-3 text-gray-400">
                        {idSearchResult.igdbData.summary}
                      </p>
                    </div>
                  )}

                  {idSearchResult.igdbData.first_release_date && (
                    <div>
                      <span className="font-medium text-gray-300">
                        Release Date:
                      </span>
                      <p className="text-gray-400">
                        {new Date(
                          idSearchResult.igdbData.first_release_date * 1000,
                        ).getFullYear()}
                      </p>
                    </div>
                  )}

                  {idSearchResult.igdbData.total_rating && (
                    <div>
                      <span className="font-medium text-gray-300">
                        IGDB Rating:
                      </span>
                      <p className="text-gray-400">
                        {Math.round(idSearchResult.igdbData.total_rating)}/100
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
