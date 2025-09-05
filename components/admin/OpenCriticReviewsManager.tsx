'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Upload, MessageSquare } from 'lucide-react';
import { useAdmin, validateIgdbId } from './AdminContext';

interface ReviewResults {
  success: boolean;
  reviewsAdded: number;
  message: string;
  error?: string;
}

export const OpenCriticReviewsManager = () => {
  const { gameService } = useAdmin();

  // State
  const [openCriticGameId, setOpenCriticGameId] = useState('');
  const [supabaseGameId, setSupabaseGameId] = useState('');
  const [isAddingReviews, setIsAddingReviews] = useState(false);
  const [reviewResults, setReviewResults] = useState<ReviewResults | null>(
    null,
  );

  // Handle adding OpenCritic reviews
  const handleAddOpenCriticReviews = useCallback(async () => {
    if (!openCriticGameId.trim() || !supabaseGameId.trim()) {
      toast.error('Please enter both OpenCritic Game ID and Supabase Game ID');
      return;
    }

    if (!validateIgdbId(openCriticGameId) || !validateIgdbId(supabaseGameId)) {
      toast.error('Both IDs must be valid numbers');
      return;
    }

    setIsAddingReviews(true);
    setReviewResults(null);

    try {
      console.log(
        `🔍 Adding OpenCritic reviews for game ${supabaseGameId} from OpenCritic ID ${openCriticGameId}`,
      );

      const reviews = await gameService.fetchOpenCriticReviews(
        Number(supabaseGameId),
        Number(openCriticGameId),
      );

      if (reviews.length > 0) {
        setReviewResults({
          success: true,
          reviewsAdded: reviews.length,
          message: `Successfully added ${reviews.length} reviews`,
        });
        toast.success(`Added ${reviews.length} OpenCritic reviews`);

        console.log(`✅ Successfully added ${reviews.length} reviews`);
      } else {
        setReviewResults({
          success: false,
          reviewsAdded: 0,
          message: 'No new reviews were added (may already exist)',
        });
        toast.info(
          'No new reviews added - they may already exist in the database',
        );

        console.log('ℹ️ No new reviews added');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to add OpenCritic reviews:', error);

      setReviewResults({
        success: false,
        reviewsAdded: 0,
        message: `Failed to add reviews: ${errorMessage}`,
        error: errorMessage,
      });

      toast.error(`Failed to add reviews: ${errorMessage}`);
    } finally {
      setIsAddingReviews(false);
    }
  }, [openCriticGameId, supabaseGameId, gameService]);

  const canAddReviews =
    openCriticGameId.trim() && supabaseGameId.trim() && !isAddingReviews;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        OpenCritic Reviews Manager
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Add OpenCritic reviews to a specific game in your database by providing
        both the OpenCritic game ID and the Supabase game ID. Reviews are
        automatically checked for duplicates.
      </p>

      {/* Form */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              OpenCritic Game ID
            </label>
            <input
              type="number"
              placeholder="e.g., 12345"
              value={openCriticGameId}
              onChange={(e) => setOpenCriticGameId(e.target.value)}
              disabled={isAddingReviews}
              className="w-full rounded-md border border-zinc-600 bg-zinc-800 p-3 text-white placeholder-zinc-400"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Find this ID in the OpenCritic URL for the game
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Supabase Game ID
            </label>
            <input
              type="number"
              placeholder="e.g., 67890"
              value={supabaseGameId}
              onChange={(e) => setSupabaseGameId(e.target.value)}
              disabled={isAddingReviews}
              className="w-full rounded-md border border-zinc-600 bg-zinc-800 p-3 text-white placeholder-zinc-400"
            />
            <p className="mt-1 text-xs text-zinc-500">
              The internal database ID of the game (not IGDB ID)
            </p>
          </div>
        </div>

        <Button
          onClick={handleAddOpenCriticReviews}
          disabled={!canAddReviews}
          className="w-full"
        >
          {isAddingReviews ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Reviews...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Add OpenCritic Reviews
            </>
          )}
        </Button>
      </div>

      {/* Review Results */}
      {reviewResults && (
        <div className="space-y-4">
          <div
            className={`rounded-lg border p-4 ${
              reviewResults.success
                ? 'border-green-600 bg-green-900/20'
                : 'border-red-600 bg-red-900/20'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium">
                {reviewResults.success ? (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">Failed</Badge>
                )}
                OpenCritic Review Import
              </h3>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  {reviewResults.reviewsAdded}
                </div>
                <div className="text-sm text-zinc-400">Reviews Added</div>
              </div>
            </div>

            <div className="space-y-2">
              <p
                className={`text-sm ${
                  reviewResults.success ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {reviewResults.message}
              </p>

              {reviewResults.error && (
                <p className="text-sm text-red-400">
                  <strong>Error Details:</strong> {reviewResults.error}
                </p>
              )}

              {reviewResults.success && reviewResults.reviewsAdded > 0 && (
                <div className="mt-3 border-t border-zinc-700 pt-3">
                  <p className="text-xs text-zinc-400">
                    Reviews have been added to the{' '}
                    <code className="rounded bg-zinc-700 px-1">
                      third_party_game_reviews
                    </code>{' '}
                    table and are now available in the game&apos;s detail page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h4 className="mb-3 text-sm font-medium text-zinc-300">How to use:</h4>

        <div className="space-y-3 text-sm text-zinc-400">
          <div>
            <strong className="text-zinc-300">
              1. Find OpenCritic Game ID:
            </strong>
            <p>Go to OpenCritic.com, find the game, and look at the URL:</p>
            <code className="mt-1 block rounded bg-zinc-700 p-2 text-xs">
              https://opencritic.com/game/12345/game-name → ID is 12345
            </code>
          </div>

          <div>
            <strong className="text-zinc-300">2. Find Supabase Game ID:</strong>
            <p>
              This is the internal database ID (primary key) from your games
              table.
            </p>
            <p className="text-xs">
              You can find this by searching for the game in your database or
              checking the game&apos;s detail page URL.
            </p>
          </div>

          <div>
            <strong className="text-zinc-300">3. What happens:</strong>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>Fetches reviews from OpenCritic API</li>
              <li>Filters out reviews without content</li>
              <li>Checks for duplicates based on review URL</li>
              <li>Stores unique reviews in the database</li>
              <li>Links reviews to the specified game</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
