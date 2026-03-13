import { useEffect, useRef } from "react";
import { useLogViolation } from "@workspace/api-client-react";

export function useExamMonitor(sessionId: number | undefined, studentId: number | undefined) {
  const { mutate: logViolation } = useLogViolation();
  
  const blurTimeRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_THRESHOLD = 60000; // 60 seconds

  useEffect(() => {
    if (!sessionId || !studentId) return;

    // 1. Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurTimeRef.current = Date.now();
      } else {
        if (blurTimeRef.current) {
          const duration = Math.round((Date.now() - blurTimeRef.current) / 1000);
          logViolation({ data: {
            sessionId,
            studentId,
            type: "TAB_SWITCH",
            metadata: { durationAwaySeconds: duration }
          }});
          blurTimeRef.current = null;
        }
      }
    };

    // 2. Window Resize Detection
    const handleResize = () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      if (windowWidth < screenWidth * 0.8 || windowHeight < screenHeight * 0.8) {
        logViolation({ data: {
          sessionId,
          studentId,
          type: "WINDOW_RESIZE",
          metadata: { 
            windowSize: `${windowWidth}x${windowHeight}`,
            screenSize: `${screenWidth}x${screenHeight}`
          }
        }});
      }
    };
    
    let resizeTimer: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 1000);
    };

    // 3. Keyboard Attempt Detection
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = e.ctrlKey && (e.key === 'c' || e.key === 'C');
      const isPaste = e.ctrlKey && (e.key === 'v' || e.key === 'V');
      const isDevTools = e.key === 'F12';
      const isPrintScreen = e.key === 'PrintScreen';

      if (isCopy || isPaste || isDevTools || isPrintScreen) {
        e.preventDefault();
        let keyAttempted = e.key;
        if (isCopy) keyAttempted = 'Ctrl+C';
        if (isPaste) keyAttempted = 'Ctrl+V';

        logViolation({ data: {
          sessionId,
          studentId,
          type: "KEYBOARD_ATTEMPT",
          metadata: { keyAttempted }
        }});
      }
      
      resetIdleTimer();
    };

    // 4. Idle Detection
    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        logViolation({ data: {
          sessionId,
          studentId,
          type: "IDLE_DETECTED",
          metadata: { idleDurationSeconds: IDLE_THRESHOLD / 1000 }
        }});
      }, IDLE_THRESHOLD);
    };

    const handleMouseMove = () => resetIdleTimer();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", throttledResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    
    resetIdleTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", throttledResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [sessionId, studentId, logViolation]);
}
