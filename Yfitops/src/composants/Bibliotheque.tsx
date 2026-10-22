import { ArrowUpDown, Heart, Library, Plus, Search, Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useSession } from "../etat/Session";
import { lire, ecrire } from "../outils";
import { useMenuCollection, useMenuMaPlaylist } from "./Menus";
import Pochette from "./Pochette";

type Filtre = "playlists" | "albums" | "artistes" | null;
type Tri = "recents" | "ajout" | "alpha";
const TRIS: Record<Tri, string> = { recents: "Récents", ajout: "Ajoutés récemment", alpha: "Ordre alphabétique" };

interface Element {
  cle: string;
  type: "aimes" | "maPlaylist" | "playlist" | "artiste";
  id: string;
  nom: string;
  sous: string;
  lien: string;
  image?: string;
  mosaique?: string[];
  rond?: boolean;
  date: string; // dernière écoute, sinon ajout
  ajout: string;
}

export const DEGRADE_AIMES = "linear-gradient(135deg, #450af5, #c4efd9)";

/** Ma bibliothèque : titres likés, mes playlists, playlists et albums enregistrés, artistes suivis. */
export default function Bibliotheque({ mobile = false }: { mobile?: boolean }) {
  const b = useBiblio();
  const lecteur = useLecteur();
  const { moi } = useSession();
  const aller = useNavigate();
  const menuPlaylist = useMenuMaPlaylist();
  const menuCollection = useMenuCollection();
  const [filtre, setFiltre] = useState<Filtre>(null);
  const [tri, setTri] = useState<Tri>(() => lire("musique.tri", "recents"));
  const [recherche, setRecherche] = useState<string | null>(null);

  const elements = useMemo(() => {
    const recent = (type: string, id: string) => b.recents.find((r) => r.type === type && r.id === id)?.le ?? "";
    const l: Element[] = [];
    if (filtre === null || filtre === "playlists") {
      l.push({ cle: "aimes", type: "aimes", id: "aimes", nom: "Titres likés", sous: `Playlist • ${b.aimes.length} titre${b.aimes.length > 1 ? "s" : ""}`,
        lien: "/collection/titres", date: "9999", ajout: "9999" });
      for (const p of b.playlists) {
        l.push({ cle: "m" + p.id, type: "maPlaylist", id: p.id, nom: p.nom, sous: `Playlist • ${moi.identifiant}`, lien: `/ma-playlist/${p.id}`,
          mosaique: [...new Set(p.titres.map((t) => t.image))].slice(0, 4), date: recent("maPlaylist", p.id) || p.cree_le, ajout: p.cree_le });
      }
    }
    for (const p of b.enregistrees) {
      if (filtre === null || (filtre === "albums") === p.album) {
        l.push({ cle: "p" + p.id, type: "playlist", id: p.id, nom: p.nom, sous: `${p.album ? "Album" : "Playlist"} • ${p.auteur}`,
          lien: `/playlist/${p.id}`, image: p.image, date: recent("playlist", p.id) || p.ajoute_le || "", ajout: p.ajoute_le || "" });
      }
    }
    if (filtre === null || filtre === "artistes") {
      for (const a of b.artistes) {
        l.push({ cle: "a" + a.id, type: "artiste", id: a.id, nom: a.nom, sous: "Artiste", lien: `/artiste/${a.id}`, image: a.image, rond: true,
          date: recent("artiste", a.id) || a.ajoute_le || "", ajout: a.ajoute_le || "" });
      }
    }
    const q = recherche?.trim().toLowerCase();
    const filtres = q ? l.filter((e) => e.nom.toLowerCase().includes(q) || e.sous.toLowerCase().includes(q)) : l;
    const epingle = filtres.filter((e) => e.type === "aimes");
    const reste = filtres.filter((e) => e.type !== "aimes");
    reste.sort((x, y) => tri === "alpha" ? x.nom.localeCompare(y.nom, "fr") : tri === "ajout" ? y.ajout.localeCompare(x.ajout) : y.date.localeCompare(x.date));
    return [...epingle, ...reste];
  }, [b, filtre, tri, recherche, moi.identifiant]);

  const changerTri = () => {
    const ordre: Tri[] = ["recents", "ajout", "alpha"];
    const n = ordre[(ordre.indexOf(tri) + 1) % ordre.length];
    setTri(n);
    ecrire("musique.tri", n);
  };

  const creer = async () => {
    const p = await b.creerPlaylist();
    if (p) aller(`/ma-playlist/${p.id}`);
  };

  const menu = (e: React.MouseEvent, el: Element) => {
    e.preventDefault();
    if (el.type === "maPlaylist") { const p = b.maPlaylist(el.id); if (p) menuPlaylist(e, p); }
    if (el.type === "playlist") { const p = b.enregistrees.find((x) => x.id === el.id); if (p) menuCollection(e, [], { playlist: p }); }
    if (el.type === "artiste") { const a = b.artistes.find((x) => x.id === el.id); if (a) menuCollection(e, [], { artiste: a }); }
  };

  return (
    <div className={"bibliotheque" + (mobile ? " bibliotheque-mobile" : "")}>
      <header className="bibliotheque-entete">
        <h2><Library size={24} /> {mobile ? "Ma bibliothèque" : "Bibliothèque"}</h2>
        <button className="icone rond" title="Créer une playlist" aria-label="Créer une playlist" onClick={creer}><Plus size={20} /></button>
      </header>
      <div className="puces">
        {filtre && <button className="puce" aria-label="Retirer le filtre" onClick={() => setFiltre(null)}><X size={16} /></button>}
        {(["playlists", "albums", "artistes"] as const).filter((f) => !filtre || f === filtre).map((f) => (
          <button key={f} className={"puce" + (filtre === f ? " active" : "")} onClick={() => setFiltre(filtre === f ? null : f)}>
            {f === "playlists" ? "Playlists" : f === "albums" ? "Albums" : "Artistes"}
          </button>
        ))}
      </div>
      <div className="bibliotheque-outils">
        {recherche === null ? (
          <button className="icone" aria-label="Rechercher dans la bibliothèque" onClick={() => setRecherche("")}><Search size={18} /></button>
        ) : (
          <label className="bibliotheque-recherche">
            <Search size={16} />
            <input autoFocus placeholder="Rechercher dans Bibliothèque" value={recherche}
              onChange={(e) => setRecherche(e.target.value)} onBlur={() => !recherche && setRecherche(null)} />
          </label>
        )}
        <button className="tri" onClick={changerTri}>{TRIS[tri]} <ArrowUpDown size={14} /></button>
      </div>
      <ul className="bibliotheque-liste">
        {elements.map((el) => {
          const actif = lecteur.contexte?.type === el.type && lecteur.contexte.id === el.id;
          return (
            <li key={el.cle}>
              <NavLink to={el.lien} className="bibliotheque-element" onContextMenu={(e) => menu(e, el)}>
                {el.type === "aimes"
                  ? <Pochette fond={DEGRADE_AIMES} icone={<Heart size={20} fill="#fff" color="#fff" />} taille={48} />
                  : <Pochette src={el.image} mosaique={el.mosaique} rond={el.rond} taille={48} />}
                <span className="textes">
                  <span className={"nom" + (actif ? " vert" : "")}>{el.nom}</span>
                  <span className="sous">{el.sous}</span>
                </span>
                {actif && lecteur.enLecture && <Volume2 size={16} className="vert" />}
              </NavLink>
            </li>
          );
        })}
        {!elements.length && recherche && <li className="doux bibliotheque-vide">Aucun résultat pour « {recherche} »</li>}
      </ul>
      {b.pret && !b.playlists.length && !filtre && !recherche && (
        <div className="encart">
          <b>Crée ta première playlist</b>
          <p>C'est simple, on va t'aider.</p>
          <button className="bouton-blanc" onClick={creer}>Créer une playlist</button>
        </div>
      )}
    </div>
  );
}
