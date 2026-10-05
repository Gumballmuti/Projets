"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MatchButton, MatchScreen, MatchText, MatchTitle } from "@/components/match/MatchScreen";
import { POINT_SUIVANT_FINAL, POINT_SUIVANT_MESSAGES, ROUTINE_4_TEMPS } from "@/content/messages";
import { bySport, filterBySport } from "@/lib/content";
import { vibrate } from "@/lib/haptics";
import { pickWithoutRepeat } from "@/lib/random";
import { useAppData } from "@/lib/store";

/** Durée d'affichage de chaque temps de la routine (4 × 650 ms ≈ 2,6 s). */
const STEP_MS = 650;

type Phase = { kind: "idle" } | { kind: "sequence"; step: number } | { kind: "message"; text: string };

export function PointSuivant() {
  const { data, update } = useAppData();
  const sport = data.profil.sportActif;
  const motCle = data.profil.motCle;
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const showMessage = useCallback(() => {
    const pool = filterBySport(POINT_SUIVANT_MESSAGES, sport);
    let text = "Respire. Le point précédent est terminé.";
    update((d) => {
      const m = pickWithoutRepeat(pool, d.dernierMessageId);
      if (!m) return d;
      text = m.text;
      return { ...d, dernierMessageId: m.id };
    });
    setPhase({ kind: "message", text });
  }, [sport, update]);

  const start = useCallback(() => {
    vibrate(25);
    setPhase({ kind: "sequence", step: 0 });
  }, []);

  // Arrivée depuis « J'ai fait une erreur » ou « Je suis sous pression » : on enchaîne.
  const autoStart = params.get("go") === "1";
  useEffect(() => {
    if (!autoStart) return;
    const frame = requestAnimationFrame(() => setPhase({ kind: "sequence", step: 0 }));
    return () => cancelAnimationFrame(frame);
  }, [autoStart]);

  useEffect(() => {
    if (phase.kind !== "sequence") return;
    const t = window.setTimeout(() => {
      if (phase.step < ROUTINE_4_TEMPS.length - 1) setPhase({ kind: "sequence", step: phase.step + 1 });
      else showMessage();
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [phase, showMessage]);

  if (phase.kind === "idle") {
    return (
      <MatchScreen mode="Point suivant" onTap={start} tapLabel="Point suivant : lancer la routine">
        <span className="flex aspect-square w-full max-w-72 items-center justify-center rounded-full bg-match-btn p-6 text-4xl font-extrabold uppercase leading-tight text-match-on-btn shadow-lg">
          Point suivant
        </span>
        {motCle && <MatchText>Ton mot-clé : <strong className="text-match-ink">{motCle}</strong></MatchText>}
      </MatchScreen>
    );
  }

  if (phase.kind === "sequence") {
    const temps = ROUTINE_4_TEMPS[phase.step]!;
    const isEngage = temps.id === "engage";
    return (
      <MatchScreen mode="Point suivant" onTap={showMessage} tapLabel="Passer au message">
        <ol className="flex gap-2" aria-hidden="true">
          {ROUTINE_4_TEMPS.map((t, i) => (
            <li key={t.id} className={i <= phase.step ? "h-2 w-10 rounded-full bg-match-btn" : "h-2 w-10 rounded-full bg-match-soft"} />
          ))}
        </ol>
        <MatchTitle size="xxl">{isEngage && motCle ? motCle : temps.mot}</MatchTitle>
        <MatchText>{isEngage && motCle ? "Engage. Regard devant. On joue." : bySport(temps.consigne, sport)}</MatchText>
      </MatchScreen>
    );
  }

  return (
    <MatchScreen
      mode="Point suivant"
      action={
        <MatchButton onClick={() => setPhase({ kind: "idle" })}>
          {POINT_SUIVANT_FINAL} 🎾
        </MatchButton>
      }
    >
      <MatchTitle>{phase.text}</MatchTitle>
      {motCle && <MatchText>{motCle}</MatchText>}
    </MatchScreen>
  );
}
