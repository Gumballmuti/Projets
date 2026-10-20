import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import * as audius from "../audius";
import BoutonLecture from "../composants/BoutonLecture";
import Carte from "../composants/Carte";
import { DEGRADE_AIMES } from "../composants/Bibliotheque";
import Etagere from "../composants/Etagere";
import { CartesFantomes, Erreur } from "../composants/Etats";
import Pochette from "../composants/Pochette";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useSession } from "../etat/Session";
import { salutation } from "../outils";
import type { Contexte, PlaylistDistante, Recent, Titre } from "../types";
import { useCharger } from "../useCharger";
import { useJouerCollection } from "./communs";

export const lienRecent = (r: Pick<Recent, "type" | "id">) =>
  r.type === "maPlaylist" ? `/ma-playlist/${r.id}` : r.type === "playlist" ? `/playlist/${r.id}`
    : r.type === "artiste" ? `/artiste/${r.id}` : r.type === "genre" ? `/genre/${encodeURIComponent(r.id)}` : "/collection/titres";

/** Les rubriques de l'accueil, aussi affichées en entier avec « Tout afficher » (/section/:cle). */
export const SECTIONS: Record<string, { titre: string; charger: () => Promise<Titre[] | PlaylistDistante[]> }> = {
  tendances: { titre: "Tendances de la semaine", charger: () => audius.tendances() },
  playlists: { titre: "Playlists du moment", charger: () => audius.playlistsTendance() },
  pepites: { titre: "Pépites à découvrir", charger: () => audius.pepites() },
  mois: { titre: "Les plus écoutés du mois", charger: () => audius.tendances(undefined, "month") },
  "hip-hop": { titre: "Hip-hop / Rap", charger: () => audius.tendances("Hip-Hop/Rap") },
  electro: { titre: "Électro", charger: () => audius.tendances("Electronic") },
  lofi: { titre: "Lo-fi pour se concentrer", charger: () => audius.tendances("Lo-Fi") },
};

export default function Accueil() {
  const b = useBiblio();
  const { moi } = useSession();
  const lecteur = useLecteur();
  const jouerCollection = useJouerCollection();

  // Accès rapide : titres likés, puis ce qui a été écouté récemment, puis mes playlists
  const rapides: { cle: string; nom: string; lien: string; image?: string; mosaique?: string[]; aimes?: boolean; rond?: boolean; recent: Pick<Recent, "type" | "id" | "nom"> }[] = [];
  if (b.aimes.length) rapides.push({ cle: "aimes", nom: "Titres likés", lien: "/collection/titres", aimes: true, recent: { type: "aimes", id: "aimes", nom: "Titres likés" } });
  for (const r of b.recents) {
    if (r.type === "aimes" || r.type === "genre") continue;
    const p = r.type === "maPlaylist" ? b.maPlaylist(r.id) : null;
    if (r.type === "maPlaylist" && !p) continue;
    rapides.push({ cle: r.type + r.id, nom: p?.nom ?? r.nom, lien: lienRecent(r), image: p ? undefined : r.image,
      mosaique: p ? [...new Set(p.titres.map((t) => t.image))] : undefined, rond: r.type === "artiste", recent: r });
  }
  for (const p of b.playlists) {
    if (!rapides.some((x) => x.cle === "maPlaylist" + p.id)) {
      rapides.push({ cle: "maPlaylist" + p.id, nom: p.nom, lien: `/ma-playlist/${p.id}`, mosaique: [...new Set(p.titres.map((t) => t.image))],
        recent: { type: "maPlaylist", id: p.id, nom: p.nom } });
    }
  }

  return (
    <div className="page accueil">
      <div className="accueil-fond" />
      <header className="accueil-entete">
        <Link to="/compte" className="avatar mobile-seulement" aria-label="Mon compte">{moi.identifiant[0]?.toUpperCase()}</Link>
        <h1>{salutation()}</h1>
      </header>
      {rapides.length > 0 && (
        <div className="acces-rapide">
          {rapides.slice(0, 8).map((r) => (
            <Link key={r.cle} to={r.lien} className="rapide">
              {r.aimes ? <Pochette fond={DEGRADE_AIMES} icone={<Heart size={22} fill="#fff" color="#fff" />} />
                : <Pochette src={r.image} mosaique={r.mosaique} rond={r.rond} />}
              <span className="nom">{r.nom}</span>
              <BoutonLecture taille={36} enLecture={lecteur.joueContexte(r.recent.type, r.recent.id)}
                onClick={() => jouerCollection(r.recent)} className={lecteur.joueContexte(r.recent.type, r.recent.id) ? "visible" : ""} />
            </Link>
          ))}
        </div>
      )}

      {b.recents.length > 0 && (
        <Etagere titre="Écoutés récemment">
          {b.recents.slice(0, 12).map((r) => {
            const p = r.type === "maPlaylist" ? b.maPlaylist(r.id) : null;
            return (
              <Carte key={r.type + r.id} lien={lienRecent(r)} titre={p?.nom ?? r.nom} sous={r.sous_titre} rond={r.type === "artiste"}
                image={r.type === "aimes" ? undefined : p ? undefined : r.image} mosaique={p ? [...new Set(p.titres.map((t) => t.image))] : undefined}
                fond={r.type === "aimes" ? DEGRADE_AIMES : undefined} icone={r.type === "aimes" ? <Heart size={40} fill="#fff" color="#fff" /> : undefined}
                enLecture={lecteur.joueContexte(r.type, r.id)} onJouer={() => jouerCollection(r)} />
            );
          })}
        </Etagere>
      )}

      <EtagereSection cle="tendances" />
      <EtagereSection cle="playlists" />
      {b.artistes.length > 0 && (
        <Etagere titre="Tes artistes">
          {b.artistes.slice(0, 12).map((a) => (
            <Carte key={a.id} lien={`/artiste/${a.id}`} titre={a.nom} sous="Artiste" image={a.image} rond
              enLecture={lecteur.joueContexte("artiste", a.id)} onJouer={() => jouerCollection({ type: "artiste", id: a.id, nom: a.nom })} />
          ))}
        </Etagere>
      )}
      <EtagereSection cle="pepites" />
      <EtagereSection cle="hip-hop" />
      <EtagereSection cle="electro" />
      <EtagereSection cle="lofi" />
      <EtagereSection cle="mois" />
    </div>
  );
}

function EtagereSection({ cle }: { cle: string }) {
  const s = SECTIONS[cle];
  const { donnees, erreur, chargement, recharger } = useCharger(s.charger, [cle]);
  const lecteur = useLecteur();
  if (erreur) return cle === "tendances" ? <Erreur onReessayer={recharger} /> : null;
  return (
    <Etagere titre={s.titre} lien={`/section/${cle}`}>
      {chargement && !donnees ? <CartesFantomes /> : <CartesSection cle={cle} elements={donnees ?? []} max={12} lecteur={lecteur} />}
    </Etagere>
  );
}

export function CartesSection({ cle, elements, max, lecteur }: { cle: string; elements: (Titre | PlaylistDistante)[]; max?: number; lecteur: ReturnType<typeof useLecteur> }) {
  const jouerCollection = useJouerCollection();
  const titres = elements.filter((e): e is Titre => "duree" in e);
  const contexte: Contexte = { type: "titres", id: "section-" + cle, nom: SECTIONS[cle]?.titre ?? "", lien: `/section/${cle}` };
  return (
    <>
      {elements.slice(0, max).map((e) => "duree" in e ? (
        <Carte key={e.id} lien={`/artiste/${e.artisteId}`} titre={e.titre} sous={e.artiste} image={e.image}
          enLecture={lecteur.enLecture && lecteur.enCours?.id === e.id}
          onJouer={() => lecteur.enCours?.id === e.id ? lecteur.basculerLecture() : lecteur.jouer(titres, titres.indexOf(e), contexte, { aleatoire: false })} />
      ) : (
        <Carte key={e.id} lien={`/playlist/${e.id}`} titre={e.nom} sous={`${e.album ? "Album" : "Playlist"} • ${e.auteur}`} image={e.image}
          enLecture={lecteur.joueContexte("playlist", e.id)} onJouer={() => jouerCollection({ type: "playlist", id: e.id, nom: e.nom })} />
      ))}
    </>
  );
}
