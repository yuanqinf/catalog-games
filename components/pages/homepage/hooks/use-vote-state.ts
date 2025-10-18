import { useState, useEffect } from 'react';

interface UserVoteState {
  dailyCost: number;
  maxDailyCost: number;
  votesUsed: number;
  continuousClicks: number;
  lastClickTime: number;
  isPowerMode: boolean;
}

export function useVoteState() {
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({
    dailyCost: 0,
    maxDailyCost: 0,
    votesUsed: 0,
    continuousClicks: 0,
    lastClickTime: 0,
    isPowerMode: false,
  });

  const [clickingButtons, setClickingButtons] = useState<Set<string>>(
    new Set(),
  );

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

  return {
    userVoteState,
    setUserVoteState,
    clickingButtons,
    setClickingButtons,
  };
}
