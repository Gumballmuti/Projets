"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EXERCICES } from "@/content/exercices";
import { PROGRAMMES } from "@/content/programmes";
import { cn } from "@/lib/cn";
import { bySport, isForSport } from "@/lib/content";
import { vibrate } from "@/lib/haptics";
import { useAppData } from "@/lib/store";

export function ProgrammeDetail({ id }: { id: string }) {
  const programme = PROGRAMMES.find((p) => p.id === id)!;
  const { data, loaded, update } = useAppData();
  const sport = data.profil.sportActif;
  const progress = data.programmes[programme.id];
  const faits = progress?.joursTermines ?? [];
  const prochain = programme.jours.find((j) => !faits.includes(j.jour))?.jour ?? null;
  const [ouvert, setOuvert] = useState<number | null>(null);
  const jourOuvert = ouvert ?? prochain;

  function demarrer() {
    update((d) => ({
      ...d,
      programmeEnCours: programme.id,
      programmes: { ...d.programmes, [programme.id]: d.programmes[programme.id] ?? { debut: new Date().toISOString(), joursTermines: [] } },
    }));
  }

  function basculer(jour: number) {
    const fait = faits.includes(jour);
    if (!fait) vibrate([20, 60, 20]);
    update((d) => {
      const p = d.programmes[programme.id] ?? { debut: new Date().toISOString(), joursTermines: [] };
      const jours = fait ? p.joursTermines.filter((j) => j !== jour) : [...p.joursTermines, jour].sort((a, b) => a - b);
      return { ...d, programmeEnCours: programme.id, programmes: { ...d.programmes, [programme.id]: { ...p, joursTermines: jours } } };
    });
    if (!fait) setOuvert(programme.jours.find((j) => j.jour > jour && !faits.includes(j.jour))?.jour ?? jour);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={programme.titre} subtitle={programme.description} backHref="/programmes" backLabel="Programmes" />
      {loaded && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <ProgressBar value={faits.length / 7} label={`${faits.length} jours terminés sur 7`} className="flex-1" />
            <span className="text-sm tabular-nums text-muted">{faits.length}/7</span>
          </div>
          {data.programmeEnCours !== programme.id && (
            <Button onClick={demarrer}>{progress ? "Reprendre ce programme" : "Commencer ce programme"}</Button>
          )}
          {faits.length === 7 && <p className="rounded-2xl bg-soft p-4 text-ink">Programme terminé. Bravo pour ta régularité : c&apos;est ce qui construit le mental.</p>}
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {programme.jours.map((j) => {
          const fait = faits.includes(j.jour);
          const open = jourOuvert === j.jour;
          const exercice = j.exercice.exerciceId ? EXERCICES.find((e) => e.id === j.exercice.exerciceId) : undefined;
          return (
            <li key={j.jour} className={cn("rounded-3xl border bg-surface shadow-card", open ? "border-line-strong" : "border-line")}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOuvert(open ? 0 : j.jour)}
                className="flex min-h-16 w-full items-center gap-4 p-4 text-left"
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full font-bold", fait ? "bg-primary text-on-primary" : "bg-soft text-accent")}>
                  {fait ? <Icon name="check" size={20} label="Terminé" /> : j.jour}
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Jour {j.jour}</span>
                  <span className="block font-semibold text-ink">{j.theme}</span>
                </span>
                <Icon name="chevron" className={cn("text-muted transition-transform", open && "rotate-90")} />
              </button>
              {open && (
                <div className="flex flex-col gap-4 px-4 pb-5">
                  <p className="leading-relaxed text-ink">{j.intro}</p>
                  <section className="flex flex-col gap-2 rounded-2xl bg-soft p-4">
                    <h3 className="font-semibold text-ink">
                      Exercice · {j.exercice.titre} <span className="font-normal text-muted">({j.exercice.duree} min)</span>
                    </h3>
                    <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-ink">
                      {j.exercice.etapes.map((e) => (
                        <li key={e} className="leading-relaxed">{e}</li>
                      ))}
                    </ol>
                    {exercice && isForSport(exercice.sports, sport) && (
                      <Link href={`/exercices/${exercice.id}`} className="inline-flex min-h-12 items-center gap-1 font-medium text-accent">
                        Ouvrir l&apos;exercice guidé <Icon name="chevron" size={18} />
                      </Link>
                    )}
                  </section>
                  <section className="flex flex-col gap-1">
                    <h3 className="flex items-center gap-2 font-semibold text-ink"><Icon name="target" size={20} className="text-accent" /> Mission terrain</h3>
                    <p className="leading-relaxed text-ink">{bySport(j.mission, sport)}</p>
                  </section>
                  <section className="flex flex-col gap-1">
                    <h3 className="flex items-center gap-2 font-semibold text-ink"><Icon name="info" size={20} className="text-accent" /> Ton bilan</h3>
                    <p className="leading-relaxed text-muted">{j.bilan}</p>
                  </section>
                  <Button variant={fait ? "secondary" : "primary"} onClick={() => basculer(j.jour)}>
                    {fait ? "Marquer comme non terminé" : "J'ai terminé ce jour"}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
