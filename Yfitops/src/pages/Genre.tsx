import { Shuffle } from "lucide-react";
import { useParams } from "react-router-dom";
import * as catalogue from "../catalogue";
import BoutonLecture from "../composants/BoutonLecture";
import Carte from "../composants/Carte";
import EnTete, { BarreActions } from "../composants/EnTete";
import Etagere from "../composants/Etagere";
import { Erreur, LignesFantomes } from "../composants/Etats";
import ListeTitres from "../composants/ListeTitres";
import { useLecteur } from "../etat/Lecteur";
import { useCharger } from "../useCharger";
import { contexteDe, useJouerCollection } from "./communs";

export default function Genre() {
  const { id = "" } = useParams();
  const { donnees, erreur, chargement, recharger } = useCharger(
    () => Promise.all([catalogue.genre(id), catalogue.tops(Number(id))]), [id]);
  const artistes = useCharger(() => catalogue.artistesGenre(id), [id]);
  const lecteur = useLecteur();
  const jouerCollection = useJouerCollection();
  const [g, titres = []] = donnees ?? [];
  const couleur = catalogue.couleurGenre(id);
  const contexte = contexteDe("genre", id, g?.nom ?? "", g?.image, "Genre");
  const joue = lecteur.joueContexte("genre", id);
  return (
    <div className="page collection">
      <EnTete type="Genre" nom={g?.nom ?? ""} couleur={couleur} image={g?.image}
        description="Les titres les plus écoutés en ce moment." enLecture={joue} onJouer={() => lecteur.jouerContexte(titres, contexte)} />
      <BarreActions>
        <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(titres, contexte)} />
        <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(titres, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
      </BarreActions>
      {(artistes.donnees ?? []).length > 0 && (
        <Etagere titre="Artistes">
          {artistes.donnees!.map((a) => <Carte key={a.id} lien={`/artiste/${a.id}`} titre={a.nom} sous="Artiste" image={a.image} rond
            enLecture={lecteur.joueContexte("artiste", a.id)} onJouer={() => jouerCollection({ type: "artiste", id: a.id, nom: a.nom })} />)}
        </Etagere>
      )}
      <h2 className="titre-section">Titres populaires</h2>
      {erreur ? <Erreur onReessayer={recharger} /> : chargement && !donnees ? <LignesFantomes /> : <ListeTitres titres={titres} contexte={contexte} colonne="album" />}
    </div>
  );
}
