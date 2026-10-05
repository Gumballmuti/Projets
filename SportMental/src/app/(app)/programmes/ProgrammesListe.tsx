"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PROGRAMMES } from "@/content/programmes";
import { useAppData } from "@/lib/store";

export function ProgrammesListe() {
  const { data } = useAppData();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programmes de 7 jours"
        subtitle="5 à 10 minutes par jour : un exercice hors terrain, une mission à tester au prochain entraînement, une question de bilan."
        backHref="/exercices"
        backLabel="Exercices"
      />
      <ul className="grid gap-3">
        {PROGRAMMES.map((p) => {
          const faits = data.programmes[p.id]?.joursTermines.length ?? 0;
          const enCours = data.programmeEnCours === p.id;
          return (
            <li key={p.id}>
              <Link href={`/programmes/${p.id}`} className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-ink">{p.titre}</span>
                  {enCours && <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-accent">En cours</span>}
                </span>
                <span className="text-sm text-muted">{p.description}</span>
                {faits > 0 && (
                  <span className="mt-1 flex items-center gap-3">
                    <ProgressBar value={faits / 7} label={`${faits} jours sur 7`} className="flex-1" />
                    <span className="text-sm tabular-nums text-muted">{faits}/7</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
