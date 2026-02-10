import { useState, useCallback, useRef } from 'react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 1 minute
const ATTEMPT_WINDOW_MS = 300_000; // 5 minutes

interface RateLimitState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export function useAuthRateLimit() {
  const [state, setState] = useState<RateLimitState>({
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS,
  });
  const attempts = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startLockout = useCallback(() => {
    const unlockAt = Date.now() + LOCKOUT_DURATION_MS;
    clearTimer();

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
      if (remaining <= 0) {
        clearTimer();
        attempts.current = [];
        setState({ isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS });
      } else {
        setState(prev => ({ ...prev, isLocked: true, remainingSeconds: remaining }));
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
  }, [clearTimer]);

  const recordFailedAttempt = useCallback(() => {
    const now = Date.now();
    // Only keep attempts within the window
    attempts.current = attempts.current.filter(t => now - t < ATTEMPT_WINDOW_MS);
    attempts.current.push(now);

    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts.current.length);

    if (attempts.current.length >= MAX_ATTEMPTS) {
      startLockout();
    } else {
      setState({ isLocked: false, remainingSeconds: 0, attemptsLeft });
    }

    return attemptsLeft;
  }, [startLockout]);

  const resetAttempts = useCallback(() => {
    attempts.current = [];
    clearTimer();
    setState({ isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS });
  }, [clearTimer]);

  return {
    ...state,
    recordFailedAttempt,
    resetAttempts,
  };
}
