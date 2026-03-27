import { useEffect, useRef, useCallback } from "react";

type Options = {
  inactivityMs: number; 
  enabled: boolean;
  onInactive: () => void;
};

const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export function useSessionTimeout({
  inactivityMs,
  enabled,
  onInactive,
}: Options) {
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(onInactive, inactivityMs);
  }, [inactivityMs, onInactive]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    startTimer();
  }, [enabled, startTimer]);

  useEffect(() => {
    if (!enabled) return;

    startTimer();

    events.forEach((e) =>
      window.addEventListener(e, resetTimer)
    );

    return () => {
      clearTimer();
      events.forEach((e) =>
        window.removeEventListener(e, resetTimer)
      );
    };
  }, [enabled, resetTimer, startTimer]);
}