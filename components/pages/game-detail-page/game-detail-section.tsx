import { Badge } from '@/components/ui/badge';
import { LucideIcon, Info, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GameDetailSectionProps {
  title: string;
  items?: string[];
  icon: LucideIcon;
  className?: string;
  tooltipContent?: React.ReactNode;
  showTooltip?: boolean;
  isLoading?: boolean;
}

export default function GameDetailSection({
  title,
  items,
  icon: Icon,
  className = '',
  tooltipContent,
  showTooltip = false,
  isLoading = false,
}: GameDetailSectionProps) {
  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <h4 className="game-detail-title">
          <Icon className="h-4 w-4" />
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  // Don't render if no items
  if (!items || items.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="game-detail-title">
        <Icon className="h-4 w-4" />
        {title}
        {showTooltip && tooltipContent && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-3 w-3 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>{tooltipContent}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge variant="outline" key={item} className="px-3 py-1 text-sm">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
