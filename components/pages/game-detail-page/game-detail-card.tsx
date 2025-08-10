import { LucideIcon, Info, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GameDetailCardProps {
  icon: LucideIcon;
  value: string | React.ReactNode;
  label: string;
  valueColor?: string;
  isLoading?: boolean;
  tooltipContent?: React.ReactNode;
  showTooltip?: boolean;
}

/**
 * Helper function to compute the display value properly
 * @param isLoading - Whether data is currently loading
 * @param value - The actual value (can be null/undefined)
 * @param formatter - Function to format the value when it exists
 * @param fallback - Fallback value when no data (defaults to 'N/A')
 */
export function getDisplayValue<T>(
  isLoading: boolean,
  value: T | null | undefined,
  formatter: (value: T) => string | React.ReactNode,
  fallback: string | React.ReactNode = 'N/A',
): string | React.ReactNode {
  if (isLoading) {
    return '';
  }

  if (value !== null && value !== undefined) {
    return formatter(value);
  }

  return fallback;
}

export default function GameDetailCard({
  icon: Icon,
  value,
  label,
  valueColor = 'text-foreground',
  isLoading = false,
  tooltipContent,
  showTooltip = false,
}: GameDetailCardProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-6">
      <Icon className="text-primary mb-2 h-10 w-10" />
      <div className="relative">
        <p className={`text-2xl font-bold ${valueColor}`}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
            </span>
          ) : (
            value
          )}
        </p>
        {showTooltip && tooltipContent && (
          <div className="absolute -top-1 -right-6">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>{tooltipContent}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      <p className="text-muted-foreground">{label}</p>
    </Card>
  );
}
