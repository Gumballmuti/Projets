import type { ReactNode } from "react";
import { Notice } from "@/components/ui/Notice";

/** Gabarit des pages légales : modèles de départ, clairement marqués « à faire valider ». */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="text-sm text-muted">Dernière mise à jour : {updated}</p>
      </header>
      <Notice title="Modèle à faire valider">
        Ce texte est un modèle de départ. Il doit être relu et validé par un professionnel du droit avant toute
        exploitation commerciale. Les champs entre crochets [ainsi] sont à compléter.
      </Notice>
      <div className="legal flex flex-col gap-4 leading-relaxed text-ink [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-accent [&_a]:underline">
        {children}
      </div>
    </article>
  );
}
