import Image from 'next/image';
import { Gamepad2, Bookmark, Calendar, Star } from 'lucide-react';
import type { GameDbData } from '@/types';
import { formatPlatformsForDisplay } from '@/utils/platform-utils';

const MiniGameCard = ({ game }: { game: GameDbData }) => {
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
          <h3 className="truncate font-medium">{game.name}</h3>
          {game.developers && (
            <h4 className="truncate text-sm text-zinc-300">
              {game.developers[0]}
            </h4>
          )}
          <div className="flex justify-between gap-2">
            <p className="text-sm text-zinc-400">
              {game.first_release_date &&
              new Date(game.first_release_date).getTime() > Date.now() ? (
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                  {`Release: ${game.first_release_date}`}
                </span>
              ) : (
                <span className="flex items-center">
                  <Gamepad2 size={14} className="mr-1.5 flex-shrink-0" />
                  {`Platforms: ${formatPlatformsForDisplay(game.platforms, 3)}`}
                </span>
              )}
            </p>
            <p className="flex items-center text-sm text-zinc-400">
              <Star size={14} className="mr-1 flex-shrink-0 text-yellow-400" />
              {/* TODO: Add rating */}
              {'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGameCard;
