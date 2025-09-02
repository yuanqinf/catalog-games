'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { ExternalLink, Clock, Calendar, Newspaper } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationDots from '@/components/shared/pagination-dots';
import { NewsArticle, NewsResponse } from '@/types';

const NewsCardSkeleton = () => (
  <div className="relative flex h-full min-w-[300px] flex-col rounded-lg bg-zinc-800 p-4">
    <div className="aspect-video w-full">
      <Skeleton className="h-full w-full rounded-md bg-zinc-700" />
    </div>
    <div className="mt-3 flex flex-1 flex-col space-y-2">
      <Skeleton className="h-4 w-3/4 bg-zinc-700" />
      <Skeleton className="h-4 w-1/2 bg-zinc-700" />
      <div className="flex-1" />
      <div className="mt-auto flex items-center gap-2">
        <Skeleton className="h-3 w-16 bg-zinc-700" />
        <Skeleton className="h-3 w-20 bg-zinc-700" />
      </div>
    </div>
  </div>
);

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="group relative flex h-full min-w-[300px] cursor-pointer flex-col rounded-lg bg-zinc-800 p-4 transition-all hover:bg-zinc-700"
      onClick={() => {
        if (article.url) {
          window.open(article.url, '_blank', 'noopener,noreferrer');
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden rounded-md bg-zinc-700">
        {article.thumbnail ? (
          <Image
            src={article.thumbnail}
            alt={article.title}
            width={300}
            height={169}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ExternalLink size={40} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 flex flex-1 flex-col">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-blue-400">
          {article.title}
        </h3>

        {/* Description */}
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 flex-1 text-xs text-zinc-300">
            {article.excerpt}
          </p>
        )}

        {/* Publisher and Date - pushed to bottom */}
        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-zinc-400">
          {article.publisher?.name && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{article.publisher.name}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* External link indicator */}
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
};

const GameNews: React.FC = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, error, isLoading } = useSWR<NewsResponse>(
    '/api/gaming-news',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch news');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Gaming News</h2>
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          Failed to load gaming news. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Gaming News</h2>
          </div>
        </div>
      </div>

      <div className="relative">
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
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {isLoading
              ? // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                  >
                    <NewsCardSkeleton />
                  </CarouselItem>
                ))
              : // Actual news cards - show only 5 articles with publishers
                data?.data
                  ?.filter((article) => article.publisher?.name)
                  .slice(0, 5)
                  .map((article, index) => (
                    <CarouselItem
                      key={index}
                      className="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                    >
                      <NewsCard article={article} />
                    </CarouselItem>
                  ))}
          </CarouselContent>
        </Carousel>

        {/* Pagination Dots */}
        <div className="mt-6 flex items-center justify-center sm:hidden">
          <PaginationDots
            totalItems={
              data?.data
                ?.filter((article) => article.publisher?.name)
                .slice(0, 5).length || 5
            }
            activeIndex={activeIndex}
            carouselApi={carouselApi}
          />
        </div>
      </div>
    </section>
  );
};

export default GameNews;
