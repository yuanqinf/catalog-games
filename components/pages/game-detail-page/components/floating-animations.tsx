'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown, Ghost } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FloatingThumb, FloatingEmoji } from '../hooks/use-game-reactions';
import { FloatingGhost } from '../hooks/use-dead-game-reactions';

interface FloatingAnimationsProps {
  floatingThumbs: FloatingThumb[];
  floatingEmojis: FloatingEmoji[];
  floatingGhosts: FloatingGhost[];
  isDeadGame: boolean;
  setFloatingThumbs: React.Dispatch<React.SetStateAction<FloatingThumb[]>>;
  setFloatingEmojis: React.Dispatch<React.SetStateAction<FloatingEmoji[]>>;
  setFloatingGhosts: React.Dispatch<React.SetStateAction<FloatingGhost[]>>;
}

export function FloatingAnimations({
  floatingThumbs,
  floatingEmojis,
  floatingGhosts,
  isDeadGame,
  setFloatingThumbs,
  setFloatingEmojis,
  setFloatingGhosts,
}: FloatingAnimationsProps) {
  return (
    <>
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
              icon={emoji.icon as IconProp}
              className="h-10 w-10 text-yellow-400 drop-shadow-2xl"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Ghost Animations for Dead Games */}
      {isDeadGame && (
        <AnimatePresence>
          {floatingGhosts.map((ghost) => (
            <motion.div
              key={ghost.id}
              className="pointer-events-none absolute z-50"
              style={{
                left: `${ghost.startX}%`,
                top: `${ghost.startY}%`,
              }}
              initial={{
                opacity: 0,
                scale: 0.2,
                y: 0,
              }}
              animate={{
                opacity: [0, 0.9, 0.9, 0],
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
                setFloatingGhosts((prev) =>
                  prev.filter((g) => g.id !== ghost.id),
                );
              }}
            >
              <Ghost className="h-8 w-8 text-gray-300 drop-shadow-2xl" />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
}
