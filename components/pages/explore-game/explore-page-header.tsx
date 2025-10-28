import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';
import { ViewSwitchButton } from '@/components/pages/explore-game/view-switch-button';

interface ExplorePageHeaderProps {
  view: 'disliked' | 'graveyard';
  onViewChange: (view: 'disliked' | 'graveyard') => void;
  title: string;
  description: string;
  dislikedLabel: string;
  graveyardLabel: string;
}

export function ExplorePageHeader({
  view,
  onViewChange,
  title,
  description,
  dislikedLabel,
  graveyardLabel,
}: ExplorePageHeaderProps) {
  const { t } = useTranslation();
  const isGraveyard = view === 'graveyard';

  return (
    <div className="relative mb-4">
      <div className="relative overflow-hidden rounded-2xl px-8 py-12">
        {/* View Switch Button */}
        <ViewSwitchButton
          currentView={view}
          onViewChange={onViewChange}
          dislikedLabel={dislikedLabel}
          graveyardLabel={graveyardLabel}
        />

        {/* Background radial glow effect */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div
            className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background: `
                radial-gradient(ellipse farthest-corner at top center,
                  rgba(${isGraveyard ? '156,163,175' : '255,71,87'}, 0.4) 0%,
                  rgba(0, 0, 0, 0.3) 60%,
                  transparent 90%)
              `,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mt-4 text-center">
          <div className="flex justify-center gap-2">
            <h1
              className={`mb-4 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent md:text-4xl ${
                isGraveyard
                  ? 'from-gray-400 to-gray-600'
                  : 'from-[#ff4757] to-[#ff8894]'
              }`}
              style={{ fontWeight: 900 }}
            >
              {title}
            </h1>
            {!isGraveyard ? (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipContent>
                    <p className="text-sm text-gray-400 md:text-base">
                      {t('explore_top_50_most_disliked_games')}
                    </p>
                  </TooltipContent>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-pointer text-gray-400" />
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          <p className="text-base text-gray-400 md:text-lg">{description}</p>
        </div>

        {/* Bottom border accent */}
        <div
          className="absolute right-0 bottom-0 left-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              isGraveyard ? '#9ca3af' : '#ff4757'
            }, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
