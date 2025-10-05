'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSync } from '@/hooks/useUserSync';

const ClerkAuth = () => {
  const [isMounted, setIsMounted] = useState(false);

  // Auto-sync user data when signed in
  const { isSyncing } = useUserSync();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor Clerk dialog state
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('cl-modalBackdrop') ||
              node.classList.contains('cl-userButtonPopoverCard'))
          ) {
            // Sync user data
            useUserSync();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!isMounted ? (
        <motion.div
          key="loading"
          className="flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          {isSyncing && (
            <span className="text-xs text-gray-400">Syncing...</span>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="auth-content"
          className="flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <SignedOut>
            <SignInButton>
              <Button>Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href={'/profile'}>
              <Button>Profile</Button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: '40px',
                    height: '40px',
                    '&:hover': {
                      scale: 1.1,
                      transition: 'all 0.2s ease-in-out',
                    },
                  },
                },
              }}
            />
          </SignedIn>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClerkAuth;
