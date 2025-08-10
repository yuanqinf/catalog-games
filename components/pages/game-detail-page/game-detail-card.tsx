import { LucideIcon, Info } from 'lucide-react';
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
          {isLoading ? 'Loading...' : value}
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
