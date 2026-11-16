import { useState, useCallback } from "react";

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export function useClipLab() {
  const [startSec, setStartSec] = useState(92.0);
  const [endSec, setEndSec] = useState(123.5);
  const [padBefore, setPadBefore] = useState(5);
  const [padAfter, setPadAfter] = useState(5);

  const nudgeStart = useCallback((delta) => {
    setStartSec((prev) => Math.max(0, Math.min(endSec - 1, +(prev + delta).toFixed(1))));
  }, [endSec]);

  const nudgeEnd = useCallback((delta) => {
    setEndSec((prev) => Math.min(149, Math.max(startSec + 1, +(prev + delta).toFixed(1))));
  }, [startSec]);

  const decPadBefore = useCallback(() => {
    setPadBefore((prev) => {
      if (prev > 0) {
        setStartSec((s) => +(s + 1).toFixed(1));
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const incPadBefore = useCallback(() => {
    setPadBefore((prev) => {
      if (prev < 15 && startSec >= 1) {
        setStartSec((s) => +(s - 1).toFixed(1));
        return prev + 1;
      }
      return prev;
    });
  }, [startSec]);

  const decPadAfter = useCallback(() => {
    setPadAfter((prev) => {
      if (prev > 0) {
        setEndSec((e) => +(e - 1).toFixed(1));
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const incPadAfter = useCallback(() => {
    setPadAfter((prev) => {
      if (prev < 15 && endSec <= 148) {
        setEndSec((e) => +(e + 1).toFixed(1));
        return prev + 1;
      }
      return prev;
    });
  }, [endSec]);

  const reset = useCallback(() => {
    setStartSec(92.0);
    setEndSec(123.5);
    setPadBefore(5);
    setPadAfter(5);
  }, []);

  const dur = Math.max(0.5, +(endSec - startSec).toFixed(1));

  return {
    startSec,
    endSec,
    padBefore,
    padAfter,
    dur,
    nudgeStart,
    nudgeEnd,
    decPadBefore,
    incPadBefore,
    decPadAfter,
    incPadAfter,
    reset,
    fmtClock,
  };
}
