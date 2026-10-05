"use client";

import { useEffect, useRef, useState } from "react";
import type { VisualisationSegment } from "@/content/routine";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";

/** Visualisation guidée : segments chronométrés, barre de progression, pause possible. */
export function Visualisation({ segments, onDone }: { segments: VisualisationSegment[]; onDone: () => void }) {
  const total = segments.reduce((s, x) => s + x.secondes, 0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!running) return;
    if (elapsed >= total) {
      onDoneRef.current();
      return;
    }
    const t = window.setTimeout(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, elapsed, total]);

  let acc = 0;
  let current = segments[0]!;
  for (const seg of segments) {
    if (elapsed < acc + seg.secondes) {
      current = seg;
      break;
    }
    acc += seg.secondes;
    current = seg;
  }

  const minutes = Math.floor((total - elapsed) / 60);
  const secondes = String((total - elapsed) % 60).padStart(2, "0");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-48 items-center rounded-3xl bg-soft p-6">
        <p aria-live="polite" className="text-xl leading-relaxed text-ink">
          {running || elapsed > 0
            ? current.texte
            : "Installe-toi. Lis chaque phrase, puis vis-la les yeux fermés ou ouverts, comme tu préfères."}
        </p>
      </div>
      <ProgressBar value={elapsed / total} label="Progression de la visualisation" />
      <p className="text-center text-sm tabular-nums text-muted">
        {minutes}:{secondes} restantes
      </p>
      <Button size="lg" variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
        {running ? "Pause" : elapsed > 0 ? "Reprendre" : "Lancer la visualisation"}
      </Button>
    </div>
  );
}
