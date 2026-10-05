"use client";

import { useEffect, useState } from "react";
import { Breathing } from "@/components/ui/Breathing";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EXERCICES } from "@/content/exercices";
import { CATEGORIES, DIFFICULTES, MOMENTS } from "@/content/libelles";
import { RESPIRATION } from "@/content/routine";
import { SPORTS } from "@/content/sports";
import type { Exercise } from "@/content/types";
import { isForSport } from "@/lib/content";
import { vibrate } from "@/lib/haptics";
import { useAppData } from "@/lib/store";

function Minuteur({ secondes }: { secondes: number }) {
  const [left, setLeft] = useState(secondes);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || left <= 0) return;
    const t = window.setTimeout(() => {
      setLeft((l) => l - 1);
      if (left === 1) vibrate([30, 80, 30]);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [running, left]);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-soft p-5">
      <p className="text-5xl font-bold tabular-nums text-ink" aria-live="off">{mm}:{ss}</p>
      <ProgressBar value={1 - left / secondes} label="Temps écoulé" />
      {left === 0 ? (
        <p className="font-semibold text-accent" role="status">Terminé. Bien joué.</p>
      ) : (
        <Button variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : left < secondes ? "Reprendre" : "Lancer le minuteur"}
        </Button>
      )}
    </div>
  );
}

function Guide({ exercice, onClose }: { exercice: Exercise; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const { data } = useAppData();
  const g = exercice.guide;
  const last = step >= exercice.etapes.length - 1;
  return (
    <div className="flex flex-col gap-5">
      {g.type === "respiration" && (
        <>
          <Breathing
            inspire={g.inspire}
            pause={data.profil.preferences.pauseRespiration ? g.pause : 0}
            expire={g.expire}
            cycles={g.cycles}
            textes={RESPIRATION.textes}
          />
          <p className="text-center text-sm text-muted">{RESPIRATION.securite}</p>
        </>
      )}
      {g.type === "minuteur" && <Minuteur secondes={g.secondes} />}
      {g.type !== "respiration" && (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-muted">Étape {step + 1} sur {exercice.etapes.length}</p>
          <ProgressBar value={(step + 1) / exercice.etapes.length} label={`Étape ${step + 1} sur ${exercice.etapes.length}`} />
          <p className="min-h-24 text-xl leading-relaxed text-ink" aria-live="polite">{exercice.etapes[step]}</p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Précédente</Button>
            {last ? (
              <Button className="flex-1" onClick={() => { vibrate(30); onClose(); }}>Terminer</Button>
            ) : (
              <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>Suivante</Button>
            )}
          </div>
        </Card>
      )}
      {g.type === "respiration" && <Button variant="secondary" onClick={onClose}>Terminer</Button>}
    </div>
  );
}

export function ExerciceDetail({ id }: { id: string }) {
  const exercice = EXERCICES.find((e) => e.id === id)!;
  const { data, loaded } = useAppData();
  const sport = data.profil.sportActif;
  const [guide, setGuide] = useState(false);
  const [fini, setFini] = useState(false);

  const autreSport = loaded && !isForSport(exercice.sports, sport);
  if (autreSport) {
    const cible = exercice.sports.find((s) => s !== "all");
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Exercice d'un autre sport" backHref="/exercices" backLabel="Exercices" />
        <Notice>
          Cet exercice est conçu pour le {cible ? SPORTS[cible].label.toLowerCase() : "autre sport"}. Pour le voir, ajoute ce sport dans ton profil.
        </Notice>
        <ButtonLink href="/exercices">Voir mes exercices</ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={exercice.titre} subtitle={exercice.objectif} backHref="/exercices" backLabel="Exercices" />
      <ul className="flex flex-wrap gap-2 text-sm" aria-label="Informations">
        <li className="rounded-full bg-soft px-3 py-1 text-ink">{CATEGORIES[exercice.categorie]}</li>
        <li className="rounded-full bg-soft px-3 py-1 text-ink">{exercice.duree} min</li>
        <li className="rounded-full bg-soft px-3 py-1 text-ink">{DIFFICULTES[exercice.difficulte]}</li>
        {exercice.quand.map((q) => (
          <li key={q} className="rounded-full bg-soft px-3 py-1 text-ink">{MOMENTS[q]}</li>
        ))}
      </ul>

      {guide ? (
        <Guide exercice={exercice} onClose={() => { setGuide(false); setFini(true); }} />
      ) : (
        <>
          <p className="text-lg leading-relaxed text-ink">{exercice.description}</p>
          {fini && <Notice title="Bien joué">Exercice terminé. Tu peux le refaire quand tu veux.</Notice>}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">Étapes</h2>
            <ol className="flex flex-col gap-3">
              {exercice.etapes.map((e, i) => (
                <li key={e} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft font-semibold text-accent">{i + 1}</span>
                  <span className="pt-1 leading-relaxed text-ink">{e}</span>
                </li>
              ))}
            </ol>
          </section>
          {exercice.express && (
            <Card className="flex flex-col gap-1 bg-soft">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Version express · {exercice.express.secondes} s</p>
              <p className="text-lg text-ink">{exercice.express.texte}</p>
            </Card>
          )}
          <Button size="lg" onClick={() => setGuide(true)}>Commencer</Button>
        </>
      )}
    </div>
  );
}
