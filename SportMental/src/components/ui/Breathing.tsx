"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { vibrate } from "@/lib/haptics";
import { tone } from "@/lib/sound";

type Phase = "inspire" | "pause" | "expire";

type BreathingProps = {
  inspire: number;
  pause: number;
  expire: number;
  cycles: number;
  onDone?: () => void;
  textes?: Partial<Record<Phase, string>>;
  /** Style « mode match » : texte énorme, couleurs très contrastées. */
  match?: boolean;
  /** Démarre automatiquement (sinon bouton « Commencer »). */
  autoStart?: boolean;
};

const DEFAULT_TEXTES: Record<Phase, string> = { inspire: "Inspire…", pause: "Garde…", expire: "Expire…" };

/**
 * Cercle de respiration. Avec « réduire les animations », le cercle change
 * de taille sans mouvement et seul le texte guide.
 */
export function Breathing({ inspire, pause, expire, cycles, onDone, textes, match, autoStart = true }: BreathingProps) {
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(autoStart);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>("inspire");
  const [remaining, setRemaining] = useState(inspire);
  const [armed, setArmed] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const durations: Record<Phase, number> = { inspire, pause, expire };
  const labels = { ...DEFAULT_TEXTES, ...textes };

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (remaining > 1) {
        setRemaining((r) => r - 1);
        return;
      }
      // Passage à la phase suivante.
      const order: Phase[] = pause > 0 ? ["inspire", "pause", "expire"] : ["inspire", "expire"];
      const idx = order.indexOf(phase);
      if (idx < order.length - 1) {
        const next = order[idx + 1]!;
        setPhase(next);
        setRemaining(durations[next]);
        tone(next === "expire" ? 330 : 520);
        return;
      }
      if (cycle + 1 >= cycles) {
        setRunning(false);
        vibrate([20, 60, 20]);
        onDoneRef.current?.();
        return;
      }
      setCycle((c) => c + 1);
      setPhase("inspire");
      setRemaining(inspire);
      tone(520);
    }, 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining, phase, cycle]);

  // Le cercle grandit à l'inspiration, reste plein pendant la pause, se vide à l'expiration.
  const size = running && armed && phase !== "expire" ? 1 : 0.55;
  const duration = durations[phase];
  const done = !running && cycle + 1 >= cycles;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex size-64 items-center justify-center sm:size-72" aria-hidden="true">
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            match ? "bg-match-soft" : "bg-soft",
          )}
        />
        <div
          className={cn("absolute inset-0 rounded-full", match ? "bg-match-btn/80" : "bg-mint")}
          style={{
            transform: `scale(${size})`,
            transition: reduced ? "none" : `transform ${phase === "pause" ? 0.2 : duration}s ease-in-out`,
            willChange: "transform",
          }}
        />
      </div>
      <div aria-live="polite" className="flex flex-col items-center gap-1 text-center">
        <p className={cn("font-extrabold", match ? "text-5xl text-match-ink" : "text-4xl text-ink")}>
          {running ? labels[phase] : done ? "Bien joué." : "Respire"}
        </p>
        {running && (
          <p className={cn("text-lg tabular-nums", match ? "text-match-muted" : "text-muted")}>
            {remaining} s · cycle {cycle + 1}/{cycles}
          </p>
        )}
      </div>
      {!running && (!autoStart || done) && (
        <button
          type="button"
          onClick={() => {
            setCycle(0);
            setPhase("inspire");
            setRemaining(inspire);
            setRunning(true);
          }}
          className="min-h-12 rounded-2xl bg-primary px-6 font-semibold text-on-primary"
        >
          {done ? "Recommencer" : "Commencer"}
        </button>
      )}
    </div>
  );
}
