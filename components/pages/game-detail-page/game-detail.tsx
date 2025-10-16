'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Hammer,
  BriefcaseBusiness,
  Tag,
  Monitor,
  ChartColumnIncreasing,
  UsersRound,
  Trophy,
  ArrowLeft,
  ThumbsDown,
  Joystick,
  SmilePlus,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faFaceGrinTongue,
  faFaceGrinBeamSweat,
  faFaceSurprise,
  faFaceSadTear,
  faFaceRollingEyes,
  faFaceMeh,
  faFaceGrimace,
  faFaceAngry,
  faFaceDizzy,
  faFaceFrown,
  faFaceFlushed,
  faFaceTired,
  faHeartCrack,
  faBug,
  faPoop,
} from '@fortawesome/free-solid-svg-icons';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import GameDetailSection from '@/components/pages/game-detail-page/game-detail-section';

import GameDetailHighlight, { StatisticItem } from './game-detail-highlight';
import GameDetailHeadline from './game-detail-headline';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';
import NumberFlow from '@number-flow/react';

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

// Interface for floating thumbs animation
interface FloatingThumb {
  id: string;
  timestamp: number;
  startX: number;
  startY: number;
  isPowerMode?: boolean;
}

// Interface for floating emoji animation
interface FloatingEmoji {
  id: string;
  icon: any;
  timestamp: number;
  startX: number;
  startY: number;
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
  const { isSignedIn } = useUser();

  // Floating thumbs animation state
  const [floatingThumbs, setFloatingThumbs] = useState<FloatingThumb[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [clickingButton, setClickingButton] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  // User voting state for power mode
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({
    continuousClicks: 0,
    lastClickTime: 0,
    isPowerMode: false,
  });

  // Track pending votes to batch API calls
  const pendingVotesRef = useRef<number>(0);
  const voteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch dislike count and user dislike count with SWR
  const { data: dislikeData, mutate: mutateDislike } = useSWR<{
    dislikeCount: number;
    userDislikeCount: number;
  }>(
    game.id ? ['game-dislike', game.id] : null,
    async ([, gameId]: [string, number]) => {
      const [dislikeResponse, userDislikeResponse] = await Promise.all([
        fetch(`/api/games/dislike?gameId=${gameId}`),
        fetch(`/api/users/dislikes?gameId=${gameId}`),
      ]);

      const dislikeResult = await dislikeResponse.json();
      const userDislikeResult = await userDislikeResponse.json();

      return {
        dislikeCount: dislikeResult.success
          ? dislikeResult.data.dislikeCount
          : 0,
        userDislikeCount: userDislikeResult.success
          ? userDislikeResult.data.userDislikeCount
          : 0,
      };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
      onSuccess: (newData, key, config) => {
        // Trigger animations when count increases from polling
        if (
          dislikeData &&
          newData.dislikeCount > dislikeData.dislikeCount &&
          game.id
        ) {
          triggerCountIncreaseAnimations(
            game.id.toString(),
            dislikeData.dislikeCount,
            newData.dislikeCount,
            setFloatingThumbs,
            (itemId, animationId) => ({
              id: animationId,
              timestamp: Date.now(),
              startX: Math.random() * 70 + 15,
              startY: Math.random() * 30 + 60,
              isPowerMode: false,
            }),
            'thumb-polling',
          );
        }
      },
    },
  );

  const dislikeCount = dislikeData?.dislikeCount ?? game.dislike_count ?? 0;
  const userDislikeCount = dislikeData?.userDislikeCount ?? 0;
  const isLoadingUserDislike = !dislikeData;
  const [salesData, setSalesData] = useState<SalesData>({
    value: null,
    source: null,
  });
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [twitchLiveViewers, setTwitchLiveViewers] = useState<number | null>(
    null,
  );
  const [isLoadingTwitch, setIsLoadingTwitch] = useState(true);
  const [steamCurrentPlayers, setSteamCurrentPlayers] = useState<number | null>(
    null,
  );
  const [isLoadingSteamPlayers, setIsLoadingSteamPlayers] = useState(true);

  const [steamSpyData, setSteamSpyData] = useState<SteamSpyData | null>(null);
  const [isLoadingSteamSpy, setIsLoadingSteamSpy] = useState(true);

  const [playtrackerData, setPlaytrackerData] = useState<PlaytimeData | null>(
    null,
  );
  const [isLoadingPlaytracker, setIsLoadingPlaytracker] = useState(true);

  // Fetch emoji reactions with real-time polling using SWR
  const {
    data: emojiReactionsData,
    mutate: mutateEmojiReactions,
    isLoading: isLoadingEmojiReactions,
  } = useSWR(
    game.id ? `/api/games/emoji-reaction?gameId=${game.id}` : null,
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch emoji reactions');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: 5000, // Poll every 5 seconds for real-time updates
      dedupingInterval: 1000,
    },
  );

  const emojiReactions = emojiReactionsData?.success
    ? emojiReactionsData.data
    : {};
  const hasEmojiReactions = Object.keys(emojiReactions).length > 0;

  // Handle emoji reaction click
  const handleEmojiClick = async (icon: any, name: string) => {
    // Check if user is signed in
    if (!isSignedIn) {
      setShowSignInDialog(true);
      setIsEmojiPickerOpen(false);
      return;
    }

    console.log('Selected icon:', name);

    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play();

    // Create floating emoji animation
    const newEmoji: FloatingEmoji = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      icon: icon,
      timestamp: Date.now(),
      startX: Math.random() * 70 + 15,
      startY: Math.random() * 30 + 35,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);

    // Optimistically update UI immediately using SWR's mutate
    mutateEmojiReactions(
      (currentData: any) => {
        if (!currentData?.success) return currentData;
        return {
          ...currentData,
          data: {
            ...currentData.data,
            [name]: (currentData.data[name] || 0) + 1,
          },
        };
      },
      false, // Don't revalidate immediately
    );

    // Save to database
    try {
      const response = await fetch('/api/games/emoji-reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: game.id,
          emojiName: name,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to save emoji reaction:', result.error);
      } else {
        // Success - immediately fetch fresh data from server
        mutateEmojiReactions();
      }
    } catch (error) {
      console.error('Error saving emoji reaction:', error);
      // Revert optimistic update on error
      mutateEmojiReactions();
    }
  };

  // Get emoji icon by name
  const getEmojiIcon = (name: string) => {
    const emojiMap: Record<string, any> = {
      angry: faFaceAngry,
      frown: faFaceFrown,
      tired: faFaceTired,
      dizzy: faFaceDizzy,
      surprised: faFaceSurprise,
      'grin-beam-sweat': faFaceGrinBeamSweat,
      'sad-tear': faFaceSadTear,
      'rolling-eyes': faFaceRollingEyes,
      meh: faFaceMeh,
      grimace: faFaceGrimace,
      flushed: faFaceFlushed,
      'grin-tongue': faFaceGrinTongue,
      'heart-crack': faHeartCrack,
      bug: faBug,
      poop: faPoop,
    };
    return emojiMap[name];
  };

  // Available emoji reactions
  const availableEmojis = [
    { icon: faFaceAngry, name: 'angry' },
    { icon: faFaceFrown, name: 'frown' },
    { icon: faFaceTired, name: 'tired' },
    { icon: faFaceDizzy, name: 'dizzy' },
    { icon: faFaceSurprise, name: 'surprised' },
    { icon: faFaceGrinBeamSweat, name: 'grin-beam-sweat' },
    { icon: faFaceSadTear, name: 'sad-tear' },
    { icon: faFaceRollingEyes, name: 'rolling-eyes' },
    { icon: faFaceMeh, name: 'meh' },
    { icon: faFaceGrimace, name: 'grimace' },
    { icon: faFaceFlushed, name: 'flushed' },
    { icon: faFaceGrinTongue, name: 'grin-tongue' },
    { icon: faHeartCrack, name: 'heart-crack' },
    { icon: faBug, name: 'bug' },
    { icon: faPoop, name: 'poop' },
  ];

  // Render emoji picker popover content
  const renderEmojiPickerContent = () => (
    <PopoverContent className="w-80 p-4" align="start">
      <div className="grid grid-cols-5 gap-2">
        {availableEmojis.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            size="icon"
            onClick={() => handleEmojiClick(item.icon, item.name)}
            className="h-12 w-12 transition-transform hover:scale-125"
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="!h-6 !w-6 text-yellow-400"
            />
          </Button>
        ))}
      </div>
    </PopoverContent>
  );

  // Fetch sales data with fallback logic
  useEffect(() => {
    const loadSalesData = async () => {
      setIsLoadingSales(true);

      try {
        // 8 second timeout for sales data
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Sales data request timeout')),
            8000,
          ),
        );
        const data = await Promise.race([
          fetchSalesData(game.slug, game.name),
          timeoutPromise,
        ]);
        setSalesData(data as SalesData);
      } catch (error) {
        // Only log non-timeout errors to reduce noise
        if (error instanceof Error && !error.message.includes('timeout')) {
          console.error('Failed to fetch sales data:', error);
        }
        setSalesData({ value: null, source: null });
      } finally {
        setIsLoadingSales(false);
      }
    };

    const loadTwitchData = async () => {
      if (!game.name) return;

      setIsLoadingTwitch(true);
      try {
        // 5 second timeout for Twitch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `/api/twitch?name=${encodeURIComponent(game.name)}`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

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

    const loadSteamCurrentPlayers = async () => {
      if (!game.steam_app_id) {
        setIsLoadingSteamPlayers(false);
        return;
      }

      setIsLoadingSteamPlayers(true);
      try {
        // 3 second timeout for Steam players (should be fast)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(
          `/api/steam/current-players?appId=${game.steam_app_id}`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          setSteamCurrentPlayers(result.playerCount || null);
        } else {
          setSteamCurrentPlayers(null);
        }
      } catch (error) {
        console.error('Failed to fetch Steam current players:', error);
        setSteamCurrentPlayers(null);
      } finally {
        setIsLoadingSteamPlayers(false);
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
    loadSteamCurrentPlayers();
    loadSteamSpyData();
    loadPlaytrackerData();
  }, [game.slug, game.name, game.steam_app_id]);

  // Handle dislike vote with floating animation
  const handleDislikeVote = async () => {
    const currentTime = Date.now();

    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play().catch((error) => console.error('Error playing sound:', error));

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

    // Optimistically update SWR cache immediately
    mutateDislike(
      (current) =>
        current
          ? {
              dislikeCount: current.dislikeCount + increment,
              userDislikeCount: current.userDislikeCount + increment,
            }
          : current,
      { revalidate: false },
    );

    // Batch API calls - accumulate votes and send after a short delay
    pendingVotesRef.current += increment;

    // Clear existing timer if any
    if (voteTimerRef.current) {
      clearTimeout(voteTimerRef.current);
    }

    // Set new timer to batch votes (300ms delay)
    voteTimerRef.current = setTimeout(async () => {
      const totalIncrement = pendingVotesRef.current;
      pendingVotesRef.current = 0;
      voteTimerRef.current = null;

      // Call backend API to update the database with batched votes
      try {
        const response = await fetch('/api/games/dislike', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            igdbId: game.igdb_id,
            incrementBy: totalIncrement,
          }),
        });

        const result: DislikeResponse = await response.json();

        if (!result.success) {
          console.error('Failed to update dislike count:', result.error);
          // Revert optimistic update on error
          mutateDislike();
        } else {
          // Success - refresh from server
          mutateDislike();
        }
      } catch (error) {
        console.error('Error calling dislike API:', error);
        // Revert optimistic update on error
        mutateDislike();
      }
    }, 300);
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
    { title: 'Developers', items: game.developers, icon: Hammer },
    { title: 'Publishers', items: game.publishers, icon: BriefcaseBusiness },
  ].filter((section) => section.items?.length);

  const metaSections = [
    { title: 'Genres', items: game.genres, icon: Tag },
    { title: 'Platforms', items: game.platforms, icon: Monitor },
  ].filter((section) => section.items?.length);

  // Convert statistics to StatisticItem format for the highlight component
  const highlightStatistics: StatisticItem[] = [
    // Sales Data
    ...(salesData.value
      ? [
          {
            title: getSalesLabel(salesData.source),
            value: formatSalesValue(salesData.value, salesData.source),
            icon: UsersRound,
            tooltipContent: (
              <div className="text-sm">
                <p>Source: {getSourceName(salesData.source)}</p>
                {salesData.asOfDate && <p>Data as of: {salesData.asOfDate}</p>}
              </div>
            ),
          },
        ]
      : []),

    // Steam Current Players
    ...(steamCurrentPlayers !== null && steamCurrentPlayers > 0
      ? [
          {
            title: 'Current players',
            value: steamCurrentPlayers.toLocaleString(),
            icon: Joystick,
            tooltipContent: <p>Source: Steam (Live)</p>,
          },
        ]
      : []),

    // Live Viewers
    ...(twitchLiveViewers
      ? [
          {
            title: 'Live viewers',
            value: `${twitchLiveViewers.toLocaleString()}`,
            icon: ChartColumnIncreasing,
            tooltipContent: <p>Source: Twitch</p>,
          },
        ]
      : []),

    // Average Playtime
    ...(steamSpyData?.averagePlaytime || playtrackerData?.averagePlaytime
      ? [
          {
            title: 'Average Playtime',
            value: steamSpyData?.averagePlaytime
              ? `${steamSpyData.averagePlaytime} hours`
              : (playtrackerData?.averagePlaytime as string),
            icon: Trophy,
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

  // Only show loading if ALL statistics are still loading (initial load)
  // This prevents blocking the UI if only one API is slow
  const showStatisticsLoading =
    isLoadingSales &&
    isLoadingTwitch &&
    isLoadingSteamPlayers &&
    isLoadingSteamSpy &&
    isLoadingPlaytracker;

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
          dislikeCount={dislikeCount}
        />

        {/* Game Detail Main Section */}
        <section className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Game Banner Section with Floating Animations */}
            {game.banner_url && (
              <div className="relative aspect-video w-full overflow-visible rounded-lg bg-black">
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
                            ? 'h-12 w-12 text-red-500'
                            : 'h-8 w-8 text-red-500'
                        }`}
                        fill="currentColor"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Floating Emoji Animations */}
                <AnimatePresence>
                  {floatingEmojis.map((emoji) => (
                    <motion.div
                      key={emoji.id}
                      className="pointer-events-none absolute z-50"
                      style={{
                        left: `${emoji.startX}%`,
                        top: `${emoji.startY}%`,
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0.2,
                        y: 0,
                        rotate: -20,
                      }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.2, 1.8, 1.5, 1.0],
                        y: [0, -50, -150, -280],
                        rotate: [0, 10, -10, 0],
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        y: -320,
                      }}
                      transition={{
                        duration: 2.5,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        times: [0, 0.15, 0.6, 1],
                      }}
                      onAnimationComplete={() => {
                        setFloatingEmojis((prev) =>
                          prev.filter((e) => e.id !== emoji.id),
                        );
                      }}
                    >
                      <FontAwesomeIcon
                        icon={emoji.icon}
                        className="h-10 w-10 text-yellow-400 drop-shadow-2xl"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Emoji Reactions Section */}
            <div className="space-y-3">
              {isLoadingEmojiReactions ? (
                // Loading state
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-full" />
                  ))}
                </div>
              ) : hasEmojiReactions ? (
                // Emoji reactions with adder button (Slack style)
                <div className="flex flex-wrap items-center gap-2">
                  {availableEmojis
                    .filter((emoji) => emojiReactions[emoji.name])
                    .map((emoji) => (
                      <Button
                        key={emoji.name}
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          handleEmojiClick(emoji.icon, emoji.name);
                        }}
                        className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 transition-all hover:scale-105 hover:bg-zinc-800"
                      >
                        <FontAwesomeIcon
                          icon={emoji.icon}
                          className="!h-5 !w-5 text-yellow-400"
                        />
                        <span className="text-md font-bold text-white">
                          <NumberFlow
                            value={emojiReactions[emoji.name] as number}
                          />
                        </span>
                      </Button>
                    ))}

                  {/* Emoji Adder Button */}
                  <Popover
                    open={isEmojiPickerOpen}
                    onOpenChange={setIsEmojiPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex items-center gap-2 border-dashed bg-zinc-900/30 px-3 py-1 transition-all hover:bg-zinc-800/50"
                        aria-label="Add emoji reaction"
                      >
                        <SmilePlus className="!h-5 !w-5" />
                      </Button>
                    </PopoverTrigger>
                    {renderEmojiPickerContent()}
                  </Popover>
                </div>
              ) : (
                // Empty state - encourage first reaction
                <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-300">
                      No reactions yet
                    </p>
                    <p className="text-xs text-zinc-500">
                      Be the first to share how you feel about this game!
                    </p>
                  </div>
                  <Popover
                    open={isEmojiPickerOpen}
                    onOpenChange={setIsEmojiPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="flex items-center gap-2"
                        aria-label="Add first emoji reaction"
                      >
                        <SmilePlus className="!h-4 !w-4" />
                        Add Reaction
                      </Button>
                    </PopoverTrigger>
                    {renderEmojiPickerContent()}
                  </Popover>
                </div>
              )}
            </div>

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {metaSections.map((section, index) => (
                    <GameDetailSection
                      key={section.title}
                      title={section.title}
                      items={section.items || undefined}
                      icon={section.icon}
                      className={`mb-3 ${metaSections.length === 2 && index === 1 ? 'md:col-span-2' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <GameDetailHighlight
            game={game}
            dislikeCount={dislikeCount}
            userDislikeCount={userDislikeCount}
            isLoadingUserDislike={isLoadingUserDislike}
            clickingButton={clickingButton}
            userVoteState={userVoteState}
            onDislikeVote={handleDislikeVote}
            statistics={highlightStatistics}
            isLoadingStatistics={showStatisticsLoading}
          />
        </section>
      </main>

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to react</DialogTitle>
            <DialogDescription>
              You need to be signed in to add emoji reactions to games.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <SignInButton>
              <Button>Login</Button>
            </SignInButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameDetail;
