import { ListMusic, PanelRight, Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useInterface } from "../etat/Interface";
import { useLecteur } from "../etat/Lecteur";
import { Coeur } from "./Coeur";
import { Commandes, Progression } from "./Commandes";
import Curseur from "./Curseur";
import Pochette from "./Pochette";

/** La barre du bas sur ordinateur : titre en cours, commandes, progression, file d'attente, volume. */
export default function BarreLecteur() {
  const l = useLecteur();
  const ui = useInterface();
  const t = l.enCours;
  const niveau = l.muet ? 0 : l.volume;
  const IconeVolume = niveau === 0 ? VolumeX : niveau < 0.33 ? Volume : niveau < 0.66 ? Volume1 : Volume2;
  return (
    <footer className="barre-lecteur">
      <div className="barre-titre">
        {t && (
          <>
            <Link to={l.contexte?.lien ?? "/"} aria-label="Afficher la source de la lecture"><Pochette src={t.image} taille={56} /></Link>
            <div className="textes">
              <Link to={l.contexte?.lien ?? "/"} className="nom">{t.titre}</Link>
              <Link to={`/artiste/${t.artisteId}`} className="artiste">{t.artiste}</Link>
            </div>
            <Coeur titre={t} toujours />
          </>
        )}
      </div>
      <div className="barre-centre">
        <Commandes />
        <Progression />
      </div>
      <div className="barre-droite">
        <button className={"icone" + (ui.panneau === "enCours" ? " actif" : "")} title="Vue « En cours de lecture »"
          aria-label="Vue « En cours de lecture »" onClick={() => ui.basculerPanneau("enCours")}><PanelRight size={18} /></button>
        <button className={"icone" + (ui.panneau === "file" ? " actif" : "")} title="File d'attente" aria-label="File d'attente"
          onClick={() => ui.basculerPanneau("file")}><ListMusic size={18} /></button>
        <button className="icone" title={l.muet ? "Réactiver le son" : "Couper le son"} aria-label={l.muet ? "Réactiver le son" : "Couper le son"}
          onClick={l.basculerMuet}><IconeVolume size={18} /></button>
        <div className="volume"><Curseur libelle="Volume" valeur={niveau} max={1} continu onValider={l.changerVolume} /></div>
      </div>
    </footer>
  );
}
