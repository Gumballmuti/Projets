"use client";

import Link from "next/link";
import { MatchScreen, MatchTitle } from "@/components/match/MatchScreen";
import { SITUATIONS_PRESSION } from "@/content/pression";
import { filterBySport } from "@/lib/content";
import { useAppData } from "@/lib/store";

export function PressionListe() {
  const { data } = useAppData();
  const situations = filterBySport(SITUATIONS_PRESSION, data.profil.sportActif);
  return (
    <MatchScreen mode="Pression">
      <MatchTitle size="lg">Quelle situation ?</MatchTitle>
      <ul className="grid w-full max-w-md grid-cols-2 gap-2.5">
        {situations.map((s) => (
          <li key={s.id}>
            <Link
              href={`/match/pression/${s.id}`}
              className="flex min-h-16 items-center justify-center rounded-2xl border-2 border-match-muted/40 bg-match-soft px-2 py-2 text-base font-semibold leading-tight text-match-ink active:scale-[0.98]"
            >
              {s.titre}
            </Link>
          </li>
        ))}
      </ul>
    </MatchScreen>
  );
}
