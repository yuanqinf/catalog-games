import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Gamepad2,
  ThumbsDown,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import {
  faWindows,
  faPlaystation,
  faXbox,
  faApple,
  faSteam,
  faAndroid,
} from '@fortawesome/free-brands-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { unifyPlatforms, type UnifiedPlatform } from '@/utils/platform-utils';
import { Button } from '@/components/ui/button';
import { useThrottledDislikeReaction } from '@/hooks/useThrottledDislikeReaction';
import type { GameDbData } from '@/types';

type PlatformIconData =
  | {
      type: 'fontawesome';
      icon: IconProp;
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

interface PlaceholderConfig {
  title: string;
  description: string;
  href: string;
}

// Placeholder card component
const PlaceholderCard = ({ config }: { config: PlaceholderConfig }) => {
  return (
    <div className="p-1">
      <Link href={config.href}>
        <div className="group relative flex h-full cursor-pointer flex-col rounded-lg border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:border-zinc-600 hover:shadow-2xl">
          <div
            className="relative mb-2 flex items-center justify-center overflow-hidden rounded bg-zinc-700/50 transition-all duration-300 group-hover:bg-zinc-600/50"
            style={{ aspectRatio: '672/895' }}
          >
            <Gamepad2 className="h-16 w-16 text-gray-400 transition-all duration-300 group-hover:scale-110 group-hover:text-gray-300" />
          </div>

          <div className="mt-2 flex flex-col items-center justify-center gap-1 text-center">
            <h3 className="line-clamp-1 font-bold text-white transition-colors duration-300 group-hover:text-gray-100">
              {config.title}
            </h3>
            <p className="line-clamp-1 text-sm text-gray-400 transition-colors duration-300 group-hover:text-gray-300">
              {config.description}
            </p>
            <ExternalLink className="mt-1 h-4 w-4 text-gray-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-gray-400" />
          </div>
        </div>
      </Link>
    </div>
  );
};

// Regular game card component
const RegularGameCard = ({
  game,
  ranking,
}: {
  game: GameDbData;
  ranking?: number;
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [localDislikeCount, setLocalDislikeCount] = useState(
    game.dislike_count || 0,
  );

  // Sync local dislike count with prop changes (for live polling updates)
  // Only update if the prop count is higher than local (from other users' votes)
  useEffect(() => {
    const propCount = game.dislike_count || 0;
    if (propCount > localDislikeCount) {
      setLocalDislikeCount(propCount);
    }
  }, [game.dislike_count, localDislikeCount]);

  // Get unified platforms and their icons
  const unifiedPlatforms = unifyPlatforms(game.platforms);
  const displayedPlatforms = unifiedPlatforms.slice(0, 3); // Show only 3 platforms if more than 4
  const hasMorePlatforms = unifiedPlatforms.length > 3;
  const platformIconsData = displayedPlatforms.map((platform) =>
    getPlatformIcon(platform, game),
  );

  // Use throttled dislike hook for optimized API calls
  const { sendDislike } = useThrottledDislikeReaction({
    onOptimisticUpdate: (increment) => {
      setLocalDislikeCount((prev) => prev + increment);
    },
    onError: (error, increment) => {
      console.error('Failed to update dislike count:', error);
      setLocalDislikeCount((prev) => prev - increment);
    },
  });

  // Handle dislike vote
  const handleDislikeVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play().catch((error) => console.error('Error playing sound:', error));

    // Add button click animation
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);

    // Send dislike with throttling (always increment by 1)
    sendDislike(game.igdb_id, 1);
  };

  return (
    <div className="p-1">
      <Link href={`/detail/${game.slug}`}>
        <div className="group relative flex cursor-pointer flex-col rounded-lg border border-transparent bg-zinc-800 p-4 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:border-zinc-500/50 hover:bg-gradient-to-br hover:from-zinc-700/80 hover:via-slate-700/60 hover:to-zinc-600/80 hover:shadow-2xl hover:shadow-zinc-900/60">
          {/* Dislike Ranking Banner */}
          {ranking && (
            <Badge
              className={`absolute top-2 left-2 z-20 flex items-center gap-1 text-xs font-bold text-white shadow-lg ${
                ranking <= 5
                  ? 'bg-red-600/90 hover:bg-red-600'
                  : ranking <= 15
                    ? 'bg-orange-600/90 hover:bg-orange-600'
                    : 'bg-yellow-600/90 hover:bg-yellow-600'
              }`}
            >
              #{ranking}
            </Badge>
          )}

          {/* Dislike Button */}
          <motion.div
            className="absolute top-2 right-2 z-20"
            animate={
              isClicking
                ? {
                    scale: [1, 0.8, 1.1, 1],
                  }
                : {}
            }
            transition={{ duration: 0.2 }}
          >
            <Button
              size="icon"
              className="bg-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-500"
              aria-label="dislike"
              onClick={handleDislikeVote}
            >
              <ThumbsDown className="!h-[18px] !w-[18px] text-white" />
            </Button>
          </motion.div>

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
                  className="text-gray-500 transition-all duration-300 group-hover:scale-110 group-hover:text-gray-300"
                />
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <h3 className="truncate font-medium transition-all duration-300 group-hover:font-semibold group-hover:text-white">
              {game.name}
            </h3>
            {game.developers && (
              <h4 className="truncate text-sm text-gray-300">
                {game.developers[0]}
              </h4>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="mt-1 text-sm text-gray-400">
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
                                className="text-gray-400 hover:text-gray-200"
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
              </div>
              <p className="flex items-center text-sm font-bold text-red-400 transition-colors duration-300 group-hover:text-red-300">
                <ThumbsDown
                  size={14}
                  className="mr-1 flex-shrink-0 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:text-red-300"
                />
                <NumberFlow value={localDislikeCount} />
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Main component that decides which card to render
const MiniGameCard = ({
  game,
  ranking,
  placeholder,
}: {
  game?: GameDbData;
  ranking?: number;
  placeholder?: PlaceholderConfig;
}) => {
  // If placeholder is provided, render placeholder card
  if (placeholder) {
    return <PlaceholderCard config={placeholder} />;
  }

  // Regular game card
  if (!game) return null;

  return <RegularGameCard game={game} ranking={ranking} />;
};

export default MiniGameCard;
