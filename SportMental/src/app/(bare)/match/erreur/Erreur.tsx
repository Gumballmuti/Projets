"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Exhale } from "@/components/match/Exhale";
import { MatchButton, MatchChoices, MatchScreen, MatchText, MatchTitle } from "@/components/match/MatchScreen";
import { CONTROLES, ERREUR_ETAPES, ERREUR_TYPE_QUESTION, TYPES_ERREUR, type ControleId, type TypeErreur } from "@/content/erreur";
import { SPORTS } from "@/content/sports";
import { bySport } from "@/lib/content";
import { cn } from "@/lib/cn";
import { vibrate } from "@/lib/haptics";
import { newId } from "@/lib/storage";
import { useAppData } from "@/lib/store";

type Step = "respire" | "accepte" | "ferme" | "recentre" | "consigne";

export function Erreur() {
  const router = useRouter();
  const { data, update } = useAppData();
  const sport = data.profil.sportActif;
  const [step, setStep] = useState<Step>("respire");
  const [controle, setControle] = useState<ControleId | null>(null);
  const [logId] = useState(newId);
  const [type, setType] = useState<TypeErreur | null>(null);
  const numero = step === "respire" ? 1 : step === "recentre" || step === "consigne" ? 3 : 2;

  function choisir(id: string) {
    const c = id as ControleId;
    setControle(c);
    update((d) => ({ ...d, erreurs: [...d.erreurs, { id: logId, date: new Date().toISOString(), type: null, controle: c }].slice(-500) }));
    setStep("consigne");
  }

  function marquerType(t: TypeErreur) {
    const value = type === t ? null : t;
    setType(value);
    update((d) => ({ ...d, erreurs: d.erreurs.map((e) => (e.id === logId ? { ...e, type: value } : e)) }));
  }

  if (step === "respire") {
    return (
      <MatchScreen
        mode="Erreur"
        step={{ current: numero, total: 3 }}
        action={<MatchButton onClick={() => setStep("accepte")}>Suivant</MatchButton>}
      >
        <MatchTitle>{ERREUR_ETAPES.respire.titre}</MatchTitle>
        <Exhale seconds={ERREUR_ETAPES.respire.secondes} onDone={() => setStep("accepte")} />
      </MatchScreen>
    );
  }

  if (step === "accepte" || step === "ferme") {
    const ferme = step === "ferme";
    return (
      <MatchScreen
        mode="Erreur"
        step={{ current: numero, total: 3 }}
        onTap={() => {
          if (!ferme) {
            vibrate(40);
            setStep("ferme");
            window.setTimeout(() => setStep((s) => (s === "ferme" ? "recentre" : s)), 900);
          } else setStep("recentre");
        }}
        tapLabel={ferme ? "Continuer" : "Fermer le point"}
      >
        <MatchTitle>{ERREUR_ETAPES.accepte.titre}</MatchTitle>
        <MatchText className="text-2xl tall:text-3xl text-match-ink">{ERREUR_ETAPES.accepte.texte}</MatchText>
        <span
          className={cn(
            "mt-4 flex size-28 items-center justify-center rounded-full border-4 border-match-btn text-lg font-bold transition-colors",
            ferme ? "bg-match-btn text-match-on-btn" : "text-match-ink",
          )}
          aria-hidden="true"
        >
          {ferme ? "Fermé" : "Touche"}
        </span>
        <MatchText className="text-lg">
          {ferme ? ERREUR_ETAPES.accepte.apres : `${ERREUR_ETAPES.accepte.consigne} ${SPORTS[sport].vocab.gesteCloture}`}
        </MatchText>
      </MatchScreen>
    );
  }

  if (step === "recentre") {
    return (
      <MatchScreen mode="Erreur" step={{ current: 3, total: 3 }}>
        <MatchTitle size="md">{ERREUR_ETAPES.recentre.titre}</MatchTitle>
        <MatchChoices options={CONTROLES.map((c) => ({ id: c.id, label: bySport(c.label, sport) }))} onPick={choisir} />
      </MatchScreen>
    );
  }

  const choix = CONTROLES.find((c) => c.id === controle) ?? CONTROLES[0]!;
  return (
    <MatchScreen
      mode="Erreur"
      step={{ current: 3, total: 3 }}
      action={<MatchButton onClick={() => router.push("/match/point-suivant?go=1")}>Point suivant</MatchButton>}
    >
      <MatchTitle size="md">{bySport(choix.consigne, sport)}</MatchTitle>
      <div className="flex w-full max-w-md flex-col gap-2">
        <p className="text-base text-match-muted">{ERREUR_TYPE_QUESTION}</p>
        <div role="group" aria-label="Type d'erreur" className="grid grid-cols-2 gap-2">
          {TYPES_ERREUR.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              onClick={() => marquerType(t.id)}
              className={cn(
                "min-h-12 rounded-2xl border-2 px-3 font-semibold",
                type === t.id ? "border-match-btn bg-match-btn text-match-on-btn" : "border-match-muted/40 text-match-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </MatchScreen>
  );
}
