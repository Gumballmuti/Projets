"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Exhale } from "@/components/match/Exhale";
import { MatchButton, MatchChoices, MatchScreen, MatchText, MatchTitle } from "@/components/match/MatchScreen";
import { SITUATIONS_PRESSION } from "@/content/pression";
import { filterBySport } from "@/lib/content";
import { vibrate } from "@/lib/haptics";
import { useAppData } from "@/lib/store";

const TOTAL = 5;

export function PressionRoutine({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useAppData();
  const sport = data.profil.sportActif;
  const motCle = data.profil.motCle;
  const situation = SITUATIONS_PRESSION.find((s) => s.id === id)!;
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<string | null>(null);
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const phrase =
    (sport !== "autre" ? situation.phrasePartenaire?.[sport] : undefined) ?? situation.phrasePartenaire?.all;
  const mode = situation.titre;
  const common = { mode, step: { current: step, total: TOTAL }, closeHref: "/match/pression" };

  if (step === 1) {
    return (
      <MatchScreen {...common} onTap={next} tapLabel="Continuer">
        <MatchTitle>{situation.normalise[0]}</MatchTitle>
        {situation.normalise.slice(1).map((t) => (
          <MatchText key={t} className="text-2xl tall:text-3xl">{t}</MatchText>
        ))}
        <MatchText className="text-base">Touche l&apos;écran pour continuer</MatchText>
      </MatchScreen>
    );
  }

  if (step === 2) {
    return (
      <MatchScreen {...common} action={<MatchButton onClick={next}>Suivant</MatchButton>}>
        <Exhale seconds={6} onDone={next} />
        <MatchText className="text-xl tall:text-2xl text-match-ink">{situation.corps}</MatchText>
      </MatchScreen>
    );
  }

  if (step === 3) {
    return (
      <MatchScreen {...common} onTap={next} tapLabel="Continuer">
        <MatchText className="text-lg uppercase tracking-wide">Ta cible</MatchText>
        <MatchTitle>{situation.cible.titre}</MatchTitle>
        <MatchText>{situation.cible.texte}</MatchText>
        {phrase && (
          <MatchText className="rounded-2xl bg-match-soft px-4 py-3 text-xl text-match-ink">
            Dis-lui : {phrase}
          </MatchText>
        )}
      </MatchScreen>
    );
  }

  if (step === 4) {
    const options = filterBySport(situation.plan.options, sport);
    return (
      <MatchScreen {...common}>
        <MatchTitle size="md">{situation.plan.question}</MatchTitle>
        <MatchChoices
          options={options.map((o) => ({ id: o.texte, label: o.texte }))}
          onPick={(o) => {
            setPlan(o);
            vibrate(25);
            next();
          }}
        />
      </MatchScreen>
    );
  }

  return (
    <MatchScreen
      {...common}
      action={
        <MatchButton onClick={() => router.push("/match/point-suivant")}>C&apos;est parti 🎾</MatchButton>
      }
    >
      {plan && <MatchText className="text-xl">Ton plan : <strong className="text-match-ink">{plan}</strong></MatchText>}
      <MatchTitle>{motCle || "Engage."}</MatchTitle>
      <MatchText className="text-xl tall:text-2xl text-match-ink">{situation.engage}</MatchText>
    </MatchScreen>
  );
}
