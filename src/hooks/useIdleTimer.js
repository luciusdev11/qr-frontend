import { useState, useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(timeoutMs = 120000, onIdle) {
  const [isIdle, setIsIdle] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeoutMs);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    lastActivityRef.current = Date.now();
    setRemainingTime(timeoutMs);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Set timeout for idle
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdle) onIdle();
    }, timeoutMs);

    // Update remaining time every second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setRemainingTime(remaining);

      if (remaining === 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);
  }, [timeoutMs, onIdle]);

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      if (!isIdle) {
        resetTimer();
      }
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isIdle, resetTimer]);

  return {
    isIdle,
    remainingTime,
    resetTimer
  };
}