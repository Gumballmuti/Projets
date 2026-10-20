import { ListMusic, MoreHorizontal, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as audius from "../audius";
import { useBiblio } from "../etat/Bibliotheque";
import { useInterface } from "../etat/Interface";
import { useLecteur } from "../etat/Lecteur";
import { nombre } from "../outils";
import type { Artiste, Titre } from "../types";
import { Coeur } from "./Coeur";
import { useMenuTitre } from "./Menus";
import Pochette from "./Pochette";

/** Panneau de droite : « En cours de lecture » ou « File d'attente ». */
export default function PanneauDroit() {
  const ui = useInterface();
  return (
    <aside className="panneau-droit">
      {ui.panneau === "file" ? <FileAttente /> : <EnCours />}
    </aside>
  );
}

function EnCours() {
  const l = useLecteur();
  const ui = useInterface();
  const b = useBiblio();
  const menu = useMenuTitre();
  const t = l.enCours;
  const [artiste, setArtiste] = useState<Artiste | null>(null);
  useEffect(() => {
    setArtiste(null);
    if (t?.artisteId) audius.artiste(t.artisteId).then(setArtiste).catch(() => {});
  }, [t?.artisteId]);
  const prochain = l.file[0] ?? l.aSuivre[0];
  return (
    <>
      <header className="panneau-entete">
        <Link to={l.contexte?.lien ?? "/"} className="panneau-titre">{l.contexte?.nom ?? "En cours de lecture"}</Link>
        <button className="icone" aria-label="Fermer" onClick={ui.fermerPanneau}><X size={18} /></button>
      </header>
      {!t ? <p className="doux panneau-vide">Lance un titre pour le voir ici.</p> : (
        <div className="panneau-defile">
          <Pochette src={t.image} className="panneau-pochette" />
          <div className="panneau-ligne">
            <div className="textes">
              <span className="grand-nom">{t.titre}</span>
              <Link to={`/artiste/${t.artisteId}`} className="artiste">{t.artiste}</Link>
            </div>
            <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, t)}><MoreHorizontal size={20} /></button>
            <Coeur titre={t} taille={20} toujours />
          </div>
          {artiste && (
            <Link to={`/artiste/${artiste.id}`} className="panneau-artiste">
              <div className="panneau-artiste-image" style={{ backgroundImage: `url("${artiste.banniere || artiste.image}")` }}>
                <span>À propos de l'artiste</span>
              </div>
              <div className="panneau-artiste-texte">
                <b>{artiste.nom}</b>
                <span className="doux">{nombre(artiste.abonnes ?? 0)} abonnés</span>
                {artiste.bio && <p className="doux">{artiste.bio.slice(0, 160)}{artiste.bio.length > 160 ? "…" : ""}</p>}
                <button className={"bouton-contour" + (b.suit(artiste.id) ? " actif" : "")}
                  onClick={(e) => { e.preventDefault(); b.basculerArtiste(artiste); }}>
                  {b.suit(artiste.id) ? "Abonné(e)" : "S'abonner"}
                </button>
              </div>
            </Link>
          )}
          {prochain && (
            <div className="panneau-carte">
              <div className="panneau-carte-entete"><b>Suivant dans la file d'attente</b>
                <button className="lien" onClick={() => ui.basculerPanneau("file")}>Ouvrir la file d'attente</button></div>
              <LigneFile titre={prochain} onJouer={() => (l.file.length ? l.jouerDepuisFile(0) : l.jouerDepuisSuite(0))} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function FileAttente() {
  const l = useLecteur();
  const ui = useInterface();
  return (
    <>
      <header className="panneau-entete">
        <span className="panneau-titre">File d'attente</span>
        <button className="icone" aria-label="Fermer" onClick={ui.fermerPanneau}><X size={18} /></button>
      </header>
      <div className="panneau-defile">
        {!l.enCours ? (
          <div className="panneau-vide"><ListMusic size={48} /><b>Ajoute des titres à ta file d'attente</b>
            <p className="doux">Clique sur « … » à côté d'un titre, puis « Ajouter à la file d'attente ».</p></div>
        ) : (
          <>
            <h3>En cours de lecture</h3>
            <LigneFile titre={l.enCours} courant />
            {l.file.length > 0 && (
              <>
                <div className="file-entete"><h3>Suivant dans la file d'attente</h3>
                  <button className="lien" onClick={l.viderFile}>Vider la file d'attente</button></div>
                {l.file.map((t, i) => <LigneFile key={t.id + i} titre={t} onJouer={() => l.jouerDepuisFile(i)} onRetirer={() => l.retirerFile(i)} />)}
              </>
            )}
            {l.aSuivre.length > 0 && (
              <>
                <h3>Suivant de : {l.contexte?.nom ?? "la liste"}</h3>
                {l.aSuivre.slice(0, 50).map((t, i) => <LigneFile key={t.id + i} titre={t} onJouer={() => l.jouerDepuisSuite(i)} />)}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function LigneFile({ titre, courant, onJouer, onRetirer }: { titre: Titre; courant?: boolean; onJouer?: () => void; onRetirer?: () => void }) {
  const menu = useMenuTitre();
  return (
    <div className={"ligne-file" + (courant ? " courant" : "")} onDoubleClick={onJouer}
      onContextMenu={(e) => { e.preventDefault(); menu(e, titre); }}>
      <div className="ligne-file-image">
        <Pochette src={titre.image} taille={48} />
        {onJouer && <button className="icone" aria-label={`Lire ${titre.titre}`} onClick={onJouer}><Play size={18} fill="currentColor" strokeWidth={0} /></button>}
      </div>
      <div className="textes">
        <span className="nom">{titre.titre}</span>
        <span className="artiste">{titre.artiste}</span>
      </div>
      {onRetirer ? <button className="icone visible-survol" aria-label="Retirer de la file d'attente" onClick={onRetirer}><X size={16} /></button>
        : <Coeur titre={titre} taille={16} />}
    </div>
  );
}
