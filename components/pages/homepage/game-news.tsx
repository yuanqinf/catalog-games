'use client';

import React from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { ExternalLink, Clock, Calendar } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsArticle {
  title: string;
  url: string;
  thumbnail?: string;
  publisher?: {
    name: string;
    url?: string;
    favicon?: string;
  };
  date?: string;
  publishedAt?: string;
  published_at?: string;
  publish_date?: string;
  excerpt?: string;
  authors?: string[];
}

interface NewsResponse {
  success: boolean;
  data: NewsArticle[];
  size?: number;
  totalHits?: number;
}

const fetcher = async (url: string): Promise<NewsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  return res.json();
};

const NewsCardSkeleton = () => (
  <div className="relative rounded-lg bg-zinc-800 p-4 min-w-[300px] h-full flex flex-col">
    <div className="aspect-video w-full">
      <Skeleton className="h-full w-full rounded-md bg-zinc-700" />
    </div>
    <div className="mt-3 flex-1 flex flex-col space-y-2">
      <Skeleton className="h-4 w-3/4 bg-zinc-700" />
      <Skeleton className="h-4 w-1/2 bg-zinc-700" />
      <div className="flex-1" />
      <div className="flex items-center gap-2 mt-auto">
        <Skeleton className="h-3 w-16 bg-zinc-700" />
        <Skeleton className="h-3 w-20 bg-zinc-700" />
      </div>
    </div>
  </div>
);

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const getArticleDate = (article: NewsArticle) => {
    const dateString = article.date || article.publishedAt || article.published_at || article.publish_date;
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const handleCardClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formattedDate = getArticleDate(article);

  return (
    <div
      className="relative cursor-pointer rounded-lg bg-zinc-800 p-4 transition-all hover:bg-zinc-700 group min-w-[300px] h-full flex flex-col"
      onClick={handleCardClick}
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
      <div className="mt-3 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-300 flex-1">
            {article.excerpt}
          </p>
        )}

        {/* Publisher and Date - pushed to bottom */}
        <div className="mt-auto pt-2 flex items-center gap-4 text-xs text-zinc-400">
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
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
};

const GameNews: React.FC = () => {
  const { data, error, isLoading } = useSWR<NewsResponse>(
    '/api/gaming-news',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Gaming News</h2>
        <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
          Failed to load gaming news. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gaming News</h2>
      </div>

      <div className="relative">
        <Carousel
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
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <NewsCardSkeleton />
                </CarouselItem>
              ))
              : // Actual news cards
              data?.data?.map((article, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <NewsCard article={article} />
                </CarouselItem>
              ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </section>
  );
};
1.
export default GameNews;