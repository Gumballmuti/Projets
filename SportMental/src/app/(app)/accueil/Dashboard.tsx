"use client";

import Link from "next/link";
import { URGENCES } from "@/components/layout/AppShell";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DIMENSIONS } from "@/content/bilan";
import { PROGRAMMES } from "@/content/programmes";
import { SPORTS } from "@/content/sports";
import { bySport } from "@/lib/content";
import { dateCourte } from "@/lib/format";
import { MIN_MATCHS_TENDANCE, sortByDate, statsParDimension } from "@/lib/stats";
import { useAppData } from "@/lib/store";

function salutation(prenom: string) {
  const h = new Date().getHours();
  const mot = h < 5 || h >= 18 ? "Bonsoir" : "Bonjour";
  return prenom ? `${mot} ${prenom}` : mot;
}

export function Dashboard() {
  const { data, loaded, update } = useAppData();
  const { profil } = data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink" suppressHydrationWarning>
          {loaded ? salutation(profil.prenom) : "Bonjour"}
        </h1>
        <p className="text-muted">Ton meilleur jeu commence dans ta tête.</p>
      </header>

      {profil.sports.length > 1 && (
        <div role="group" aria-label="Sport affiché" className="flex gap-2">
          {profil.sports.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={profil.sportActif === s}
              onClick={() => update((d) => ({ ...d, profil: { ...d.profil, sportActif: s } }))}
              className={
                profil.sportActif === s
                  ? "min-h-12 rounded-full bg-primary px-5 font-semibold text-on-primary"
                  : "min-h-12 rounded-full border-2 border-line bg-surface px-5 font-medium text-ink"
              }
            >
              {SPORTS[s].label}
            </button>
          ))}
        </div>
      )}

      <section aria-labelledby="urgences" className="flex flex-col gap-3">
        <h2 id="urgences" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Pendant le match
        </h2>
        {URGENCES.map((u) => (
          <Link
            key={u.href}
            href={u.href}
            className="flex min-h-16 items-center gap-4 rounded-3xl bg-primary px-5 text-lg font-bold text-on-primary shadow-card hover:bg-primary-hover"
          >
            <Icon name={u.icon} size={26} />
            {u.label}
          </Link>
        ))}
      </section>

      <DashboardCards />
    </div>
  );
}

function CardLink({ href, icon, titre, children }: { href: string; icon: IconName; titre: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-start gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-accent">
        <Icon name={icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold text-ink">{titre}</span>
        <span className="text-sm text-muted">{children}</span>
      </span>
      <Icon name="chevron" className="mt-3 text-muted" />
    </Link>
  );
}

/** Cartes du tableau de bord : uniquement des données réelles, états vides honnêtes. */
function DashboardCards() {
  const { data, loaded } = useAppData();
  if (!loaded) return null;
  const sport = data.profil.sportActif;
  const derniereRoutine = data.routines.at(-1);
  const matchs = sortByDate(data.matchs);
  const dernier = matchs.at(-1);
  const stats = statsParDimension(matchs);
  const enHausse = stats.filter((s) => s.tendance === "hausse" || s.tendance === "legere-hausse");
  const programme = data.programmeEnCours ? PROGRAMMES.find((p) => p.id === data.programmeEnCours) : undefined;
  const faits = programme ? data.programmes[programme.id]?.joursTermines.length ?? 0 : 0;

  return (
    <section aria-label="Tableau de bord" className="grid gap-3">
      <CardLink href="/routine" icon="routine" titre="Ma routine pré-match">
        {derniereRoutine ? (
          <>
            Dernière : {dateCourte(derniereRoutine.date)}
            {derniereRoutine.motCle && <> · mot-clé « {derniereRoutine.motCle} »</>}
            {derniereRoutine.intention && <span className="mt-1 block truncate">{derniereRoutine.intention}</span>}
          </>
        ) : (
          "3 à 5 minutes avant de jouer : respiration, intention, mot-clé."
        )}
      </CardLink>

      {dernier ? (
        <Link href="/progression" className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-ink">Mon dernier match</span>
            <span className="text-sm text-muted">{dateCourte(dernier.date)}</span>
          </span>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {DIMENSIONS.map((d) => (
              <li key={d.id} className="flex flex-col gap-1">
                <span className="flex justify-between text-xs text-muted">
                  <span>{d.court}</span>
                  <span className="tabular-nums text-ink">{dernier.notes[d.id]}/10</span>
                </span>
                <ProgressBar value={dernier.notes[d.id] / 10} label={`${bySport(d.label, sport)} : ${dernier.notes[d.id]} sur 10`} />
              </li>
            ))}
          </ul>
        </Link>
      ) : (
        <CardLink href="/bilan" icon="plus" titre="Mon dernier match">
          Aucun match enregistré. Après ton prochain match, fais ton bilan en 3 minutes.
        </CardLink>
      )}

      <CardLink href="/progression" icon="progress" titre="Ma progression">
        {matchs.length === 0
          ? "Enregistre ton premier match pour commencer à suivre ta progression."
          : matchs.length < MIN_MATCHS_TENDANCE
            ? `${matchs.length} match${matchs.length > 1 ? "s" : ""} enregistré${matchs.length > 1 ? "s" : ""}. Continue à enregistrer tes matchs pour découvrir tes tendances.`
            : enHausse.length
              ? `${matchs.length} matchs. En progression : ${enHausse.map((s) => DIMENSIONS.find((d) => d.id === s.id)!.court.toLowerCase()).join(", ")}.`
              : `${matchs.length} matchs enregistrés. Regarde tes tendances par dimension.`}
      </CardLink>

      {programme ? (
        <Link href={`/programmes/${programme.id}`} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-ink">{programme.titre}</span>
            <span className="text-sm tabular-nums text-muted">{faits}/7 jours</span>
          </span>
          <ProgressBar value={faits / 7} label={`Programme ${programme.titre} : ${faits} jours sur 7`} />
          <span className="text-sm text-muted">
            {faits >= 7 ? "Programme terminé. Bravo pour ta régularité." : `Jour ${Math.min(7, faits + 1)} : ${programme.jours[Math.min(6, faits)]!.theme}`}
          </span>
        </Link>
      ) : (
        <CardLink href="/programmes" icon="calendar" titre="Programmes de 7 jours">
          Erreurs, confiance, pression, concentration : 5 à 10 minutes par jour.
        </CardLink>
      )}
    </section>
  );
}
