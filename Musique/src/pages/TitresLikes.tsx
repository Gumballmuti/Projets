import { Heart, Search, Shuffle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DEGRADE_AIMES } from "../composants/Bibliotheque";
import BoutonLecture from "../composants/BoutonLecture";
import EnTete, { BarreActions } from "../composants/EnTete";
import ListeTitres from "../composants/ListeTitres";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useSession } from "../etat/Session";
import { contexteDe } from "./communs";

export default function TitresLikes() {
  const b = useBiblio();
  const lecteur = useLecteur();
  const { moi } = useSession();
  const [filtre, setFiltre] = useState("");
  const q = filtre.trim().toLowerCase();
  const titres = q ? b.aimes.filter((t) => `${t.titre} ${t.artiste}`.toLowerCase().includes(q)) : b.aimes;
  const contexte = contexteDe("aimes", "aimes", "Titres likés", "", "Playlist");
  const joue = lecteur.joueContexte("aimes", "aimes");
  return (
    <div className="page collection">
      <EnTete type="Playlist" nom="Titres likés" couleur="#5038a0" fondPochette={DEGRADE_AIMES} icone={<Heart size={72} fill="#fff" color="#fff" />}
        enLecture={joue} onJouer={() => lecteur.jouerContexte(b.aimes, contexte)}
        meta={<><b>{moi.identifiant}</b> • {b.aimes.length} titre{b.aimes.length > 1 ? "s" : ""}</>} />
      {b.aimes.length ? (
        <>
          <BarreActions>
            <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(b.aimes, contexte)} />
            <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(b.aimes, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
            <label className="filtre-liste"><Search size={16} /><input placeholder="Rechercher dans la playlist" value={filtre} onChange={(e) => setFiltre(e.target.value)} /></label>
          </BarreActions>
          <ListeTitres titres={titres} contexte={contexte} colonne="ajout" />
        </>
      ) : (
        <div className="etat-vide">
          <Heart size={56} />
          <b>Les titres que tu aimes apparaîtront ici</b>
          <p className="doux">Enregistre des titres en touchant l'icône en forme de cœur.</p>
          <Link to="/recherche" className="bouton-blanc">Trouver des titres</Link>
        </div>
      )}
    </div>
  );
}
