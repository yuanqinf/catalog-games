'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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

  const onlineCount = onlineData?.count ?? 0;
  console.log('onlineCount', onlineCount);

  // Send heartbeat to update last_seen
  useEffect(() => {
    if (!user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        whileHover={{ scale: 1.05, y: -2 }}
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
            <span className="relative h-3 w-3 rounded-full bg-green-500" />
          </div>

          {/* Count */}
          <span className="font-medium text-white">
            {onlineCount.toLocaleString()} online
          </span>

          {/* Close button */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleClose}
                className="ml-1 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnlineUsersBadge;
