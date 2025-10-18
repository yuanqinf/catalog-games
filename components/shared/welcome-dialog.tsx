'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ThumbsDown,
  Ghost,
  SquarePen,
  SmilePlus,
  LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/client';

const WELCOME_DIALOG_KEY = 'dissgame-welcome-shown';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

// Features will be populated with translations in the component

export function WelcomeDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const features: Feature[] = [
    {
      icon: ThumbsDown,
      title: t('welcome_feature_dislike_title'),
      description: t('welcome_feature_dislike_description'),
      color: 'red',
    },
    {
      icon: Ghost,
      title: t('welcome_feature_graveyard_title'),
      description: t('welcome_feature_graveyard_description'),
      color: 'purple',
    },
    {
      icon: SquarePen,
      title: t('welcome_feature_rating_title'),
      description: t('welcome_feature_rating_description'),
      color: 'orange',
    },
    {
      icon: SmilePlus,
      title: t('welcome_feature_emoji_title'),
      description: t('welcome_feature_emoji_description'),
      color: 'yellow',
    },
  ];

  useEffect(() => {
    const hasShown = localStorage.getItem(WELCOME_DIALOG_KEY);
    if (!hasShown) {
      setOpen(true);
    }
  }, []);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      localStorage.setItem(WELCOME_DIALOG_KEY, 'true');
    }
    setOpen(isOpen);
  };

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_DIALOG_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-b from-zinc-900 to-black">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center text-3xl font-bold">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.2, 0.9, 1.05, 1],
                rotate: [0, 10, -10, 5, 0],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.3, 0.5, 0.7, 1],
                ease: 'easeOut',
              }}
            >
              <Image
                src="/images/logo.png"
                alt="DissGame"
                width={64}
                height={64}
                className="mb-3"
              />
            </motion.div>
            <span className="relative bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent opacity-50 blur-sm">
                {t('welcome_title')}
              </span>
              {t('welcome_title')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Features - Vertical Layout */}
          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="flex gap-3 rounded-lg p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.1 + 0.3,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{
                      delay: index * 0.1 + 0.5,
                      duration: 0.8,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 5,
                    }}
                  >
                    <Icon
                      className={`h-6 w-6 flex-shrink-0 text-${feature.color}-400`}
                    />
                  </motion.div>
                  <div>
                    <h3 className={`mb-1 font-bold text-${feature.color}-400`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Get Started Button */}
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={handleGetStarted}
              size="lg"
              className="w-full"
            >
              {t('welcome_get_started')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
