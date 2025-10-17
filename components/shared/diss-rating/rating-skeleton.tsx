import { Skeleton } from '@/components/ui/skeleton';
import { ratingCategories } from '@/constants/rating-categories';

interface RatingSkeletonProps {
  maxRating?: number;
}

export const RatingSkeleton: React.FC<RatingSkeletonProps> = ({
  maxRating = 5,
}) => {
  return (
    <>
      <div className="space-y-4 py-4">
        {ratingCategories.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 capitalize">
                {label}
              </span>
              <span className="text-sm text-neutral-500">0/{maxRating}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-6 w-6" />
              <div className="flex flex-1 gap-1">
                {[...Array(maxRating)].map((_, i) => (
                  <Skeleton key={i} className="h-5 flex-1" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
    </>
  );
};
