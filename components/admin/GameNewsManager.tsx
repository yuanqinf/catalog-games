'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
// Badge removed as it's not used in this component
import { toast } from 'sonner';
import { Loader2, Search, Newspaper } from 'lucide-react';
import { useAdmin } from './AdminContext';

interface NewsArticle {
  id?: number;
  title: string;
  publisher?: string;
  published_at?: string;
  [key: string]: unknown;
}

interface NewsResults {
  successful: NewsArticle[];
  failed: Array<{ article: NewsArticle; error: string }>;
  skipped: Array<{ article: NewsArticle; reason: string }>;
}

export const GameNewsManager = () => {
  const { gameService } = useAdmin();

  // State
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsResults, setNewsResults] = useState<NewsResults | null>(null);

  // Handle loading game news
  const handleLoadGameNews = useCallback(async () => {
    setIsLoadingNews(true);
    setNewsResults(null);

    try {
      console.log('🔍 Loading game news from API...');

      // Fetch news from the gaming news API
      const response = await fetch('/api/gaming-news');
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const newsData = await response.json();

      if (!newsData.success || !newsData.data) {
        throw new Error('Invalid news data received');
      }

      console.log(`📰 Found ${newsData.data.length} articles to process`);

      // Process the news articles using GameService
      const results = await gameService.addGameNewsBatch(newsData.data);
      setNewsResults(results);

      // Show summary toast
      const { successful, failed, skipped } = results;
      toast.success(
        `News processed: ${successful.length} added, ${skipped.length} skipped, ${failed.length} failed`,
      );

      console.log('📊 News processing complete:', {
        successful: successful.length,
        skipped: skipped.length,
        failed: failed.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load game news: ${errorMessage}`);
      console.error('Error loading game news:', error);
    } finally {
      setIsLoadingNews(false);
    }
  }, [gameService]);

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Newspaper className="h-5 w-5 text-orange-400" />
        Game News Manager
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Fetch and store the latest gaming news articles from the news API into
        the database. Duplicate articles will be automatically skipped based on
        URL.
      </p>

      {/* Load News Button */}
      <div className="mb-6">
        <Button
          onClick={handleLoadGameNews}
          disabled={isLoadingNews}
          className="w-full"
        >
          {isLoadingNews ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading News...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Load Game News
            </>
          )}
        </Button>
      </div>

      {/* News Results */}
      {newsResults && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-600 bg-zinc-800 p-4">
            <h3 className="mb-4 font-medium">News Processing Results</h3>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {newsResults.successful.length}
                </div>
                <div className="text-sm text-zinc-400">Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {newsResults.skipped.length}
                </div>
                <div className="text-sm text-zinc-400">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {newsResults.failed.length}
                </div>
                <div className="text-sm text-zinc-400">Failed</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              {/* Successfully Added Articles */}
              {newsResults.successful.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-400">
                    Successfully Added ({newsResults.successful.length}):
                  </h4>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded border border-zinc-700 bg-zinc-900 p-3">
                    {newsResults.successful
                      .slice(0, 10)
                      .map((article, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-zinc-200">
                            {article.title}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {article.publisher || 'Unknown Publisher'}
                            {article.published_at && (
                              <span className="ml-2">
                                •{' '}
                                {new Date(
                                  article.published_at,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    {newsResults.successful.length > 10 && (
                      <div className="text-sm text-zinc-400">
                        ... and {newsResults.successful.length - 10} more
                        articles
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skipped Articles */}
              {newsResults.skipped.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-yellow-400">
                    Skipped Articles ({newsResults.skipped.length}):
                  </h4>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-zinc-700 bg-zinc-900 p-3">
                    {newsResults.skipped.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-zinc-300">
                          {item.article.title}
                        </div>
                        <div className="text-xs text-yellow-400">
                          Reason: {item.reason}
                        </div>
                      </div>
                    ))}
                    {newsResults.skipped.length > 5 && (
                      <div className="text-sm text-zinc-400">
                        ... and {newsResults.skipped.length - 5} more skipped
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Failed Articles */}
              {newsResults.failed.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-400">
                    Failed Articles ({newsResults.failed.length}):
                  </h4>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-zinc-700 bg-zinc-900 p-3">
                    {newsResults.failed.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-zinc-300">
                          {item.article.title}
                        </div>
                        <div className="text-xs text-red-400">
                          Error: {item.error}
                        </div>
                      </div>
                    ))}
                    {newsResults.failed.length > 5 && (
                      <div className="text-sm text-zinc-400">
                        ... and {newsResults.failed.length - 5} more failed
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {newsResults.successful.length === 0 &&
              newsResults.skipped.length === 0 &&
              newsResults.failed.length === 0 && (
                <div className="py-4 text-center text-zinc-400">
                  No articles were processed
                </div>
              )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h4 className="mb-2 text-sm font-medium text-zinc-300">
          How it works:
        </h4>
        <ul className="space-y-1 text-sm text-zinc-400">
          <li>
            • Fetches latest gaming news from the configured news API endpoint
          </li>
          <li>
            • Automatically skips articles that already exist in the database
            (based on URL)
          </li>
          <li>
            • Extracts metadata including title, publisher, publication date,
            and thumbnail
          </li>
          <li>
            • Stores articles in the{' '}
            <code className="rounded bg-zinc-700 px-1">game_news</code> table
          </li>
          <li>
            • Shows detailed results for successful, skipped, and failed
            articles
          </li>
        </ul>
      </div>
    </section>
  );
};
