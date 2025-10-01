'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Ghost,
  BriefcaseBusiness,
  Tag,
  Monitor,
  ChartColumnIncreasing,
  UsersRound,
  Trophy,
  ArrowLeft,
  ThumbsDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import GameDetailSection from '@/components/pages/game-detail-page/game-detail-section';

import GameDetailHighlight from './game-detail-highlight';
import GameDetailHeadline from './game-detail-headline';

import { GameDbData } from '@/types';
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
import { useSteamReviews } from '@/hooks/useSteamReviews';

// Interface for floating thumbs animation
interface FloatingThumb {
  id: string;
  timestamp: number;
  startX: number;
  startY: number;
  isPowerMode?: boolean;
}

// Interface for user vote state
interface UserVoteState {
  continuousClicks: number;
  lastClickTime: number;
  isPowerMode: boolean;
}

// Interface for dislike response
interface DislikeResponse {
  success: boolean;
  data?: {
    gameId: number;
    igdbId: number;
    newDislikeCount: number;
    incrementBy: number;
  };
  error?: string;
}

const GameDetail = ({ game }: { game: GameDbData }) => {
  // Dislike functionality states
  const [dislikeCount, setDislikeCount] = useState(game.dislike_count || 0);
  const [isDislikeLoading, setIsDislikeLoading] = useState(false);
  const [clickingButton, setClickingButton] = useState(false);
  const userDislikeCount = 347; // Mock data for now

  // Floating thumbs animation state
  const [floatingThumbs, setFloatingThumbs] = useState<FloatingThumb[]>([]);

  // User voting state for power mode
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({
    continuousClicks: 0,
    lastClickTime: 0,
    isPowerMode: false,
  });
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

  const { steamReviews } = useSteamReviews(game.name);

  // Handle dislike vote with floating animation
  const handleDislikeVote = async () => {
    if (isDislikeLoading) return;

    const currentTime = Date.now();
    setIsDislikeLoading(true);

    // Add button click animation
    setClickingButton(true);
    setTimeout(() => setClickingButton(false), 200);

    // Update continuous click tracking and power mode
    setUserVoteState((prev) => {
      const timeSinceLastClick = currentTime - prev.lastClickTime;
      const isConsecutive = timeSinceLastClick < 5000; // Within 5 seconds

      const newContinuousClicks = isConsecutive ? prev.continuousClicks + 1 : 1;
      const newIsPowerMode = newContinuousClicks >= 10;

      return {
        continuousClicks: newContinuousClicks,
        lastClickTime: currentTime,
        isPowerMode: newIsPowerMode,
      };
    });

    // Create floating animation in the banner/cover area
    const isPowerMode = userVoteState.continuousClicks >= 9;
    const increment = isPowerMode ? 3 : 1;

    const newThumb: FloatingThumb = {
      id: `thumb-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      startX: Math.random() * 70 + 15, // Random position between 15% and 85%
      startY: Math.random() * 30 + 60, // Random Y position in the banner area
      isPowerMode,
    };

    setFloatingThumbs((prev) => [...prev, newThumb]);

    // Optimistically update the UI
    setDislikeCount((prev) => prev + increment);

    // Call backend API to update the database
    try {
      const response = await fetch('/api/games/dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          igdbId: game.igdb_id,
          incrementBy: increment,
        }),
      });

      const result: DislikeResponse = await response.json();

      if (!result.success) {
        console.error('Failed to update dislike count:', result.error);
        // Revert optimistic update on error
        setDislikeCount((prev) => prev - increment);
      }
    } catch (error) {
      console.error('Error calling dislike API:', error);
      // Revert optimistic update on error
      setDislikeCount((prev) => prev - increment);
    } finally {
      setIsDislikeLoading(false);
    }
  };

  // Reset power mode after 3 seconds of inactivity
  useEffect(() => {
    if (userVoteState.isPowerMode) {
      const timer = setTimeout(() => {
        setUserVoteState((prev) => ({
          ...prev,
          isPowerMode: false,
          continuousClicks: 0,
        }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [userVoteState.lastClickTime, userVoteState.isPowerMode]);

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

  // Filter statistics sections with data - only show sections that have actual data
  const statisticsSections = [
    // Sales Data - only show if we have data
    ...(salesData.value
      ? [
          {
            title: getSalesLabel(salesData.source),
            items: [formatSalesValue(salesData.value, salesData.source)],
            icon: UsersRound,
            showTooltip: true,
            tooltipContent: (
              <div className="text-sm">
                <p>Source: {getSourceName(salesData.source)}</p>
                {salesData.asOfDate && <p>Data as of: {salesData.asOfDate}</p>}
              </div>
            ),
          },
        ]
      : []),

    // Live Viewers - only show if we have data
    ...(twitchLiveViewers
      ? [
          {
            title: 'Live viewers',
            items: [`~ ${twitchLiveViewers.toLocaleString()}`],
            icon: ChartColumnIncreasing,
            showTooltip: true,
            tooltipContent: <p>Source: Twitch</p>,
          },
        ]
      : []),

    // Average Playtime - only show if we have data
    ...(steamSpyData?.averagePlaytime || playtrackerData?.averagePlaytime
      ? [
          {
            title: 'Average Playtime',
            items: [
              steamSpyData?.averagePlaytime
                ? `~ ${steamSpyData.averagePlaytime} hours`
                : (playtrackerData?.averagePlaytime as string),
            ],
            icon: Trophy,
            showTooltip: true,
            tooltipContent: (
              <div className="text-sm">
                <p>
                  Source:{' '}
                  {steamSpyData?.averagePlaytime
                    ? 'Steam Spy'
                    : 'Playtracker.net'}
                </p>
              </div>
            ),
          },
        ]
      : []),
  ];

  // Show loading placeholder for statistics while any are still loading
  const showStatisticsLoading =
    isLoadingSales ||
    isLoadingTwitch ||
    (isLoadingSteamSpy && isLoadingPlaytracker);

  return (
    <div className="bg-background text-foreground min-h-screen w-full p-4">
      <main className="container-3xl container mx-auto px-8">
        {/* Back Button - Top Left */}
        <div className="mb-6">
          <Link href="/explore">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Top 100
            </Button>
          </Link>
        </div>

        {/* Headline Section */}
        <GameDetailHeadline
          gameId={game.id || 0}
          gameName={game.name}
          gameCoverUrl={game.cover_url || undefined}
          gameReleaseDate={
            game.first_release_date
              ? new Date(game.first_release_date).getTime()
              : undefined
          }
        />

        {/* Game Detail Main Section */}
        <section className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-10 lg:col-span-2">
            {/* Game Banner Section with Floating Animations */}
            {game.banner_url && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <Image
                  src={game.banner_url}
                  alt={`${game.name} banner`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 50vw"
                  className="object-cover"
                  priority
                />

                {/* Floating Thumbs Down Animations */}
                <AnimatePresence>
                  {floatingThumbs.map((thumb) => (
                    <motion.div
                      key={thumb.id}
                      className="pointer-events-none absolute z-50"
                      style={{
                        left: `${thumb.startX}%`,
                        top: `${thumb.startY}%`,
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0.2,
                        y: 0,
                      }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: thumb.isPowerMode
                          ? [0.2, 2.2, 2.0, 1.3]
                          : [0.2, 1.5, 1.3, 0.9],
                        y: thumb.isPowerMode
                          ? [0, -60, -180, -350]
                          : [0, -40, -120, -250],
                      }}
                      exit={{
                        opacity: 0,
                        scale: thumb.isPowerMode ? 1.0 : 0.6,
                        y: thumb.isPowerMode ? -400 : -300,
                      }}
                      transition={{
                        duration: thumb.isPowerMode ? 3.5 : 2.5,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        times: [0, 0.15, 0.6, 1],
                      }}
                      onAnimationComplete={() => {
                        setFloatingThumbs((prev) =>
                          prev.filter((t) => t.id !== thumb.id),
                        );
                      }}
                    >
                      <ThumbsDown
                        className={`drop-shadow-2xl ${
                          thumb.isPowerMode
                            ? 'h-12 w-12 text-red-400'
                            : 'h-8 w-8 text-red-500'
                        }`}
                        fill="currentColor"
                      />
                      {thumb.isPowerMode && (
                        <motion.div
                          className="absolute -inset-2 rounded-full bg-red-500/30"
                          animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.8, 0.3, 0.8],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {/* Game Information Section */}
            <div className="mb-8 space-y-6">
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

              {/* Statistics Sections */}
              {showStatisticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-gray-400"></div>
                    <span className="text-sm">Loading game statistics...</span>
                  </div>
                </div>
              ) : (
                statisticsSections.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {statisticsSections.map((section) => (
                      <GameDetailSection
                        key={section.title}
                        title={section.title}
                        items={section.items}
                        icon={section.icon}
                        className="mb-3"
                        showTooltip={section.showTooltip}
                        tooltipContent={section.tooltipContent}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Column */}
          <GameDetailHighlight
            game={game}
            dislikeCount={dislikeCount}
            userDislikeCount={userDislikeCount}
            isDislikeLoading={isDislikeLoading}
            clickingButton={clickingButton}
            userVoteState={userVoteState}
            onDislikeVote={handleDislikeVote}
          />
        </section>
      </main>
    </div>
  );
};

export default GameDetail;
