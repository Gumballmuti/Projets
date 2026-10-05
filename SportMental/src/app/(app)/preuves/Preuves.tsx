"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { dateLongue } from "@/lib/format";
import { LIMITES, newId } from "@/lib/storage";
import { useAppData } from "@/lib/store";

export function Preuves() {
  const { data, loaded, update } = useAppData();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function ajouter(e: FormEvent) {
    e.preventDefault();
    const t = texte.trim();
    if (t.length < 3) {
      setErreur("Écris au moins quelques mots.");
      return;
    }
    update((d) => ({ ...d, preuves: [...d.preuves, { id: newId(), date: new Date().toISOString(), texte: t.slice(0, LIMITES.texteLong) }] }));
    setTexte("");
    setErreur(null);
  }

  const preuves = [...data.preuves].reverse();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Carnet de preuves"
        subtitle="Ta confiance se construit sur des faits. Note ici ce qui a bien marché : un coup, une réaction, un entraînement réussi."
        backHref="/progression"
        backLabel="Progression"
      />
      <form onSubmit={ajouter} noValidate className="flex flex-col gap-3">
        <TextArea
          label="Nouvelle preuve"
          placeholder="Ex. J'ai gagné le tie-break en gardant ma routine à chaque point."
          maxLength={LIMITES.texteLong}
          value={texte}
          error={erreur ?? undefined}
          onChange={(e) => setTexte(e.target.value)}
        />
        <Button type="submit">
          <Icon name="plus" size={20} /> Ajouter
        </Button>
      </form>
      {loaded && preuves.length === 0 ? (
        <EmptyState icon="book" title="Ton carnet est vide pour l'instant">
          Ajoute ta première preuve : un moment précis où tu as bien joué ou bien réagi.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {preuves.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
              <Icon name="star" size={20} className="mt-0.5 text-accent" />
              <div className="flex-1">
                <p className="text-ink">{p.texte}</p>
                <p className="mt-1 text-sm capitalize text-muted">{dateLongue(p.date)}</p>
              </div>
              <button
                type="button"
                aria-label="Supprimer cette preuve"
                onClick={() => update((d) => ({ ...d, preuves: d.preuves.filter((x) => x.id !== p.id) }))}
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-soft"
              >
                <Icon name="trash" size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
