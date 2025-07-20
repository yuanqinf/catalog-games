import Image from 'next/image';
import { GameData } from '@/constants/mock-game-data';
import { Gamepad2, Bookmark, Calendar, Star } from 'lucide-react';

const MiniGameCard = ({ game }: { game: GameData }) => {
  const calculateAverageRating = (ratings: Record<string, number>) => {
    const average = (
      Object.values(ratings).reduce((sum, rating) => sum + rating, 0) /
      Object.values(ratings).length
    ).toFixed(1);
    return average === '0.0' ? 'N/A' : average;
  };

  return (
    <div className="p-1">
      <div className="relative flex flex-col rounded-lg bg-zinc-800 p-4">
        <Bookmark
          size={20}
          className="absolute top-6 right-6 z-10 cursor-pointer text-white hover:text-yellow-400"
          // TODO: Add onClick handler for bookmark functionality
        />
        <div className="relative mb-2 aspect-square overflow-hidden rounded bg-zinc-700">
          {game.images.thumbnail ? (
            <Image
              src={game.images.thumbnail}
              alt={game.name}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 size={40} className="text-zinc-500" />
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <h3 className="truncate font-medium">{game.name}</h3>
          <h4 className="truncate text-sm text-zinc-300">{game.developer}</h4>
          <div className="flex justify-between gap-2">
            <p className="text-sm text-zinc-400">
              {game.release_date &&
              new Date(game.release_date).getTime() > Date.now() ? (
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                  {`Release: ${game.release_date}`}
                </span>
              ) : (
                <span className="flex items-center">
                  <Gamepad2 size={14} className="mr-1.5 flex-shrink-0" />
                  {`Platforms: ${game.platforms.join(', ')}`}
                </span>
              )}
            </p>
            <p className="flex items-center text-sm text-zinc-400">
              <Star size={14} className="mr-1 flex-shrink-0 text-yellow-400" />
              {game.catalog_rating &&
                calculateAverageRating(game.catalog_rating)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGameCard;
