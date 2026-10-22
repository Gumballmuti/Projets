import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as catalogue from "../catalogue";
import BoutonLecture from "../composants/BoutonLecture";
import Carte from "../composants/Carte";
import Etagere, { Grille } from "../composants/Etagere";
import { CartesFantomes, Erreur, LignesFantomes } from "../composants/Etats";
import ListeTitres from "../composants/ListeTitres";
import Pochette from "../composants/Pochette";
import { useLecteur } from "../etat/Lecteur";
import { ecrire, lire } from "../outils";
import type { Artiste, Contexte, PlaylistDistante, Titre } from "../types";
import { useCharger } from "../useCharger";
import { useJouerCollection } from "./communs";

type Onglet = "tout" | "titres" | "artistes" | "playlists" | "albums";
const ONGLETS: [Onglet, string][] = [["tout", "Tout"], ["titres", "Titres"], ["artistes", "Artistes"], ["playlists", "Playlists"], ["albums", "Albums"]];

interface Recente { type: "artiste" | "playlist" | "titre"; id: string; nom: string; sous: string; image: string; lien: string }
const CLE_RECENTES = "musique.recherches";

function retenir(r: Recente) {
  ecrire(CLE_RECENTES, [r, ...lire<Recente[]>(CLE_RECENTES, []).filter((x) => !(x.type === r.type && x.id === r.id))].slice(0, 12));
}

export default function Recherche() {
  const { q = "" } = useParams();
  const aller = useNavigate();
  const [texte, setTexte] = useState(q);
  const minuteur = useRef<number>(undefined);
  useEffect(() => setTexte(q), [q]);

  const chercher = (v: string) => {
    setTexte(v);
    clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => aller(v.trim() ? `/recherche/${encodeURIComponent(v.trim())}` : "/recherche", { replace: true }), 300);
  };

  return (
    <div className="page recherche">
      <div className="recherche-mobile mobile-seulement">
        <h1>Rechercher</h1>
        <label className="champ-recherche clair">
          <Search size={22} />
          <input placeholder="Que souhaitez-vous écouter ?" value={texte} onChange={(e) => chercher(e.target.value)} enterKeyHint="search" />
          {texte && <button className="icone" aria-label="Effacer" onClick={() => chercher("")}><X size={20} /></button>}
        </label>
      </div>
      {q ? <Resultats q={q} /> : <Parcourir />}
    </div>
  );
}

function Parcourir() {
  const [recentes, setRecentes] = useState(() => lire<Recente[]>(CLE_RECENTES, []));
  const { donnees: genres, erreur, recharger } = useCharger(catalogue.genres, []);
  const retirer = (r: Recente) => {
    const l = recentes.filter((x) => x !== r);
    setRecentes(l);
    ecrire(CLE_RECENTES, l);
  };
  return (
    <>
      {recentes.length > 0 && (
        <Etagere titre="Recherches récentes">
          {recentes.map((r) => (
            <div className="carte-avec-croix" key={r.type + r.id}>
              <Carte lien={r.lien} titre={r.nom} sous={r.sous} image={r.image} rond={r.type === "artiste"} />
              <button className="icone croix" aria-label={`Retirer ${r.nom}`} onClick={() => retirer(r)}><X size={16} /></button>
            </div>
          ))}
        </Etagere>
      )}
      <h2 className="titre-section">Parcourir tout</h2>
      {erreur ? <Erreur onReessayer={recharger} /> : (
        <div className="grille-genres">
          {(genres ?? []).map((g) => (
            <Link key={g.id} to={`/genre/${g.id}`} className="carte-genre" style={{ background: catalogue.couleurGenre(g.id) }}>
              <span>{g.nom}</span>
              {g.image && <img src={g.image} alt="" loading="lazy" />}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Resultats({ q }: { q: string }) {
  const [onglet, setOnglet] = useState<Onglet>("tout");
  const { donnees: r, erreur, chargement, recharger } = useCharger(() => catalogue.rechercher(q), [q]);
  const lecteur = useLecteur();
  const jouerCollection = useJouerCollection();
  useEffect(() => setOnglet("tout"), [q]);

  const contexte: Contexte = { type: "recherche", id: "recherche-" + q, nom: `Recherche « ${q} »`, lien: `/recherche/${encodeURIComponent(q)}` };
  const carteArtiste = (a: Artiste) => (
    <div key={a.id} onClickCapture={() => retenir({ type: "artiste", id: a.id, nom: a.nom, sous: "Artiste", image: a.image, lien: `/artiste/${a.id}` })}>
      <Carte lien={`/artiste/${a.id}`} titre={a.nom} sous="Artiste" image={a.image} rond
        enLecture={lecteur.joueContexte("artiste", a.id)} onJouer={() => jouerCollection({ type: "artiste", id: a.id, nom: a.nom })} />
    </div>
  );
  const cartePlaylist = (p: PlaylistDistante) => {
    const sous = p.album ? [p.annee, p.auteur].filter(Boolean).join(" • ") : `Playlist • ${p.auteur}`;
    return (
      <div key={p.id} onClickCapture={() => retenir({ type: "playlist", id: p.id, nom: p.nom, sous, image: p.image, lien: `/playlist/${p.id}` })}>
        <Carte lien={`/playlist/${p.id}`} titre={p.nom} sous={sous} image={p.image}
          enLecture={lecteur.joueContexte("playlist", p.id)} onJouer={() => jouerCollection({ type: "playlist", id: p.id, nom: p.nom })} />
      </div>
    );
  };

  if (erreur) return <Erreur onReessayer={recharger} />;
  const vide = r && !r.titres.length && !r.artistes.length && !r.playlists.length && !r.albums.length;

  return (
    <>
      <div className="puces onglets-recherche">
        {ONGLETS.map(([o, l]) => <button key={o} className={"puce" + (onglet === o ? " active" : "")} onClick={() => setOnglet(o)}>{l}</button>)}
      </div>
      {chargement && !r ? (onglet === "tout" ? <><LignesFantomes n={4} /><Grille><CartesFantomes /></Grille></> : <LignesFantomes />) : vide ? (
        <div className="etat-vide"><b>Aucun résultat trouvé pour « {q} »</b><p className="doux">Vérifie l'orthographe, ou essaie avec moins de mots ou d'autres mots-clés.</p></div>
      ) : r && (
        <>
          {onglet === "tout" && (
            <>
              <div className="meilleur-ensemble">
                <MeilleurResultat r={r} q={q} contexte={contexte} />
                {r.titres.length > 0 && (
                  <section className="meilleurs-titres">
                    <h2>Titres</h2>
                    <ListeTitres titres={r.titres.slice(0, 4)} contexte={contexte} colonne={null} entete={false} />
                  </section>
                )}
              </div>
              {r.artistes.length > 0 && <Etagere titre="Artistes">{r.artistes.slice(0, 10).map(carteArtiste)}</Etagere>}
              {r.playlists.length > 0 && <Etagere titre="Playlists">{r.playlists.slice(0, 10).map(cartePlaylist)}</Etagere>}
              {r.albums.length > 0 && <Etagere titre="Albums">{r.albums.slice(0, 10).map(cartePlaylist)}</Etagere>}
            </>
          )}
          {onglet === "titres" && <ListeTitres titres={r.titres} contexte={contexte} />}
          {onglet === "artistes" && <Grille>{r.artistes.map(carteArtiste)}</Grille>}
          {onglet === "playlists" && <Grille>{r.playlists.map(cartePlaylist)}</Grille>}
          {onglet === "albums" && <Grille>{r.albums.map(cartePlaylist)}</Grille>}
        </>
      )}
    </>
  );
}

function MeilleurResultat({ r, q, contexte }: { r: { titres: Titre[]; artistes: Artiste[]; playlists: PlaylistDistante[] }; q: string; contexte: Contexte }) {
  const lecteur = useLecteur();
  const jouerCollection = useJouerCollection();
  const n = q.toLowerCase();
  // Un artiste qui porte exactement ce nom passe avant le premier titre
  const artiste = r.artistes.find((a) => a.nom.toLowerCase() === n) ?? (r.titres.length ? null : r.artistes[0]);
  const titre = artiste ? null : r.titres[0];
  if (!artiste && !titre) return null;
  const lien = artiste ? `/artiste/${artiste.id}` : titre!.albumId ? `/playlist/a${titre!.albumId}` : `/artiste/${titre!.artisteId}`;
  const enLecture = artiste ? lecteur.joueContexte("artiste", artiste.id) : lecteur.enLecture && lecteur.enCours?.id === titre!.id;
  return (
    <section className="meilleur">
      <h2>Meilleur résultat</h2>
      <Link to={lien} className="meilleur-carte">
        <Pochette src={artiste?.image ?? titre!.image} rond={!!artiste} taille={92} />
        <span className="meilleur-nom">{artiste?.nom ?? titre!.titre}</span>
        <span className="doux">{artiste ? "Artiste" : <>Titre • <b className="blanc">{titre!.artiste}</b></>}</span>
        <BoutonLecture enLecture={enLecture} taille={48} className={enLecture ? "visible" : ""} onClick={() => {
          if (artiste) return jouerCollection({ type: "artiste", id: artiste.id, nom: artiste.nom });
          if (lecteur.enCours?.id === titre!.id) return lecteur.basculerLecture();
          lecteur.jouer(r.titres, 0, contexte, { aleatoire: false });
        }} />
      </Link>
    </section>
  );
}
