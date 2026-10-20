import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useInterface } from "../etat/Interface";
import BoutonLecture from "./BoutonLecture";
import Pochette from "./Pochette";

interface Props {
  type: string; // « Playlist », « Album », « Artiste »…
  nom: string;
  couleur: string;
  image?: string;
  mosaique?: string[];
  icone?: ReactNode;
  fondPochette?: string;
  rond?: boolean;
  description?: ReactNode;
  meta?: ReactNode;
  banniere?: string; // grande image de fond (artiste)
  onClickNom?: () => void;
  enLecture?: boolean;
  onJouer?: () => void;
}

/** L'en-tête d'une playlist, d'un album ou d'un artiste : dégradé de couleur, grande pochette, gros titre. */
export default function EnTete(p: Props) {
  const { defilement } = useInterface();
  const aller = useNavigate();
  const opaque = Math.min(1, Math.max(0, (defilement - 180) / 80));
  const taillePolice = p.nom.length > 40 ? "petit" : p.nom.length > 20 ? "moyen" : "grand";
  return (
    <>
      <div className="barre-collante" style={{ background: `color-mix(in srgb, ${p.couleur} ${opaque * 100}%, transparent)` }}>
        <button className="icone retour-mobile" aria-label="Retour" onClick={() => aller(-1)}><ChevronLeft size={26} /></button>
        <div className="barre-collante-contenu" style={{ opacity: opaque }}>
          {p.onJouer && <BoutonLecture enLecture={!!p.enLecture} onClick={p.onJouer} taille={44} />}
          <span>{p.nom}</span>
        </div>
      </div>
      <header className={"en-tete" + (p.banniere ? " avec-banniere" : "") + (p.rond ? " artiste" : "")}
        style={{ "--couleur": p.couleur, backgroundImage: p.banniere ? `linear-gradient(transparent 30%, rgba(0,0,0,.6)), url("${p.banniere}")` : undefined } as React.CSSProperties}>
        {!p.banniere && (
          <Pochette src={p.image} mosaique={p.mosaique} rond={p.rond} icone={p.icone} fond={p.fondPochette} className="en-tete-pochette" />
        )}
        <div className="en-tete-textes">
          <span className="en-tete-type">{p.type}</span>
          <h1 className={"en-tete-nom " + taillePolice} onClick={p.onClickNom} style={p.onClickNom ? { cursor: "pointer" } : undefined}>{p.nom}</h1>
          {p.description && <p className="en-tete-description">{p.description}</p>}
          {p.meta && <div className="en-tete-meta">{p.meta}</div>}
        </div>
      </header>
      <div className="fond-degrade" style={{ "--couleur": p.couleur } as React.CSSProperties} />
    </>
  );
}

export function BarreActions({ children }: { children: ReactNode }) {
  return <div className="barre-actions">{children}</div>;
}
