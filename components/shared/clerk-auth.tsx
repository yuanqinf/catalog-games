'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Laugh, Loader2, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSync } from '@/hooks/useUserSync';
import { dark } from '@clerk/themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ClerkAuth = () => {
  const [isMounted, setIsMounted] = useState(false);

  // Auto-sync user data when signed in
  const { isSyncing } = useUserSync();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor Clerk dialog state and sync user data when closed
  useEffect(() => {
    const handleDialogClose = async () => {
      try {
        await fetch('/api/users/sync', { method: 'POST' });
        console.log('User data synced after dialog close');
      } catch (error) {
        console.error('Failed to sync user data:', error);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('cl-modalBackdrop') ||
              node.classList.contains('cl-userButtonPopoverCard'))
          ) {
            handleDialogClose();
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
    <>
      <style jsx global>{`
        .cl-userButtonPopoverActionButton__manageAccount::before {
          content: 'Account' !important;
          position: absolute !important;
          left: 57 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          padding: 8px 12px !important;
        }
        /* Hide the original Profile text */
        .cl-userButtonPopoverActionButton__manageAccount {
          text-indent: -9999px !important;
          overflow: hidden !important;
        }
        .cl-userButtonPopoverActionButton__manageAccount::before {
          text-indent: 0 !important;
          font-size: 14px !important;
        }
      `}</style>
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
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SignInButton mode="modal" appearance={{ baseTheme: dark }}>
                      <Button>
                        <LogIn className="h-3 w-3" />
                        <p> Login </p>
                      </Button>
                    </SignInButton>
                  </TooltipTrigger>
                  <TooltipContent
                    className="border-primary/20 bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm"
                    sideOffset={8}
                  >
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      Ready to start your dislike journey? Sign in!
                    </motion.p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                    userPreviewMainIdentifier: {
                      display: 'none',
                    },
                    userPreviewSecondaryIdentifier: {
                      marginTop: '0',
                      color: '#000000',
                      fontSize: '14px',
                    },
                    userButtonPopoverActionButton__manageAccount: {
                      '& [data-localization-key="userButtonPopover.manageAccount"]':
                        {
                          '&::before': {
                            content: '"Account"',
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'inherit',
                            zIndex: '999',
                          },
                        },
                      '& [data-localization-key="userButtonPopover.manageAccount"] > *':
                        {
                          opacity: '0',
                        },
                    },
                  },
                }}
              />
            </SignedIn>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClerkAuth;
