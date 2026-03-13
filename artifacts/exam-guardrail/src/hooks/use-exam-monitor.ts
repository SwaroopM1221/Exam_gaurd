import { useEffect, useRef, useState } from "react";
import { useLogViolation } from "@workspace/api-client-react";

export function useExamMonitor(sessionId: number | undefined, studentId: number | undefined) {
  const { mutate: logViolation } = useLogViolation();
  const [isTabSwitched, setIsTabSwitched] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  
  const blurTimeRef = useRef<number | null>(null);
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_THRESHOLD = 60000; // 60 seconds

  // Handle countdown for the penalty lock
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setInterval(() => {
        setLockTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockTimer]);

  useEffect(() => {
    if (!sessionId || !studentId) return;

    const triggerPenalty = () => {
      if (blurTimeRef.current) {
        const duration = Math.round((Date.now() - blurTimeRef.current) / 1000);
        logViolation({ data: {
          sessionId,
          studentId,
          type: "TAB_SWITCH",
          metadata: { durationAwaySeconds: duration }
        }});
        blurTimeRef.current = null;
        setLockTimer(60); // Set 1 minute penalty
      }
    };

    // 1. Tab Switch & Focus Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!blurTimeRef.current) blurTimeRef.current = Date.now();
        setIsTabSwitched(true);
      } else if (document.hasFocus()) {
        setIsTabSwitched(false);
        triggerPenalty();
      }
    };

    const handleWindowBlur = () => {
      if (!blurTimeRef.current) blurTimeRef.current = Date.now();
      setIsTabSwitched(true);
    };

    const handleWindowFocus = () => {
      setIsTabSwitched(false);
      triggerPenalty();
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

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("resize", throttledResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    
    resetIdleTimer();

    // 5. Voice/Audio Detection
    let audioContext: AudioContext | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let analyzer: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let voiceLogThrottle = false;

    const setupVoiceDetection = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        microphone = audioContext.createMediaStreamSource(stream);
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        microphone.connect(analyzer);

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
          if (!analyzer) return;
          analyzer.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          // Threshold for "violence" (voice detection)
          // Average > 40-50 is usually indicative of clear speech/noise
          if (average > 45 && !voiceLogThrottle) {
            voiceLogThrottle = true;
            logViolation({ data: {
              sessionId,
              studentId,
              type: "VOICE_DETECTED",
              metadata: { volume: Math.round(average) }
            }});
            // Throttle voice logs to avoid spamming the server (max once every 5 seconds)
            setTimeout(() => { voiceLogThrottle = false; }, 5000);
          }
          requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (err) {
        console.warn("Microphone access denied or not available", err);
      }
    };

    setupVoiceDetection();

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("resize", throttledResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      
      // Cleanup Audio
      if (audioContext) audioContext.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [sessionId, studentId, logViolation]);

  return { isTabSwitched: isTabSwitched || lockTimer > 0, lockTimer };
}
