import { Clock3, MoreHorizontal, Play, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { libelleGenre } from "../audius";
import { useLecteur } from "../etat/Lecteur";
import { dateRelative, duree, nombre } from "../outils";
import type { Contexte, MaPlaylist, Titre } from "../types";
import { Coeur } from "./Coeur";
import { useMenuTitre } from "./Menus";
import Pochette from "./Pochette";
import { useMobile } from "../useMobile";

interface Props {
  titres: Titre[];
  contexte: Contexte;
  colonne?: "ajout" | "ecoutes" | "genre" | null;
  playlist?: MaPlaylist; // ma playlist : on peut retirer et réordonner
  pochettes?: boolean;
  entete?: boolean;
  onReordonner?: (titres: Titre[]) => void;
  onAjouter?: (t: Titre) => void; // bouton « Ajouter » (recommandations)
}

/** Le tableau des titres : numéro (ou égaliseur), titre et artiste, colonne libre, durée, j'aime, « … ». */
export default function ListeTitres({ titres, contexte, colonne = "genre", playlist, pochettes = true, entete = true, onReordonner, onAjouter }: Props) {
  const lecteur = useLecteur();
  const menu = useMenuTitre();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [glisse, setGlisse] = useState<number | null>(null);
  const [cible, setCible] = useState<number | null>(null);
  const mobile = useMobile();

  const jouer = (i: number) => {
    const t = titres[i];
    if (lecteur.enCours?.id === t.id && lecteur.contexte?.id === contexte.id) return lecteur.basculerLecture();
    lecteur.jouer(titres, i, contexte, { aleatoire: false });
  };

  const titreColonne = { ajout: "Date d'ajout", ecoutes: "Écoutes", genre: "Genre" };

  return (
    <div className={"liste-titres" + (colonne ? " avec-colonne" : "")} role="grid">
      {entete && !mobile && (
        <div className="ligne-titre entete" role="row">
          <span className="num">#</span>
          <span>Titre</span>
          {colonne && <span className="col">{titreColonne[colonne]}</span>}
          <span className="duree"><Clock3 size={16} /></span>
        </div>
      )}
      {titres.map((t, i) => {
        const courant = lecteur.enCours?.id === t.id;
        const joue = courant && lecteur.enLecture;
        return (
          <div key={t.id + i} role="row"
            className={`ligne-titre ${courant ? "courant" : ""} ${choisi === t.id ? "choisi" : ""} ${cible === i ? "cible" : ""}`}
            onClick={() => (mobile && !onAjouter ? jouer(i) : setChoisi(t.id))}
            onDoubleClick={() => jouer(i)}
            onContextMenu={(e) => { e.preventDefault(); menu(e, t, { playlist }); }}
            draggable={!!onReordonner && !mobile}
            onDragStart={() => setGlisse(i)}
            onDragOver={(e) => { if (glisse !== null) { e.preventDefault(); setCible(i); } }}
            onDragEnd={() => { setGlisse(null); setCible(null); }}
            onDrop={() => {
              if (glisse === null || glisse === i || !onReordonner) return;
              const l = [...titres];
              const [x] = l.splice(glisse, 1);
              l.splice(i, 0, x);
              onReordonner(l);
            }}>
            <span className="num">
              {joue ? <span className="egaliseur" aria-label="En lecture"><i /><i /><i /><i /></span>
                : <span className="numero">{i + 1}</span>}
              <button className="icone jouer-ligne" aria-label={`Lire ${t.titre}`} onClick={(e) => { e.stopPropagation(); jouer(i); }}>
                <Play size={16} fill="currentColor" strokeWidth={0} />
              </button>
            </span>
            <span className="infos">
              {pochettes && <Pochette src={t.image} taille={40} />}
              <span className="textes">
                <span className="nom">{t.titre}</span>
                {mobile ? <span className="artiste">{t.artiste}</span>
                  : <Link to={`/artiste/${t.artisteId}`} className="artiste" onClick={(e) => e.stopPropagation()}>{t.artiste}</Link>}
              </span>
            </span>
            {colonne && (
              <span className="col">
                {colonne === "ajout" ? dateRelative(t.ajoute_le) : colonne === "ecoutes" ? nombre(t.ecoutes ?? 0)
                  : t.genre ? <Link to={`/genre/${encodeURIComponent(t.genre)}`} onClick={(e) => e.stopPropagation()}>{libelleGenre(t.genre)}</Link> : ""}
              </span>
            )}
            <span className="duree">
              {onAjouter ? (
                <button className="bouton-contour petit" onClick={(e) => { e.stopPropagation(); onAjouter(t); }}><Plus size={14} /> Ajouter</button>
              ) : (
                <>
                  <Coeur titre={t} taille={16} />
                  <span className="temps">{duree(t.duree)}</span>
                  <button className="icone plus" aria-label={`Plus d'options pour ${t.titre}`}
                    onClick={(e) => { e.stopPropagation(); menu(e.currentTarget, t, { playlist }); }}>
                    <MoreHorizontal size={18} />
                  </button>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
