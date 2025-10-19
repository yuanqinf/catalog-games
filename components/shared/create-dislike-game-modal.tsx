'use client';

import { KeyboardEvent, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Gamepad2, ThumbsDown, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IgdbGame } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/client';

interface CreateDislikeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dislikeCount?: number) => void;
  game: IgdbGame | null;
  isSubmitting?: boolean;
}

interface FloatingThumb {
  id: string;
  startX: number;
}

const extractDeveloper = (game: IgdbGame): string => {
  if (!game.involved_companies) return '';

  const developerCompany = game.involved_companies.find(
    (company) => company.developer || !company.publisher,
  );
  return developerCompany?.company.name || '';
};

export const CreateDislikeGameModal = ({
  isOpen,
  onClose,
  onConfirm,
  game,
  isSubmitting = false,
}: CreateDislikeGameModalProps) => {
  const { t } = useTranslation();
  const [floatingThumbs, setFloatingThumbs] = useState<FloatingThumb[]>([]);
  const [dislikeCount, setDislikeCount] = useState(0);

  // Handle dislike button click with floating animation (doesn't confirm modal)
  const handleDislikeClick = useCallback(() => {
    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play().catch((error) => console.error('Error playing sound:', error));

    const newThumb: FloatingThumb = {
      id: `thumb-${Date.now()}-${Math.random()}`,
      startX: Math.random() * 60 + 20, // Random position between 20% and 80%
    };

    setFloatingThumbs((prev) => [...prev, newThumb]);
    setDislikeCount((prev) => prev + 1);
  }, []);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFloatingThumbs([]);
      setDislikeCount(0);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !game) return null;

  const developer = extractDeveloper(game);
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative my-auto w-full max-w-md">
        <CardHeader>
          <CardAction>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardAction>
          <CardTitle>{t('dislike_modal_title')}</CardTitle>
          <CardDescription>{t('dislike_modal_description')}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Game info section */}
          <div className="bg-muted flex items-center justify-between gap-4 rounded-lg p-4">
            {/* Left - Cover image and game info */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {game.cover_url ? (
                  <Image
                    src={game.cover_url}
                    alt={game.name}
                    width={60}
                    height={80}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted-foreground/20 flex h-[80px] w-[60px] items-center justify-center rounded">
                    <Gamepad2 className="text-muted-foreground h-6 w-6" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-1 text-lg leading-tight font-medium">
                  {game.name}
                </h3>
                {developer && (
                  <p className="text-muted-foreground mb-1 text-sm">
                    {developer}
                  </p>
                )}
                {releaseYear && (
                  <p className="text-muted-foreground/80 text-sm">
                    {releaseYear}
                  </p>
                )}
              </div>
            </div>

            {/* Right - Dislike button */}
            <div className="flex flex-shrink-0 items-center gap-2">
              {dislikeCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-destructive text-sm font-medium"
                >
                  {dislikeCount}
                </motion.div>
              )}
              <Button
                onClick={handleDislikeClick}
                variant="outline"
                size="sm"
                className="border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
              >
                <ThumbsDown className="h-4 w-4" />
                {t('dislike_modal_dislike_button')}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            {t('dislike_modal_cancel_button')}
          </Button>
          <Button
            onClick={() => onConfirm(dislikeCount || 1)}
            variant="destructive"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dislike_modal_submitting')}
              </>
            ) : (
              t('dislike_modal_confirm_button')
            )}
          </Button>
        </CardFooter>

        {/* Floating Reactions */}
        <AnimatePresence>
          {floatingThumbs.map((thumb) => (
            <motion.div
              key={thumb.id}
              className="pointer-events-none absolute z-50"
              style={{
                left: `${thumb.startX}%`,
                bottom: '20%',
              }}
              initial={{
                opacity: 0,
                scale: 0.2,
                y: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.2, 1.5, 1.3, 0.9],
                y: [0, -40, -120, -250],
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                y: -300,
              }}
              transition={{
                duration: 2.5,
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
                className="h-8 w-8 text-red-500 drop-shadow-2xl"
                fill="currentColor"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>
    </div>
  );
};
