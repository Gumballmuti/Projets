"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { EXERCICES } from "@/content/exercices";
import { CATEGORIES, DIFFICULTES, MOMENTS } from "@/content/libelles";
import { SPORTS } from "@/content/sports";
import type { ExerciseCategory, ExerciseMoment } from "@/content/types";
import { cn } from "@/lib/cn";
import { filterBySport } from "@/lib/content";
import { useAppData } from "@/lib/store";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-12 shrink-0 rounded-full border-2 px-4 text-sm font-medium",
        on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

export function Bibliotheque() {
  const { data } = useAppData();
  const sport = data.profil.sportActif;
  const [categorie, setCategorie] = useState<ExerciseCategory | null>(null);
  const [moment, setMoment] = useState<ExerciseMoment | null>(null);
  const liste = filterBySport(EXERCICES, sport).filter(
    (e) => (!categorie || e.categorie === categorie) && (!moment || e.quand.includes(moment)),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Exercices" subtitle={`Contenu adapté : ${SPORTS[sport].label.toLowerCase()}${sport === "autre" ? "" : " et exercices communs"}.`} />

      <Link href="/programmes" className="flex items-center gap-4 rounded-3xl bg-primary p-5 text-on-primary shadow-card hover:bg-primary-hover">
        <Icon name="calendar" size={28} />
        <span className="flex-1">
          <span className="block text-lg font-semibold">Programmes de 7 jours</span>
          <span className="block text-sm opacity-90">Erreurs · Confiance · Pression · Concentration</span>
        </span>
        <Icon name="chevron" />
      </Link>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Filtrer par catégorie" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
          <Chip on={categorie === null} onClick={() => setCategorie(null)}>Toutes</Chip>
          {(Object.keys(CATEGORIES) as ExerciseCategory[]).map((c) => (
            <Chip key={c} on={categorie === c} onClick={() => setCategorie(categorie === c ? null : c)}>{CATEGORIES[c]}</Chip>
          ))}
        </div>
        <div role="group" aria-label="Filtrer par moment" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
          {(Object.keys(MOMENTS) as ExerciseMoment[]).map((m) => (
            <Chip key={m} on={moment === m} onClick={() => setMoment(moment === m ? null : m)}>{MOMENTS[m]}</Chip>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">{liste.length} exercice{liste.length > 1 ? "s" : ""}</p>
      <ul className="grid gap-3">
        {liste.map((e) => (
          <li key={e.id}>
            <Link href={`/exercices/${e.id}`} className="flex flex-col gap-1 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                {CATEGORIES[e.categorie]}
                {!e.sports.includes("all") && <span className="rounded-full bg-soft px-2 py-0.5 normal-case tracking-normal">{SPORTS[sport].label}</span>}
              </span>
              <span className="text-lg font-semibold text-ink">{e.titre}</span>
              <span className="text-sm text-muted">{e.objectif}</span>
              <span className="mt-1 text-xs text-muted">
                {e.duree} min · {DIFFICULTES[e.difficulte]}
                {e.express && " · version express"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {liste.length === 0 && <p className="text-muted">Aucun exercice pour ces filtres. Essaie une autre combinaison.</p>}
    </div>
  );
}
