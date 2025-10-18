'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown } from 'lucide-react';

interface FloatingThumb {
  id: string;
  gameId: string;
  timestamp: number;
  startX: number;
  isPowerMode?: boolean;
}

interface FloatingThumbsProps {
  floatingThumbs: FloatingThumb[];
  activeGameId: string | undefined;
  onAnimationComplete: (id: string) => void;
}

export function FloatingThumbs({
  floatingThumbs,
  activeGameId,
  onAnimationComplete,
}: FloatingThumbsProps) {
  return (
    <AnimatePresence>
      {floatingThumbs
        .filter((thumb) => thumb.gameId === activeGameId)
        .map((thumb) => (
          <motion.div
            key={thumb.id}
            className="pointer-events-none absolute z-50"
            style={{
              left: `${thumb.startX}%`,
              bottom: '10%',
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
            onAnimationComplete={() => onAnimationComplete(thumb.id)}
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
  );
}
