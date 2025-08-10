'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGameReviews } from '@/hooks/useGameRating';

interface FeaturedUserReviewsProps {
  gameId: number;
}

const FeaturedUserReviews = ({ gameId }: FeaturedUserReviewsProps) => {
  const { reviews, isLoading, error } = useGameReviews(gameId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent>
          <h3 className="mb-6 text-2xl font-bold">Featured User Reviews</h3>
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
        <CardContent>
          <h3 className="mb-6 text-2xl font-bold">Featured User Reviews</h3>
          <div className="flex h-32 w-full items-center justify-center">
            <div className="text-muted-foreground">
              {error ? 'Failed to load reviews' : 'No reviews available yet'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all reviews sorted by date (newest first)
  const sortedReviews = reviews.sort(
    (a, b) =>
      new Date(b.original_published_at).getTime() -
      new Date(a.original_published_at).getTime(),
  );

  // Show first 5 by default, or all if showAll is true
  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 5);

  return (
    <Card className="w-full">
      <CardContent>
        <h3 className="mb-6 text-2xl font-bold">Featured User Reviews</h3>
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="border-border border-b pb-4 last:border-b-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm capitalize">
                  {review.source} Review
                </span>
                <span className="text-muted-foreground text-sm">
                  {new Date(review.original_published_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground line-clamp-4 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))}
        </div>
        {sortedReviews.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All Reviews'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedUserReviews;
