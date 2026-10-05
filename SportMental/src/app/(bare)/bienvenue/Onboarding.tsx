"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ChoiceList } from "@/components/ui/ChoiceList";
import { DISCLAIMER_TEXT } from "@/components/ui/Disclaimer";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SPORTS, SPORT_CHOICES, VOLLEY_POSTES, type VolleyPoste } from "@/content/sports";
import type { SportChoice, SportId } from "@/content/types";
import { useAppData } from "@/lib/store";

export function Onboarding() {
  const router = useRouter();
  const { data, update } = useAppData();
  const [step, setStep] = useState(0);
  const [sport, setSport] = useState<SportChoice | null>(data.profil.sports[0] ?? null);
  const [second, setSecond] = useState<SportId | null>(
    (data.profil.sports[1] as SportId | undefined) ?? null,
  );
  const [prenom, setPrenom] = useState(data.profil.prenom);
  const [poste, setPoste] = useState<VolleyPoste | null>(data.profil.posteVolley);

  const autreSport: SportId | null = sport === "padel" ? "volley" : sport === "volley" ? "padel" : null;
  const suitVolley = sport === "volley" || second === "volley";

  function finish() {
    if (!sport) return;
    const sports: SportChoice[] = second && second !== sport ? [sport, second] : [sport];
    update((d) => ({
      ...d,
      profil: {
        ...d.profil,
        prenom: prenom.trim().slice(0, 40),
        sports,
        sportActif: sport,
        posteVolley: suitVolley ? poste : null,
        onboarded: true,
      },
    }));
    router.replace("/accueil");
  }

  return (
    <main className="pt-safe pb-safe mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <ProgressBar value={(step + 1) / 3} label={`Étape ${step + 1} sur 3`} />

      {step === 0 && (
        <section className="flex flex-1 flex-col gap-6">
          <LogoMark size={64} />
          <h1 className="text-3xl font-bold tracking-tight text-ink">Bienvenue dans Sport Mental</h1>
          <p className="text-lg leading-relaxed text-muted">
            Ton meilleur jeu commence dans ta tête. Ici, tu prépares ton mental avant le match et tu
            trouves de l&apos;aide en quelques secondes pendant le match.
          </p>
          <ul className="flex flex-col gap-3 text-ink">
            <li className="flex gap-3"><Icon name="lock" className="text-accent" /> Sans compte, gratuit.</li>
            <li className="flex gap-3"><Icon name="shield" className="text-accent" /> Tes données restent sur ton téléphone.</li>
            <li className="flex gap-3"><Icon name="bolt" className="text-accent" /> Fonctionne aussi hors connexion.</li>
          </ul>
          <Notice tone="care" title="À savoir">{DISCLAIMER_TEXT}</Notice>
          <Button size="lg" block className="mt-auto" onClick={() => setStep(1)}>
            J&apos;ai compris, on commence
          </Button>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-1 flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Quel est ton sport principal ?</h1>
          <ChoiceList
            legend="Ton sport principal"
            hideLegend
            value={sport}
            onChange={(v) => {
              setSport(v);
              setSecond(null);
            }}
            options={SPORT_CHOICES.map((s) => ({ value: s, label: SPORTS[s].label, hint: SPORTS[s].description }))}
          />
          {autreSport && (
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3">
              <input
                type="checkbox"
                className="size-5 accent-[var(--primary)]"
                checked={second === autreSport}
                onChange={(e) => setSecond(e.target.checked ? autreSport : null)}
              />
              <span>Je joue aussi au {SPORTS[autreSport].label.toLowerCase()}</span>
            </label>
          )}
          <p className="text-sm text-muted">Tu pourras changer ce choix à tout moment dans ton profil.</p>
          <div className="mt-auto flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => setStep(0)}>Retour</Button>
            <Button size="lg" className="flex-1" disabled={!sport} onClick={() => setStep(2)}>Continuer</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-1 flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">On fait connaissance ?</h1>
          <TextField
            label="Ton prénom"
            hint="Facultatif. Il reste sur ton téléphone."
            value={prenom}
            maxLength={40}
            autoComplete="given-name"
            onChange={(e) => setPrenom(e.target.value)}
          />
          {suitVolley && (
            <ChoiceList
              legend="Ton poste au volley (facultatif)"
              value={poste}
              onChange={setPoste}
              options={VOLLEY_POSTES.map((p) => ({ value: p.id, label: p.label }))}
            />
          )}
          <div className="mt-auto flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => setStep(1)}>Retour</Button>
            <Button size="lg" className="flex-1" onClick={finish}>C&apos;est parti</Button>
          </div>
        </section>
      )}
    </main>
  );
}
