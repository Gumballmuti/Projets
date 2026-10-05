"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { DIMENSIONS } from "@/content/bilan";
import { SPORTS } from "@/content/sports";
import { bySport } from "@/lib/content";
import { dateCourte, dateLongue } from "@/lib/format";
import { MIN_MATCHS_TENDANCE, TENDANCE_LABEL, moyenneMatch, sortByDate, statsParDimension } from "@/lib/stats";
import { useAppData } from "@/lib/store";

export function Progression() {
  const { data, loaded, update } = useAppData();
  const sport = data.profil.sportActif;
  const matchs = sortByDate(data.matchs);
  const stats = statsParDimension(matchs);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progression" subtitle="Tes notes après chaque match, et ce qu'elles racontent avec le temps." />
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/bilan" size="lg">
          <Icon name="plus" size={20} /> Faire mon bilan de match
        </ButtonLink>
        <ButtonLink href="/preuves" variant="secondary" size="lg">
          <Icon name="book" size={20} /> Carnet de preuves ({data.preuves.length})
        </ButtonLink>
      </div>

      {!loaded ? null : matchs.length === 0 ? (
        <EmptyState icon="progress" title="Aucun match enregistré">
          Enregistre ton premier match pour commencer à suivre ta progression.
        </EmptyState>
      ) : (
        <>
          {matchs.length < MIN_MATCHS_TENDANCE && (
            <p className="rounded-2xl bg-soft p-4 text-ink">
              Continue à enregistrer tes matchs pour découvrir tes tendances. Encore {MIN_MATCHS_TENDANCE - matchs.length} match
              {MIN_MATCHS_TENDANCE - matchs.length > 1 ? "s" : ""} et elles apparaîtront ici.
            </p>
          )}
          <ul className="grid gap-4">
            {stats.map((s) => {
              const dim = DIMENSIONS.find((d) => d.id === s.id)!;
              const label = bySport(dim.label, sport);
              return (
                <li key={s.id}>
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-semibold text-ink">{label}</h2>
                      {s.tendance && <span className="text-sm text-accent">{TENDANCE_LABEL[s.tendance]}</span>}
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-soft px-3 py-2">
                        <dt className="text-muted">Moyenne</dt>
                        <dd className="text-xl font-semibold tabular-nums text-ink">{s.moyenne?.toLocaleString("fr-BE")}</dd>
                      </div>
                      <div className="rounded-xl bg-soft px-3 py-2">
                        <dt className="text-muted">Dernier match</dt>
                        <dd className="text-xl font-semibold tabular-nums text-ink">{s.derniere}</dd>
                      </div>
                    </dl>
                    <LineChart title={label} points={matchs.map((m) => ({ label: dateCourte(m.date), value: m.notes[s.id] }))} />
                  </Card>
                </li>
              );
            })}
          </ul>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">Mes matchs</h2>
            <ul className="flex flex-col gap-2">
              {[...matchs].reverse().map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium capitalize text-ink">{dateLongue(m.date)}</p>
                    <p className="text-sm text-muted">
                      {SPORTS[m.sport].label} · moyenne {moyenneMatch(m).toLocaleString("fr-BE")}/10
                      {m.pointFort && ` · ${m.pointFort}`}
                    </p>
                  </div>
                  {confirm === m.id ? (
                    <div className="flex gap-1">
                      <Button variant="danger" className="min-h-12 px-3" onClick={() => update((d) => ({ ...d, matchs: d.matchs.filter((x) => x.id !== m.id) }))}>
                        Supprimer
                      </Button>
                      <Button variant="ghost" className="px-3" onClick={() => setConfirm(null)}>Annuler</Button>
                    </div>
                  ) : (
                    <button type="button" aria-label={`Supprimer le match du ${dateLongue(m.date)}`} onClick={() => setConfirm(m.id)} className="flex size-12 items-center justify-center rounded-xl text-muted hover:bg-soft">
                      <Icon name="trash" size={20} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
