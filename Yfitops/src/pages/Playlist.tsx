import { MoreHorizontal, Shuffle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import * as catalogue from "../catalogue";
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

/** Un album (/playlist/a123) ou une playlist (/playlist/p123) du catalogue. */
export default function Playlist() {
  const { id = "" } = useParams();
  const { donnees, erreur, chargement, recharger } = useCharger(() => catalogue.collection(id), [id]);
  const b = useBiblio();
  const lecteur = useLecteur();
  const menu = useMenuCollection();
  if (erreur) return <div className="page"><Erreur onReessayer={recharger} /></div>;
  const p = donnees?.infos;
  const titres = donnees?.titres ?? [];
  const album = id.startsWith("a");
  const contexte = contexteDe("playlist", id, p?.nom ?? "", p?.image, p ? `${album ? "Album" : "Playlist"} • ${p.auteur}` : "");
  const joue = lecteur.joueContexte("playlist", id);
  const auteur = p && (p.auteurId ? <Link to={`/artiste/${p.auteurId}`} className="gras">{p.auteur}</Link> : <b>{p.auteur}</b>);
  return (
    <div className="page collection">
      <EnTete type={album ? (titres.length === 1 ? "Single" : "Album") : "Playlist"} nom={p?.nom ?? ""} couleur={teinte(id)} image={p?.image}
        description={p?.description} enLecture={joue} onJouer={() => lecteur.jouerContexte(titres, contexte)}
        meta={p && <>{auteur}{p.annee && <> • {p.annee}</>} • {titres.length} titres, <span className="doux">{dureeTotale(titres)}</span></>} />
      <BarreActions>
        <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(titres, contexte)} />
        <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(titres, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
        {p && <BoutonEnregistrer actif={b.enregistree(id)} onClick={() => b.basculerEnregistree(p)} />}
        {p && <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, titres, { playlist: p })}><MoreHorizontal size={28} /></button>}
      </BarreActions>
      {chargement && !donnees ? <LignesFantomes /> : <ListeTitres titres={titres} contexte={contexte} colonne={album ? null : "album"} pochettes={!album} />}
    </div>
  );
}
