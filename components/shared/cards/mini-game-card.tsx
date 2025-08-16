import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Bookmark, Calendar, Star } from 'lucide-react';
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
import type { GameDbData } from '@/types';
import { unifyPlatforms, type UnifiedPlatform } from '@/utils/platform-utils';
import { useGameRating } from '@/hooks/useGameRating';

type PlatformIconData = {
  type: 'fontawesome';
  icon: any;
};

// Map UnifiedPlatform to FontAwesome icons
const getPlatformIcon = (
  platform: UnifiedPlatform,
  game: GameDbData,
): PlatformIconData => {
  const iconMap: Record<UnifiedPlatform, PlatformIconData> = {
    PC: { type: 'fontawesome', icon: game.steam_app_id ? faSteam : faWindows },
    MAC: { type: 'fontawesome', icon: faApple },
    PS: { type: 'fontawesome', icon: faPlaystation },
    XBOX: { type: 'fontawesome', icon: faXbox },
    NINTENDO: { type: 'fontawesome', icon: faGamepad },
    SWITCH: { type: 'fontawesome', icon: faGamepad },
    GAMEBOY: { type: 'fontawesome', icon: faGamepad },
    MOBILE: { type: 'fontawesome', icon: faAndroid },
  };

  return iconMap[platform] || { type: 'fontawesome', icon: faGamepad };
};

const MiniGameCard = ({ game }: { game: GameDbData }) => {
  const { overallAverage } = useGameRating(game.id);

  // Get unified platforms and their icons
  const unifiedPlatforms = unifyPlatforms(game.platforms);
  const platformIconsData = unifiedPlatforms
    .slice(0, 4)
    .map((platform) => getPlatformIcon(platform, game));

  return (
    <div className="p-1">
      <div className="relative flex flex-col rounded-lg bg-zinc-800 p-4">
        <Bookmark
          size={20}
          className="absolute top-6 right-6 z-10 cursor-pointer text-white hover:text-yellow-400"
          // TODO: Add onClick handler for bookmark functionality
        />
        <div
          className="relative mb-2 overflow-hidden rounded bg-zinc-700"
          style={{ aspectRatio: '672/895' }}
        >
          {game.cover_url ? (
            <Image
              src={game.cover_url}
              alt={game.name}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 size={40} className="text-zinc-500" />
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <Link href={`/detail/${game.slug}`} className="hover:underline">
            <h3 className="truncate font-medium">{game.name}</h3>
          </Link>
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
                  {`Release: ${new Date(game.first_release_date).toLocaleDateString('en-CA')}`}
                </span>
              ) : (
                <span className="flex items-center">
                  <div className="flex gap-1">
                    {platformIconsData.map((iconData, index) => (
                      <FontAwesomeIcon
                        key={index}
                        icon={iconData.icon}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </span>
              )}
            </div>
            <p className="flex items-center text-sm text-zinc-400">
              <Star size={14} className="mr-1 flex-shrink-0 text-yellow-400" />
              {overallAverage ? overallAverage : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGameCard;
