"use client";

import { useState } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ChoiceList } from "@/components/ui/ChoiceList";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RatingScale } from "@/components/ui/RatingScale";

// Aperçu temporaire du design system (remplacé par la landing en phase 4).
export default function Home() {
  const [sport, setSport] = useState<"padel" | "volley" | "autre" | null>("padel");
  const [note, setNote] = useState<number | null>(7);
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <Logo />
      <div className="flex items-end gap-3">
        <LogoMark size={24} />
        <LogoMark size={48} />
        <LogoMark size={96} />
      </div>
      <PageHeader title="Design system" subtitle="Ton meilleur jeu commence dans ta tête." />
      <Card className="flex flex-col gap-3">
        <CardTitle>Boutons</CardTitle>
        <Button>Commencer</Button>
        <Button variant="secondary">Découvrir</Button>
        <Button variant="ghost">Lien discret</Button>
        <Button variant="danger">Tout supprimer</Button>
      </Card>
      <div className="rounded-3xl bg-match-bg p-6 text-match-ink">
        <p className="text-5xl font-extrabold">Respire.</p>
        <p className="mt-2 text-xl text-match-muted">Le point précédent est terminé.</p>
        <Button variant="match" size="xl" block className="mt-6">
          Point suivant
        </Button>
      </div>
      <ChoiceList
        legend="Ton sport"
        layout="chips"
        value={sport}
        onChange={setSport}
        options={[
          { value: "padel", label: "Padel" },
          { value: "volley", label: "Volley-ball" },
          { value: "autre", label: "Autre sport" },
        ]}
      />
      <RatingScale label="Confiance" value={note} onChange={setNote} lowLabel="Faible" highLabel="Élevée" />
      <TextField label="Ton prénom" placeholder="Ex. Sam" hint="Facultatif" />
      <ProgressBar value={0.4} label="Progression" />
      <Notice title="Bon à savoir">Tes données restent sur ton téléphone.</Notice>
      <EmptyState title="Aucun match pour l'instant">
        Enregistre ton premier match pour commencer à suivre ta progression.
      </EmptyState>
      <Disclaimer />
    </main>
  );
}
