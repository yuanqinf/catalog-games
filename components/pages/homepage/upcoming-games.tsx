import React, { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import PaginationDots from '@/components/shared/pagination-dots';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import { mockUpcomingGamesData } from '@/constants/mock-game-data';
import { Calendar, TrendingUp } from 'lucide-react';

const UpcomingGames = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="mb-12">
      {/* Enhanced Section Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
          </div>
        </div>

        {/* TODO: Add view all button */}
        <div className="hidden cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white md:flex">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">View All</span>
        </div>
      </div>

      {/* Enhanced Carousel */}
      <div className="relative overflow-visible">
        <Carousel
          setApi={(apiInstance) => {
            setCarouselApi(apiInstance);
            if (apiInstance) {
              apiInstance.on('select', () => {
                if (apiInstance) {
                  setActiveIndex(apiInstance.selectedScrollSnap());
                }
              });
              // Set initial activeIndex
              setActiveIndex(apiInstance.selectedScrollSnap());
            }
          }}
          opts={{
            align: 'start',
            slidesToScroll: 1,
          }}
          className="w-full overflow-visible"
        >
          <CarouselContent className="-ml-2 overflow-visible md:-ml-4">
            {mockUpcomingGamesData.map((game, i) => {
              // Transform GameData to GameDbData format for MiniGameCard
              const transformedGame = {
                ...game,
                id: i + 1, // Use index as numeric id
                igdb_id: i + 1, // Required field for GameDbData
                slug: game.id, // Use original string id as slug
                developers: [game.developer],
                publishers: [game.publisher],
                genres: game.genre,
                platforms: game.platforms,
                cover_url: game.images.thumbnail,
                banner_url: game.images.banner,
                first_release_date: game.release_date || null,
              };

              return (
                <CarouselItem
                  key={`upcoming-${i}`}
                  className="basis-[280px] pt-4 pb-6 pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/5 xl:basis-1/6"
                >
                  <MiniGameCard game={transformedGame} />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Mobile Pagination Dots */}
        <div className="mt-6 flex items-center justify-center sm:hidden">
          <PaginationDots
            totalItems={mockUpcomingGamesData.length}
            activeIndex={activeIndex}
            carouselApi={carouselApi}
          />
        </div>
      </div>
    </section>
  );
};

export default UpcomingGames;
