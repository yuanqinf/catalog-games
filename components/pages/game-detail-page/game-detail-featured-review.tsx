'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, User, Building2 } from 'lucide-react';
import { useGameReviews } from '@/hooks/useGameRating';

interface FeaturedCriticReviewsProps {
  gameId: number;
}

const FeaturedCriticReviews = ({ gameId }: FeaturedCriticReviewsProps) => {
  const { reviews, isLoading, error } = useGameReviews(gameId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <h3 className="mb-6 text-2xl font-bold">Professional Reviews</h3>
          <div className="flex h-32 w-full items-center justify-center">
            <div className="text-muted-foreground">Loading reviews...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reviews || reviews.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <h3 className="mb-6 text-2xl font-bold">Professional Reviews</h3>
          <div className="flex h-32 w-full items-center justify-center">
            <div className="text-muted-foreground">
              {error ? 'Failed to load reviews' : 'No professional reviews available yet'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all reviews sorted by date (newest first)
  const sortedReviews = reviews.sort((a, b) => {
    if (!a.published_date && !b.published_date) return 0;
    if (!a.published_date) return 1;
    if (!b.published_date) return -1;
    return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
  });

  // Show first 3 by default, or all if showAll is true
  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  const formatScore = (score?: number, npScore?: number) => {
    if (score && npScore && score !== npScore) {
      return `${score} (${npScore}/100)`;
    }
    if (npScore) return `${npScore}/100`;
    if (score) return `${score}`;
    return null;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h3 className="mb-6 text-2xl font-bold">Professional Reviews</h3>
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="group rounded-lg border border-border/50 p-4 transition-all hover:border-border hover:shadow-sm"
            >
              {/* Header with outlet, score, and date */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {review.outlet_name && (
                    <div className="flex items-center gap-1">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {review.outlet_name}
                      </span>
                    </div>
                  )}
                  {formatScore(review.score, review.np_score) && (
                    <Badge variant="secondary" className="ml-2">
                      {formatScore(review.score, review.np_score)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {review.published_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        {new Date(review.published_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Author */}
              {review.author_name && (
                <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <User size={14} />
                  <span>by {review.author_name}</span>
                </div>
              )}

              {/* Review content */}
              {review.snippet_content && (
                <p className="mb-3 text-foreground leading-relaxed line-clamp-4">
                  {review.snippet_content}
                </p>
              )}

              {/* External link */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => window.open(review.external_url, '_blank', 'noopener,noreferrer')}
                >
                  <span className="text-xs">Read Full Review</span>
                  <ExternalLink size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {sortedReviews.length > 3 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? `Show Less`
                : `Show All ${sortedReviews.length} Reviews`
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedCriticReviews;
