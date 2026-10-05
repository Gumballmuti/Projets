"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Une expiration longue guidée (≈ 6 s) : un disque qui se vide. */
export function Exhale({ seconds = 6, onDone }: { seconds?: number; onDone?: () => void }) {
  const reduced = useReducedMotion();
  const [left, setLeft] = useState(seconds);
  const [armed, setArmed] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (left <= 0) {
      onDoneRef.current?.();
      return;
    }
    const t = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex size-44 items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-match-soft" />
        <div
          className="absolute inset-0 rounded-full bg-match-btn/80"
          style={{
            transform: `scale(${armed ? 0.35 : 1})`,
            transition: reduced ? "none" : `transform ${seconds}s ease-in-out`,
          }}
        />
        <span className="relative text-4xl font-extrabold tabular-nums text-match-ink">{Math.max(left, 0)}</span>
      </div>
      <p className="text-3xl font-bold" aria-live="polite">Expire…</p>
    </div>
  );
}
