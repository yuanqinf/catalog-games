import Image from 'next/image';
import Link from 'next/link';
import {
  Gamepad2,
  Bookmark,
  Calendar,
  Star,
  MoreHorizontal,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import {
  faWindows,
  faPlaystation,
  faXbox,
  faApple,
  faSteam,
  faAndroid,
} from '@fortawesome/free-brands-svg-icons';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GameDbData } from '@/types';
import { unifyPlatforms, type UnifiedPlatform } from '@/utils/platform-utils';
import { useGameRating } from '@/hooks/useGameRating';

type PlatformIconData =
  | {
      type: 'fontawesome';
      icon: any;
    }
  | {
      type: 'badge';
      text: string;
    };

// Map UnifiedPlatform to FontAwesome icons or badges
const getPlatformIcon = (
  platform: UnifiedPlatform,
  game: GameDbData,
): PlatformIconData => {
  const iconMap: Record<UnifiedPlatform, PlatformIconData> = {
    PC: { type: 'fontawesome', icon: game.steam_app_id ? faSteam : faWindows },
    MAC: { type: 'fontawesome', icon: faApple },
    PS: { type: 'fontawesome', icon: faPlaystation },
    XBOX: { type: 'fontawesome', icon: faXbox },
    NINTENDO: { type: 'badge', text: 'Nintendo Console' },
    SWITCH: { type: 'badge', text: 'Switch' },
    GAMEBOY: { type: 'badge', text: 'Game Boy' },
    MOBILE: { type: 'fontawesome', icon: faAndroid },
    Wii: { type: 'badge', text: 'Wii' },
  };

  return iconMap[platform] || { type: 'fontawesome', icon: faGamepad };
};

const MiniGameCard = ({ game }: { game: GameDbData }) => {
  const { overallAverage } = useGameRating(game.id);

  // Get unified platforms and their icons
  const unifiedPlatforms = unifyPlatforms(game.platforms);
  const displayedPlatforms = unifiedPlatforms.slice(0, 3); // Show only 3 platforms if more than 4
  const hasMorePlatforms = unifiedPlatforms.length > 3;
  const platformIconsData = displayedPlatforms.map((platform) =>
    getPlatformIcon(platform, game),
  );

  return (
    <div className="p-1">
      <Link href={`/detail/${game.slug}`}>
        <div className="group relative flex cursor-pointer flex-col rounded-lg border border-transparent bg-zinc-800 p-4 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:border-zinc-500/50 hover:bg-gradient-to-br hover:from-zinc-700/80 hover:via-slate-700/60 hover:to-zinc-600/80 hover:shadow-2xl hover:shadow-zinc-900/60">
          <Bookmark
            size={20}
            className="absolute top-6 right-6 z-10 cursor-pointer text-white/80 transition-all duration-200 group-hover:text-white hover:scale-125 hover:text-yellow-400 hover:drop-shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add onClick handler for bookmark functionality
            }}
          />
          <div
            className="relative mb-2 overflow-hidden rounded bg-zinc-700 transition-shadow duration-200 group-hover:shadow-md"
            style={{ aspectRatio: '672/895' }}
          >
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={game.name}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Gamepad2
                  size={40}
                  className="text-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:text-zinc-300"
                />
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <h3 className="truncate font-medium transition-all duration-300 group-hover:font-semibold group-hover:text-white">
              {game.name}
            </h3>
            {game.developers && (
              <h4 className="truncate text-sm text-zinc-300">
                {game.developers[0]}
              </h4>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="mt-1 text-sm text-zinc-400">
                {game.first_release_date &&
                new Date(game.first_release_date).getTime() > Date.now() ? (
                  <span className="flex items-center">
                    <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                    {new Date(game.first_release_date).toLocaleDateString(
                      'en-CA',
                    )}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <TooltipProvider>
                      <div className="flex items-center gap-1">
                        {platformIconsData.map((iconData, index) =>
                          iconData.type === 'fontawesome' ? (
                            <FontAwesomeIcon
                              key={index}
                              icon={iconData.icon}
                              className="text-sm"
                            />
                          ) : (
                            <Badge
                              key={index}
                              variant="outline"
                              className="h-fit px-1.5 py-0.5 text-xs"
                            >
                              {iconData.text}
                            </Badge>
                          ),
                        )}
                        {hasMorePlatforms && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <MoreHorizontal
                                  size={14}
                                  className="text-zinc-400 hover:text-zinc-200"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                All platforms:{' '}
                                {game.platforms?.join(', ') || 'Unknown'}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </span>
                )}
              </div>
              <p className="flex items-center text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                <Star
                  size={14}
                  className="mr-1 flex-shrink-0 text-yellow-400 transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-300"
                />
                {overallAverage ? overallAverage : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MiniGameCard;
