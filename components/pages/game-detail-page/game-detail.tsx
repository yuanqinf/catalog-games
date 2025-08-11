'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Gamepad2,
  Ghost,
  BriefcaseBusiness,
  Tag,
  Monitor,
  Calendar,
  ChartColumnIncreasing,
  UsersRound,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import GameDetailSection from '@/components/pages/game-detail-page/game-detail-section';
import GameDetailCard, {
  getDisplayValue,
} from '@/components/pages/game-detail-page/game-detail-card';

import GameDetailHighlight from './game-detail-highlight';

import { GameDbData } from '@/types';
import { getAvatarBorderColor } from '@/utils/steam-utils';
import {
  fetchSalesData,
  formatSalesValue,
  getSalesLabel,
  getSourceName,
  type SalesData,
} from '@/lib/sales/get-sales-data';
import {
  fetchSteamSalesDataFromSteamSpy,
  SteamSpyData,
} from '@/lib/steam/steamspy';
import {
  getPlaytrackerData,
  PlaytimeData,
} from '@/lib/playernet/get-playernet-data';
import FeaturedUserReviews from './game-detail-featured-review';

const GameDetail = ({ game }: { game: GameDbData }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [salesData, setSalesData] = useState<SalesData>({
    value: null,
    source: null,
  });
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [twitchLiveViewers, setTwitchLiveViewers] = useState<number | null>(
    null,
  );
  const [isLoadingTwitch, setIsLoadingTwitch] = useState(true);

  const [steamSpyData, setSteamSpyData] = useState<SteamSpyData | null>(null);
  const [isLoadingSteamSpy, setIsLoadingSteamSpy] = useState(true);

  const [playtrackerData, setPlaytrackerData] = useState<PlaytimeData | null>(
    null,
  );
  const [isLoadingPlaytracker, setIsLoadingPlaytracker] = useState(true);

  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // Fetch sales data with fallback logic
  useEffect(() => {
    const loadSalesData = async () => {
      setIsLoadingSales(true);

      try {
        const data = await fetchSalesData(game.slug, game.name);
        setSalesData(data);
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        setSalesData({ value: null, source: null });
      } finally {
        setIsLoadingSales(false);
      }
    };

    const loadTwitchData = async () => {
      if (!game.name) return;

      setIsLoadingTwitch(true);
      try {
        const response = await fetch(
          `/api/twitch?name=${encodeURIComponent(game.name)}`,
        );
        if (response.ok) {
          const result = await response.json();
          setTwitchLiveViewers(result.data?.liveViewers || null);
        }
      } catch (error) {
        console.error('Failed to fetch Twitch data:', error);
        setTwitchLiveViewers(null);
      } finally {
        setIsLoadingTwitch(false);
      }
    };

    const loadSteamSpyData = async () => {
      if (!game.name) return;
      setIsLoadingSteamSpy(true);
      try {
        const data = await fetchSteamSalesDataFromSteamSpy(game.name);
        setSteamSpyData(data);
      } catch (error) {
        console.error('Failed to fetch Steam Spy data:', error);
        setSteamSpyData(null);
      } finally {
        setIsLoadingSteamSpy(false);
      }
    };

    const loadPlaytrackerData = async () => {
      if (!game.name) return;
      setIsLoadingPlaytracker(true);
      try {
        const data = await getPlaytrackerData(game.name);
        setPlaytrackerData(data);
      } catch (error) {
        console.error('Failed to fetch Playtracker data:', error);
        setPlaytrackerData(null);
      } finally {
        setIsLoadingPlaytracker(false);
      }
    };

    loadSalesData();
    loadTwitchData();
    loadSteamSpyData();
    loadPlaytrackerData();
  }, [game.slug, game.name]);

  const avatarBorderColorClass = getAvatarBorderColor(
    game.steam_all_review ?? undefined,
  );

  const getYouTubeEmbedUrl = (id: string) => {
    if (!id) return '';
    return `https://www.youtube.com/embed/${id}`;
  };

  const mediaItems = [
    ...(game.videos?.map((v, index) => ({
      title: `${game.name} Video ${index + 1}`,
      url: getYouTubeEmbedUrl(v),
    })) || []),
  ];

  const handleVideoChange = (index: number) => {
    // Pause current video if it's playing
    if (iframeRefs.current[currentVideoIndex]) {
      const currentIframe = iframeRefs.current[currentVideoIndex];
      if (currentIframe && currentIframe.src) {
        // Remove autoplay and other parameters to pause
        const baseUrl = currentIframe.src.split('?')[0];
        currentIframe.src = baseUrl;
      }
    }

    setCurrentVideoIndex(index);
  };

  const currentMedia = mediaItems[currentVideoIndex];

  // Filter sections with data
  const detailsSections = [
    { title: 'Game Engine', items: game.game_engines, icon: Gamepad2 },
    { title: 'Developers', items: game.developers, icon: Ghost },
    { title: 'Publishers', items: game.publishers, icon: BriefcaseBusiness },
  ].filter((section) => section.items?.length);

  const metaSections = [
    { title: 'Genres', items: game.genres, icon: Tag },
    { title: 'Platforms', items: game.platforms, icon: Monitor },
  ].filter((section) => section.items?.length);

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <main className="container-3xl container mx-auto px-8">
        {/* Game Detail Main Section */}
        <section className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-10 lg:col-span-2">
            {/* Video Player Section */}
            <Card className="rounded-t-none pt-0 pb-4">
              <CardContent className="space-y-6 p-0">
                {/* Main Video Player */}
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <iframe
                    ref={(el) => {
                      iframeRefs.current[currentVideoIndex] = el;
                    }}
                    src={currentMedia.url ?? ''}
                    title={currentMedia.title}
                    allowFullScreen
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                {/* Thumbnail Navigation */}
                <div className="relative mx-4">
                  <Carousel className="mx-auto w-[90%]">
                    <CarouselContent>
                      {mediaItems.map((media, index) => (
                        <CarouselItem
                          key={index}
                          className="basis-1/3 px-3 md:basis-1/4 lg:basis-1/5"
                        >
                          <Button
                            onClick={() => handleVideoChange(index)}
                            variant="ghost"
                            className={`relative mx-2 mt-2 aspect-video h-auto w-full overflow-hidden rounded-md p-0 transition-all duration-200 ${
                              index === currentVideoIndex
                                ? 'ring-primary ring-2 ring-offset-1'
                                : 'hover:opacity-80'
                            }`}
                          >
                            <div className="bg-muted relative h-full w-full">
                              <Image
                                src={`https://img.youtube.com/vi/${media.url?.split('/').pop()}/mqdefault.jpg`}
                                alt={`${media.title} thumbnail`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-black/60 p-2">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </Button>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-[-32px] md:left-[-40px] lg:left-[-48px]" />
                    <CarouselNext className="right-[-32px] md:right-[-40px] lg:right-[-48px]" />
                  </Carousel>
                </div>
              </CardContent>
            </Card>
            {/* Game Information Section */}
            <div className="mb-8 space-y-6">
              {/* Title and Release Date */}
              <div className="flex items-start gap-4">
                {/* Game Avatar */}
                <div
                  className={`flex-shrink-0 rounded-full border-2 p-1 ${avatarBorderColorClass}`}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={game.cover_url ?? ''}
                      alt={`${game.name} avatar`}
                      fill
                      sizes="64px"
                      className="rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Title and Date */}
                <div className="flex-grow">
                  <h1 className="mb-2 text-4xl font-bold">{game.name}</h1>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <p className="text-muted-foreground">
                      {game.first_release_date
                        ? (() => {
                            const releaseDate = new Date(
                              game.first_release_date,
                            );
                            const now = new Date();
                            const isFuture = releaseDate > now;
                            return isFuture
                              ? `Expected to release on ${releaseDate.toLocaleDateString()}`
                              : `Released on ${releaseDate.toLocaleDateString()}`;
                          })()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {game.summary && (
                <div>
                  <h4
                    className={`leading-relaxed ${
                      isSummaryExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    {game.summary}
                  </h4>
                  {game.summary.length > 200 && (
                    <Button
                      onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                      variant="link"
                      className="text-muted-foreground mt-2 h-auto p-0 text-sm"
                    >
                      {isSummaryExpanded ? 'Show less' : 'Show all'}
                    </Button>
                  )}
                </div>
              )}

              {/* Game Details */}
              {detailsSections.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {detailsSections.map((section) => (
                    <GameDetailSection
                      key={section.title}
                      title={section.title}
                      items={section.items || undefined}
                      icon={section.icon}
                    />
                  ))}
                </div>
              )}

              {/* Genres and Platforms */}
              {metaSections.length > 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {metaSections.map((section) => (
                    <GameDetailSection
                      key={section.title}
                      title={section.title}
                      items={section.items || undefined}
                      icon={section.icon}
                      className="mb-3"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-2">
              <GameDetailCard
                icon={UsersRound}
                value={getDisplayValue(
                  isLoadingSales,
                  salesData.value,
                  (value) => formatSalesValue(value, salesData.source),
                )}
                label={getSalesLabel(salesData.source)}
                valueColor="text-yellow-500"
                isLoading={isLoadingSales}
                showTooltip={!!salesData.value}
                tooltipContent={
                  <div className="text-sm">
                    <p>Source: {getSourceName(salesData.source)}</p>
                    {salesData.asOfDate && (
                      <p>Data as of: {salesData.asOfDate}</p>
                    )}
                  </div>
                }
              />
              <GameDetailCard
                icon={ChartColumnIncreasing}
                value={getDisplayValue(
                  isLoadingTwitch,
                  twitchLiveViewers,
                  (viewers) => '~ ' + viewers.toLocaleString(),
                )}
                label="Live viewers"
                valueColor="text-purple-500"
                isLoading={isLoadingTwitch}
                showTooltip={!!twitchLiveViewers}
                tooltipContent={<p>Source: Twitch</p>}
              />
              <GameDetailCard
                icon={Trophy}
                value={getDisplayValue(
                  isLoadingSteamSpy && isLoadingPlaytracker,
                  steamSpyData?.averagePlaytime ||
                    playtrackerData?.averagePlaytime,
                  (value) =>
                    steamSpyData?.averagePlaytime ? `~ ${value} hours` : value,
                )}
                label="Average Playtime"
                valueColor="text-blue-500"
                isLoading={isLoadingSteamSpy && isLoadingPlaytracker}
                showTooltip={
                  !!(
                    steamSpyData?.averagePlaytime ||
                    playtrackerData?.averagePlaytime
                  )
                }
                tooltipContent={
                  <div className="text-sm">
                    <p>
                      Source:{' '}
                      {steamSpyData?.averagePlaytime
                        ? 'Steam Spy'
                        : 'Playtracker.net'}
                    </p>
                  </div>
                }
              />
            </div>

            {/* Featured User Reviews Section */}
            {game.id && <FeaturedUserReviews gameId={game.id} />}
          </div>

          {/* Right Column */}
          <GameDetailHighlight game={game} />
        </section>
      </main>
    </div>
  );
};

export default GameDetail;
