'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  Joystick,
  SmilePlus,
  Share2,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dark } from '@clerk/themes';
import { useTranslation } from '@/lib/i18n/client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SignInButton, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import GameDetailSection from '@/components/pages/game-detail-page/game-detail-section';

import GameDetailHighlight, { StatisticItem } from './game-detail-highlight';
import GameDetailHeadline from './game-detail-headline';
import NumberFlow from '@number-flow/react';

import { GameDbData, DeadGameFromAPI } from '@/types';
import {
  formatSalesValue,
  getSalesLabel,
  getSourceName,
} from '@/lib/sales/get-sales-data';

import {
  useGameReactions,
  type FloatingThumb,
  type FloatingEmoji,
} from './hooks/use-game-reactions';
import { useGameStats } from './hooks/use-game-stats';
import { useDeadGameReactions } from './hooks/use-dead-game-reactions';
import { FloatingAnimations } from './components/floating-animations';
import { EmojiPickerContent, availableEmojis } from './components/emoji-picker';

const GameDetail = ({
  game,
  deadGame = null,
}: {
  game: GameDbData;
  deadGame?: DeadGameFromAPI | null;
}) => {
  const { t } = useTranslation();
  const { isSignedIn } = useUser();
  const isDeadGame = !!deadGame;

  const [clickingButton, setClickingButton] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const reactions = useGameReactions(game.id, game.dislike_count ?? undefined);
  const stats = useGameStats(game);
  const deadReactions = useDeadGameReactions(deadGame, isDeadGame);

  const {
    dislikeCount,
    userDislikeCount,
    emojiReactions,
    floatingThumbs,
    floatingEmojis,
    userVoteState,
    isLoadingEmojiReactions,
    isLoadingUserDislike,
    setFloatingThumbs,
    setFloatingEmojis,
    setUserVoteState,
    sendDislike,
    sendEmojiReaction,
    mutateDislike,
    mutateEmojiReactions,
  } = reactions;

  const {
    salesData,
    isLoadingSales,
    twitchLiveViewers,
    isLoadingTwitch,
    steamCurrentPlayers,
    isLoadingSteamPlayers,
    steamSpyData,
    isLoadingSteamSpy,
    playtrackerData,
    isLoadingPlaytracker,
  } = stats;

  const { ghostCount, floatingGhosts, setFloatingGhosts, mutateGhost } =
    deadReactions;

  const hasEmojiReactions = Object.keys(emojiReactions).length > 0;

  // Handle share button click
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('game_detail_link_copied'));
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error(t('game_detail_failed_copy_link'));
    }
  };

  // Handle emoji reaction click
  const handleEmojiClick = async (icon: unknown, name: string) => {
    // Check if user is signed in
    if (!isSignedIn) {
      setShowSignInDialog(true);
      setIsEmojiPickerOpen(false);
      return;
    }

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
      (
        currentData:
          | { success?: boolean; data?: Record<string, number> }
          | undefined,
      ) => {
        if (!currentData?.success || !currentData.data) return currentData;
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

    // Use throttled hook to send API request
    if (game.id) {
      sendEmojiReaction(game.id, name);
    }
  };

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
      (
        current: { dislikeCount: number; userDislikeCount: number } | undefined,
      ) =>
        current
          ? {
              dislikeCount: current.dislikeCount + increment,
              userDislikeCount: current.userDislikeCount + increment,
            }
          : current,
      { revalidate: false },
    );

    // Use throttled hook to send API request
    sendDislike(game.igdb_id, increment);
  };

  // Handle ghost click for dead games
  const handleGhostClick = async () => {
    if (!deadGame?.id) return;

    // Play ghost sound effect
    const audio = new Audio('/sounds/ghost_sound.wav');
    audio.volume = 0.1;
    audio.play().catch((error) => console.error('Error playing sound:', error));

    // Add button click animation
    setClickingButton(true);
    setTimeout(() => setClickingButton(false), 200);

    // Create floating ghost animation
    const newGhost = {
      id: `ghost-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      startX: Math.random() * 70 + 15,
      startY: Math.random() * 30 + 60,
    };

    setFloatingGhosts((prev) => [...prev, newGhost]);

    // Optimistically update SWR cache immediately
    mutateGhost(
      (current) =>
        current
          ? {
              ghostCount: current.ghostCount + 1,
            }
          : current,
      { revalidate: false },
    );

    // Call backend API to update the database
    try {
      const response = await fetch('/api/dead-games/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadGameId: deadGame.id,
          incrementBy: 1,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to update ghost count:', result.error);
        // Revert optimistic update on error
        mutateGhost();
      } else {
        // Success - refresh from server
        mutateGhost();
      }
    } catch (error) {
      console.error('Error calling ghost reaction API:', error);
      // Revert optimistic update on error
      mutateGhost();
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
  }, [
    userVoteState.lastClickTime,
    userVoteState.isPowerMode,
    setUserVoteState,
  ]);

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
            title: t('game_detail_current_players'),
            value: steamCurrentPlayers.toLocaleString(),
            icon: Joystick,
            tooltipContent: <p>{t('game_detail_source_steam')}</p>,
          },
        ]
      : []),

    // Live Viewers
    ...(twitchLiveViewers
      ? [
          {
            title: t('game_detail_live_viewers'),
            value: `${twitchLiveViewers.toLocaleString()}`,
            icon: ChartColumnIncreasing,
            tooltipContent: <p>{t('game_detail_source_twitch')}</p>,
          },
        ]
      : []),

    // Average Playtime
    ...(steamSpyData?.averagePlaytime || playtrackerData?.averagePlaytime
      ? [
          {
            title: t('game_detail_average_playtime'),
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
        {/* Top Navigation - Back Button (Left) and Share Button (Right) */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/explore?view=graveyard">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isDeadGame
                ? t('game_detail_back_to_graveyard')
                : t('game_detail_back_to_top_100')}
            </Button>
          </Link>

          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="sm:size-default"
          >
            <Share2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {t('game_detail_share_button')}
            </span>
          </Button>
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
          isDeadGame={isDeadGame}
          deadDate={deadGame?.dead_date}
          deadStatus={deadGame?.dead_status}
          ghostCount={ghostCount}
        />

        {/* Game Detail Main Section */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 2xl:gap-10">
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
                  className={`object-cover ${isDeadGame ? 'opacity-90 saturate-50' : ''}`}
                  priority
                />

                <FloatingAnimations
                  floatingThumbs={floatingThumbs}
                  floatingEmojis={floatingEmojis}
                  floatingGhosts={floatingGhosts}
                  isDeadGame={isDeadGame}
                  setFloatingThumbs={setFloatingThumbs}
                  setFloatingEmojis={setFloatingEmojis}
                  setFloatingGhosts={setFloatingGhosts}
                />
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
                        onClick={() => {
                          handleEmojiClick(emoji.icon, emoji.name);
                        }}
                        className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 transition-all hover:scale-105 hover:bg-zinc-800"
                      >
                        <FontAwesomeIcon
                          icon={emoji.icon}
                          className="!h-3 !w-3 text-yellow-400 md:!h-5 md:!w-5"
                        />
                        <span className="text-xs font-bold text-white md:text-base">
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
                    <EmojiPickerContent onEmojiClick={handleEmojiClick} />
                  </Popover>
                </div>
              ) : (
                // Empty state - encourage first reaction
                <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">
                      {t('game_detail_no_reactions_yet')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('game_detail_be_first_to_react')}
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
                        aria-label={t('game_detail_add_first_emoji')}
                      >
                        <SmilePlus className="!h-4 !w-4" />
                        {t('game_detail_add_reaction')}
                      </Button>
                    </PopoverTrigger>
                    <EmojiPickerContent onEmojiClick={handleEmojiClick} />
                  </Popover>
                </div>
              )}
            </div>

            {/* Game Information Section */}
            <div className="mb-8 hidden space-y-6 lg:block">
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
            isDeadGame={isDeadGame}
            ghostCount={ghostCount}
            onGhostClick={handleGhostClick}
            isSignedIn={isSignedIn}
          />
        </section>
      </main>

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('game_detail_sign_in_to_react')}</DialogTitle>
            <DialogDescription>
              {t('game_detail_sign_in_to_react_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <SignInButton mode="modal" appearance={{ baseTheme: dark }}>
              <Button
                onClick={() => {
                  setShowSignInDialog(false);
                }}
              >
                {t('auth_login')}
              </Button>
            </SignInButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameDetail;
