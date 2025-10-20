import {
  ArrowBigLeftDash,
  ArrowBigRightDash,
  Ghost,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewSwitchButtonProps {
  currentView: 'disliked' | 'graveyard';
  onViewChange: (view: 'disliked' | 'graveyard') => void;
  dislikedLabel: string;
  graveyardLabel: string;
}

export function ViewSwitchButton({
  currentView,
  onViewChange,
  dislikedLabel,
  graveyardLabel,
}: ViewSwitchButtonProps) {
  const isGraveyard = currentView === 'graveyard';

  return (
    <Button
      variant="ghost"
      onClick={() => onViewChange(isGraveyard ? 'disliked' : 'graveyard')}
      className={`absolute top-4 z-20 flex items-center gap-2 ${
        isGraveyard
          ? 'left-4 text-red-400 hover:bg-red-950/20 hover:text-red-300'
          : 'right-4 text-gray-400 hover:bg-zinc-800 hover:text-gray-300'
      }`}
    >
      {isGraveyard ? (
        <>
          <ArrowBigLeftDash className="!h-6 !w-6 md:!h-8 md:!w-8" />
          <span className="hidden text-lg font-bold md:block">
            {dislikedLabel}
          </span>
          <ThumbsDown className="!h-4 !w-4" />
        </>
      ) : (
        <>
          <Ghost className="!h-5 !w-5" />
          <span className="hidden text-lg font-bold md:block">
            {graveyardLabel}
          </span>
          <ArrowBigRightDash className="!h-6 !w-6 md:!h-8 md:!w-8" />
        </>
      )}
    </Button>
  );
}
