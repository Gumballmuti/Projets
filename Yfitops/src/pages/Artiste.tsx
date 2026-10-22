import { BadgeCheck, MoreHorizontal, Shuffle } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import * as catalogue from "../catalogue";
import BoutonLecture from "../composants/BoutonLecture";
import Carte from "../composants/Carte";
import EnTete, { BarreActions } from "../composants/EnTete";
import Etagere from "../composants/Etagere";
import { Erreur, LignesFantomes } from "../composants/Etats";
import ListeTitres from "../composants/ListeTitres";
import { useMenuCollection } from "../composants/Menus";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { nombre, teinte } from "../outils";
import { useCharger } from "../useCharger";
import { contexteDe, useJouerCollection } from "./communs";

export default function Artiste() {
  const { id = "" } = useParams();
  const { donnees, erreur, chargement, recharger } = useCharger(
    () => Promise.all([catalogue.artiste(id), catalogue.titresArtiste(id)]), [id]);
  const suite = useCharger(() => Promise.all([catalogue.albumsArtiste(id), catalogue.playlistsArtiste(id), catalogue.artistesProches(id)]), [id]);
  const b = useBiblio();
  const lecteur = useLecteur();
  const menu = useMenuCollection();
  const jouerCollection = useJouerCollection();
  const [plus, setPlus] = useState(false);
  if (erreur) return <div className="page"><Erreur onReessayer={recharger} /></div>;
  const [a, titres = []] = donnees ?? [];
  if (!chargement && !a) return <div className="page"><h1>Artiste introuvable</h1></div>;
  const [albums = [], playlists = [], proches = []] = suite.donnees ?? [];
  const contexte = contexteDe("artiste", id, a?.nom ?? "", a?.image, "Artiste");
  const joue = lecteur.joueContexte("artiste", id);
  const suit = b.suit(id);

  return (
    <div className="page collection">
      <EnTete type="Artiste" nom={a?.nom ?? ""} couleur={teinte(id)} image={a?.image} rond
        banniere={a?.banniere || undefined} enLecture={joue} onJouer={() => lecteur.jouerContexte(titres, contexte)}
        meta={a && <><BadgeCheck size={20} className="badge-verifie" />{nombre(a.abonnes ?? 0)} fans</>} />
      <BarreActions>
        <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(titres, contexte)} />
        <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(titres, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
        {a && <button className={"bouton-contour" + (suit ? " actif" : "")} onClick={() => b.basculerArtiste(a)}>{suit ? "Abonné(e)" : "S'abonner"}</button>}
        {a && <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, titres, { artiste: a })}><MoreHorizontal size={28} /></button>}
      </BarreActions>
      <section className="populaires">
        <h2>Populaires</h2>
        {chargement && !donnees ? <LignesFantomes n={5} /> : (
          <>
            <ListeTitres titres={titres.slice(0, plus ? 10 : 5)} contexte={contexte} colonne="album" entete={false} />
            {titres.length > 5 && <button className="lien gras voir-plus" onClick={() => setPlus(!plus)}>{plus ? "Voir moins" : "Voir plus"}</button>}
          </>
        )}
      </section>
      {albums.length > 0 && (
        <Etagere titre="Discographie">
          {albums.map((p) => <Carte key={p.id} lien={`/playlist/${p.id}`} titre={p.nom} sous={[p.annee, p.nbTitres === 1 ? "Single" : "Album"].filter(Boolean).join(" • ")} image={p.image}
            enLecture={lecteur.joueContexte("playlist", p.id)} onJouer={() => jouerCollection({ type: "playlist", id: p.id, nom: p.nom })} />)}
        </Etagere>
      )}
      {playlists.length > 0 && (
        <Etagere titre={`Avec ${a?.nom ?? ""}`}>
          {playlists.map((p) => <Carte key={p.id} lien={`/playlist/${p.id}`} titre={p.nom} sous="Playlist" image={p.image}
            enLecture={lecteur.joueContexte("playlist", p.id)} onJouer={() => jouerCollection({ type: "playlist", id: p.id, nom: p.nom })} />)}
        </Etagere>
      )}
      {titres.length > 10 && (
        <section className="tous-titres">
          <h2>Tous les titres</h2>
          <ListeTitres titres={titres.slice(10)} contexte={{ ...contexte, id: id + "-tous" }} colonne="album" entete={false} />
        </section>
      )}
      {proches.length > 0 && (
        <Etagere titre="Les fans aiment aussi">
          {proches.map((x) => <Carte key={x.id} lien={`/artiste/${x.id}`} titre={x.nom} sous="Artiste" image={x.image} rond
            enLecture={lecteur.joueContexte("artiste", x.id)} onJouer={() => jouerCollection({ type: "artiste", id: x.id, nom: x.nom })} />)}
        </Etagere>
      )}
    </div>
  );
}
