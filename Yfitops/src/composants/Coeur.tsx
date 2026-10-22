import { CircleCheck, Heart, PlusCircle } from "lucide-react";
import { useBiblio } from "../etat/Bibliotheque";
import type { Titre } from "../types";

/** « J'aime » d'un titre : le cœur vert. */
export function Coeur({ titre, taille = 18, toujours }: { titre: Titre; taille?: number; toujours?: boolean }) {
  const b = useBiblio();
  const aime = b.aime(titre.id);
  return (
    <button className={"icone coeur" + (aime ? " actif" : "") + (toujours ? " toujours" : "")}
      aria-label={aime ? "Retirer des titres likés" : "Ajouter aux titres likés"} title={aime ? "Retirer des titres likés" : "Ajouter aux titres likés"}
      onClick={(e) => { e.stopPropagation(); b.basculerAime(titre); }}>
      <Heart size={taille} fill={aime ? "currentColor" : "none"} />
    </button>
  );
}

/** « Ajouter à la bibliothèque » (playlist, album) : le plus qui devient une coche verte. */
export function BoutonEnregistrer({ actif, onClick, taille = 32, libelle = "la bibliothèque" }:
  { actif: boolean; onClick: () => void; taille?: number; libelle?: string }) {
  const texte = actif ? `Retirer de ${libelle}` : `Ajouter à ${libelle}`;
  return (
    <button className={"icone enregistrer" + (actif ? " actif" : "")} aria-label={texte} title={texte} onClick={onClick}>
      {actif ? <CircleCheck size={taille} fill="currentColor" color="#000" strokeWidth={1.5} className="coche" /> : <PlusCircle size={taille} strokeWidth={1.5} />}
    </button>
  );
}
