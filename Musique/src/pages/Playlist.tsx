import { MoreHorizontal, Shuffle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import * as audius from "../audius";
import BoutonLecture from "../composants/BoutonLecture";
import { BoutonEnregistrer } from "../composants/Coeur";
import EnTete, { BarreActions } from "../composants/EnTete";
import { Erreur, LignesFantomes } from "../composants/Etats";
import ListeTitres from "../composants/ListeTitres";
import { useMenuCollection } from "../composants/Menus";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { dureeTotale, teinte } from "../outils";
import { useCharger } from "../useCharger";
import { contexteDe } from "./communs";

/** Une playlist ou un album d'Audius. */
export default function Playlist() {
  const { id = "" } = useParams();
  const { donnees, erreur, chargement, recharger } = useCharger(
    () => Promise.all([audius.playlist(id), audius.titresPlaylist(id)]), [id]);
  const b = useBiblio();
  const lecteur = useLecteur();
  const menu = useMenuCollection();
  if (erreur) return <div className="page"><Erreur onReessayer={recharger} /></div>;
  const [p, titres = []] = donnees ?? [];
  if (!chargement && !p) return <div className="page"><h1>Playlist introuvable</h1></div>;
  const contexte = contexteDe("playlist", id, p?.nom ?? "", p?.image, p ? `${p.album ? "Album" : "Playlist"} • ${p.auteur}` : "");
  const joue = lecteur.joueContexte("playlist", id);
  return (
    <div className="page collection">
      <EnTete type={p?.album ? "Album" : "Playlist"} nom={p?.nom ?? ""} couleur={teinte(id)} image={p?.image}
        description={p?.description} enLecture={joue} onJouer={() => lecteur.jouerContexte(titres, contexte)}
        meta={p && <><Link to={`/artiste/${p.auteurId}`} className="gras">{p.auteur}</Link> • {titres.length} titres, <span className="doux">{dureeTotale(titres)}</span></>} />
      <BarreActions>
        <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(titres, contexte)} />
        <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(titres, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
        {p && <BoutonEnregistrer actif={b.enregistree(id)} onClick={() => b.basculerEnregistree(p)} />}
        {p && <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, titres, { playlist: p })}><MoreHorizontal size={28} /></button>}
      </BarreActions>
      {chargement && !donnees ? <LignesFantomes /> : <ListeTitres titres={titres} contexte={contexte} colonne={p?.album ? "ecoutes" : "genre"} pochettes={!p?.album} />}
    </div>
  );
}
