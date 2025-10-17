'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { X, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const OnlineUsersBadge = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useUser();

  // Fetch online user count with SWR polling
  const { data: onlineData } = useSWR('/api/user/online', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  });

  // Fetch total dislike count with SWR polling
  const { data: dislikeData } = useSWR('/api/stats/total-dislikes', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  const onlineCount = onlineData?.count ?? '1';
  const totalDislikes = dislikeData?.data?.totalDislikes ?? 0;

  // Send heartbeat to update last_seen (for both authenticated and anonymous users)
  useEffect(() => {
    // Generate or retrieve session ID from localStorage
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('session_id', sessionId);
    }

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || null,
            session_id: sessionId,
          }),
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 60 seconds
    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleClose = () => setIsVisible(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-6 bottom-6 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Badge
          variant="secondary"
          className="flex items-center gap-2 px-4 py-2 text-sm shadow-lg backdrop-blur-sm"
        >
          {/* Green dot with pulse */}
          <div className="relative flex h-3 w-3">
            <span className="absolute h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-purple-500" />
          </div>

          {/* Count */}
          <span className="pointer-events-none font-medium text-white">
            <NumberFlow value={onlineCount} /> online
          </span>

          {/* Expanded info on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <ThumbsDown className="h-3.5 w-3.5 fill-current text-red-500" />
                <span className="pointer-events-none font-medium whitespace-nowrap text-white">
                  <NumberFlow value={totalDislikes} /> dislikes
                </span>

                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: 0.1, duration: 0.15 }}
                  onClick={handleClose}
                  className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-zinc-700 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnlineUsersBadge;
