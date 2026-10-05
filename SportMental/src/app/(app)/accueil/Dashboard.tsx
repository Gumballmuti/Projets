"use client";

import Link from "next/link";
import { URGENCES } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { SPORTS } from "@/content/sports";
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

// Les cartes du tableau de bord (routine, dernier match, progression, programme) sont
// enrichies en phase 8 ; le composant est isolé pour garder la page légère.
function DashboardCards() {
  return (
    <section className="grid gap-3">
      <Link href="/routine" className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-accent">
          <Icon name="routine" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-ink">Ma routine pré-match</span>
          <span className="block text-sm text-muted">3 à 5 minutes avant de jouer</span>
        </span>
        <Icon name="chevron" className="text-muted" />
      </Link>
    </section>
  );
}
