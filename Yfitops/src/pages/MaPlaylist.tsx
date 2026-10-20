import { MoreHorizontal, Music, Pencil, Search, Shuffle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as catalogue from "../catalogue";
import BoutonLecture from "../composants/BoutonLecture";
import EnTete, { BarreActions } from "../composants/EnTete";
import ListeTitres from "../composants/ListeTitres";
import { useMenuMaPlaylist } from "../composants/Menus";
import Pochette from "../composants/Pochette";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useSession } from "../etat/Session";
import { dureeTotale, teinte } from "../outils";
import type { Contexte, MaPlaylist as TMaPlaylist, Titre } from "../types";
import { useCharger } from "../useCharger";
import { contexteDe } from "./communs";

export default function MaPlaylist() {
  const { id = "" } = useParams();
  const b = useBiblio();
  const lecteur = useLecteur();
  const { moi } = useSession();
  const [edition, setEdition] = useState(false);
  const menu = useMenuMaPlaylist(() => setEdition(true));
  const p = b.maPlaylist(id);
  if (!p) return <div className="page">{b.pret && <h1>Playlist introuvable</h1>}</div>;

  const images = [...new Set(p.titres.map((t) => t.image).filter(Boolean))];
  const contexte = contexteDe("maPlaylist", p.id, p.nom, images[0] ?? "", `Playlist • ${moi.identifiant}`);
  const joue = lecteur.joueContexte("maPlaylist", p.id);
  return (
    <div className="page collection">
      <EnTete type="Playlist" nom={p.nom} couleur={teinte(p.id)} mosaique={images} icone={<Music size={64} />}
        description={p.description || undefined} onClickNom={() => setEdition(true)}
        enLecture={joue} onJouer={() => lecteur.jouerContexte(p.titres, contexte)}
        meta={<><b>{moi.identifiant}</b>{p.titres.length > 0 && <> • {p.titres.length} titre{p.titres.length > 1 ? "s" : ""}, <span className="doux">{dureeTotale(p.titres)}</span></>}</>} />
      <BarreActions>
        {p.titres.length > 0 && <>
          <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(p.titres, contexte)} />
          <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(p.titres, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
        </>}
        <button className="icone" title="Modifier les infos" aria-label="Modifier les infos" onClick={() => setEdition(true)}><Pencil size={22} /></button>
        <button className="icone" aria-label="Plus d'options" onClick={(e) => menu(e.currentTarget, p)}><MoreHorizontal size={28} /></button>
      </BarreActions>
      {p.titres.length > 0 && (
        <ListeTitres titres={p.titres} contexte={contexte} colonne="ajout" playlist={p} onReordonner={(t) => b.reordonner(p.id, t)} />
      )}
      <AjouterTitres playlist={p} contexte={contexte} />
      {edition && <ModaleEdition playlist={p} fermer={() => setEdition(false)} />}
    </div>
  );
}

/** « Trouvons quelque chose pour ta playlist » + titres recommandés, avec un bouton Ajouter. */
function AjouterTitres({ playlist, contexte }: { playlist: TMaPlaylist; contexte: Contexte }) {
  const b = useBiblio();
  const [ouvert, setOuvert] = useState(playlist.titres.length === 0);
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<Titre[]>([]);
  useEffect(() => {
    if (!q.trim()) return setResultats([]);
    const m = setTimeout(() => catalogue.rechercher(q.trim()).then((r) => setResultats(r.titres.slice(0, 10))).catch(() => {}), 300);
    return () => clearTimeout(m);
  }, [q]);

  // Recommandations : la « radio » de l'artiste le plus présent dans la playlist (sinon les tubes du moment)
  const artiste = useMemo(() => {
    const n = new Map<string, number>();
    for (const t of playlist.titres) if (t.artisteId) n.set(t.artisteId, (n.get(t.artisteId) ?? 0) + 1);
    return [...n].sort((a, c) => c[1] - a[1])[0]?.[0];
  }, [playlist.titres]);
  const { donnees: reco } = useCharger(() => (artiste ? catalogue.radioArtiste(artiste) : catalogue.tops()), [artiste]);
  const dansPlaylist = new Set(playlist.titres.map((t) => t.id));
  const recommandes = (reco ?? []).filter((t) => !dansPlaylist.has(t.id)).slice(0, 10);
  const ajouter = (t: Titre) => b.ajouterAPlaylist(playlist.id, [t]);

  return (
    <>
      {ouvert ? (
        <section className="ajouter-titres">
          <div className="ajouter-entete">
            <h2>Trouvons quelque chose pour ta playlist</h2>
            {playlist.titres.length > 0 && <button className="icone" aria-label="Fermer" onClick={() => setOuvert(false)}><X size={24} /></button>}
          </div>
          <label className="filtre-liste grand"><Search size={18} />
            <input placeholder="Rechercher des titres" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {resultats.length > 0 && (
            <ListeTitres titres={resultats.filter((t) => !dansPlaylist.has(t.id))} contexte={{ ...contexte, id: "ajout-" + playlist.id, type: "recherche" }}
              colonne={null} entete={false} onAjouter={ajouter} />
          )}
        </section>
      ) : (
        <div className="trouver-plus"><button className="lien gras" onClick={() => setOuvert(true)}>Trouver plus</button></div>
      )}
      {recommandes.length > 0 && (
        <section className="recommandes">
          <h2>Recommandés</h2>
          <p className="doux">D'après ce qui se trouve dans cette playlist</p>
          <ListeTitres titres={recommandes} contexte={{ ...contexte, id: "reco-" + playlist.id, type: "recherche" }}
            colonne={null} entete={false} onAjouter={ajouter} />
        </section>
      )}
    </>
  );
}

function ModaleEdition({ playlist, fermer }: { playlist: TMaPlaylist; fermer: () => void }) {
  const b = useBiblio();
  const [nom, setNom] = useState(playlist.nom);
  const [description, setDescription] = useState(playlist.description);
  const images = [...new Set(playlist.titres.map((t) => t.image).filter(Boolean))];
  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    b.modifierPlaylist(playlist.id, { nom: nom.trim(), description: description.trim() });
    fermer();
  };
  return (
    <div className="modale-fond" onClick={fermer}>
      <form className="modale" onClick={(e) => e.stopPropagation()} onSubmit={enregistrer} role="dialog" aria-label="Modifier les infos">
        <header><h2>Modifier les infos</h2><button type="button" className="icone" aria-label="Fermer" onClick={fermer}><X size={20} /></button></header>
        <div className="modale-corps">
          <Pochette mosaique={images} icone={<Music size={48} />} className="modale-pochette" />
          <div className="modale-champs">
            <input aria-label="Nom" placeholder="Ajoute un nom" value={nom} maxLength={100} onChange={(e) => setNom(e.target.value)} autoFocus />
            <textarea aria-label="Description" placeholder="Ajoute une description (facultatif)" value={description} maxLength={300}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <footer><button className="bouton-blanc" disabled={!nom.trim()}>Enregistrer</button></footer>
      </form>
    </div>
  );
}
