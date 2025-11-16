import { useEffect, useRef, useCallback } from 'react';

/**
 * Idle logout hook - Auto logout after 30 seconds of inactivity
 * Does NOT interfere with auto-refresh or programmatic updates
 */
export function useIdleLogout(onLogout, idleTime = 30000) {
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('⏱️ Idle timeout - logging out');
      if (onLogout) onLogout();
    }, idleTime);
  }, [idleTime, onLogout]);

  useEffect(() => {
    // User interaction events (not programmatic events)
    const userEvents = [
      'mousedown',    // Click
      'mousemove',    // Move mouse
      'keypress',     // Type
      'keydown',      // Any key
      'touchstart',   // Mobile touch
      'click',        // Click
      'wheel'         // Scroll with mouse wheel
    ];

    // Reset timer on user interaction
    const handleUserActivity = (e) => {
      // Ignore programmatic events
      if (!e.isTrusted) return;
      
      resetTimer();
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    userEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Cleanup
    return () => {
      userEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current
  };
}