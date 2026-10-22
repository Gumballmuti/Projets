import { ChevronDown, Home, Library, ListMusic, MoreHorizontal, Pause, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useInterface } from "../etat/Interface";
import { useLecteur, useTemps } from "../etat/Lecteur";
import { teinte } from "../outils";
import { Coeur } from "./Coeur";
import { Commandes, Progression } from "./Commandes";
import { useMenuTitre } from "./Menus";
import { LigneFile } from "./PanneauDroit";
import Pochette from "./Pochette";

export function NavMobile() {
  return (
    <nav className="nav-mobile">
      <NavLink to="/" end><Home size={24} /><span>Accueil</span></NavLink>
      <NavLink to="/recherche"><Search size={24} /><span>Rechercher</span></NavLink>
      <NavLink to="/bibliotheque"><Library size={24} /><span>Bibliothèque</span></NavLink>
    </nav>
  );
}

/** Le petit lecteur au-dessus des onglets ; un toucher ouvre le lecteur en plein écran. */
export function MiniLecteur() {
  const l = useLecteur();
  const ui = useInterface();
  const { temps, duree } = useTemps();
  const t = l.enCours;
  if (!t) return null;
  return (
    <div className="mini-lecteur" style={{ background: teinte(t.artisteId || t.id) }} onClick={() => ui.setPleinEcran(true)}>
      <Pochette src={t.image} taille={40} />
      <div className="textes">
        <span className="nom">{t.titre}</span>
        <span className="artiste">{t.artiste}</span>
      </div>
      <Coeur titre={t} taille={22} toujours />
      <button className="icone" aria-label={l.enLecture ? "Pause" : "Lecture"} onClick={(e) => { e.stopPropagation(); l.basculerLecture(); }}>
        {l.enLecture ? <Pause size={24} fill="currentColor" strokeWidth={0} /> : <Play size={24} fill="currentColor" strokeWidth={0} />}
      </button>
      <div className="mini-progression" style={{ width: `${duree ? (temps / duree) * 100 : 0}%` }} />
    </div>
  );
}

export function LecteurPleinEcran() {
  const l = useLecteur();
  const ui = useInterface();
  const menu = useMenuTitre();
  const [file, setFile] = useState(false);
  const t = l.enCours;
  useEffect(() => {
    if (!t) ui.setPleinEcran(false);
  }, [t, ui]);
  if (!t || !ui.pleinEcran) return null;
  const fermer = () => { ui.setPleinEcran(false); setFile(false); };
  return (
    <div className="plein-ecran" style={{ "--couleur": teinte(t.artisteId || t.id) } as React.CSSProperties}>
      <header>
        <button className="icone" aria-label="Fermer" onClick={fermer}><ChevronDown size={28} /></button>
        <div className="plein-ecran-source">
          <span>{file ? "File d'attente" : "Lecture en cours depuis"}</span>
          {!file && <Link to={l.contexte?.lien ?? "/"} onClick={fermer}>{l.contexte?.nom ?? "Yfitops"}</Link>}
        </div>
        <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, t)}><MoreHorizontal size={24} /></button>
      </header>
      {file ? (
        <div className="plein-ecran-file">
          <h3>En cours de lecture</h3>
          <LigneFile titre={t} courant />
          {l.file.length > 0 && <h3>Suivant dans la file d'attente</h3>}
          {l.file.map((x, i) => <LigneFile key={x.id + i} titre={x} onJouer={() => l.jouerDepuisFile(i)} onRetirer={() => l.retirerFile(i)} />)}
          {l.aSuivre.length > 0 && <h3>Suivant de : {l.contexte?.nom ?? "la liste"}</h3>}
          {l.aSuivre.slice(0, 50).map((x, i) => <LigneFile key={x.id + i} titre={x} onJouer={() => l.jouerDepuisSuite(i)} />)}
        </div>
      ) : (
        <div className="plein-ecran-pochette"><Pochette src={t.image} /></div>
      )}
      <div className="plein-ecran-bas">
        <div className="plein-ecran-titre">
          <div className="textes">
            <span className="grand-nom">{t.titre}</span>
            <Link to={`/artiste/${t.artisteId}`} className="artiste" onClick={fermer}>{t.artiste}</Link>
          </div>
          <Coeur titre={t} taille={26} toujours />
        </div>
        <Progression />
        <Commandes grand />
        <div className="plein-ecran-outils">
          <span />
          <button className={"icone" + (file ? " actif" : "")} aria-label="File d'attente" onClick={() => setFile(!file)}><ListMusic size={22} /></button>
        </div>
      </div>
    </div>
  );
}
