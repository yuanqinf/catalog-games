import { getSteamReviewPresentation } from '@/utils/game-utils';

interface SteamReviewBadgeProps {
  review?: string;
  showLabel?: boolean;
  className?: string;
}

export default function SteamReviewBadge({
  review,
  showLabel = true,
  className = '',
}: SteamReviewBadgeProps) {
  const steamPresentation = getSteamReviewPresentation(review);

  if (!steamPresentation) return null;

  return (
    <div
      className={`flex items-center ${className}`}
      title={`Steam: ${steamPresentation.label}`}
    >
      <steamPresentation.IconComponent
        className={`mr-1.5 h-4 w-4 flex-shrink-0 ${steamPresentation.colorClass}`}
      />
      {showLabel && (
        <span
          className={`hidden truncate font-semibold xl:inline-block ${steamPresentation.colorClass} capitalize`}
        >
          {steamPresentation.label}
        </span>
      )}
    </div>
  );
}
