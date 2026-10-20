import { Shuffle } from "lucide-react";
import { useParams } from "react-router-dom";
import * as audius from "../audius";
import BoutonLecture from "../composants/BoutonLecture";
import EnTete, { BarreActions } from "../composants/EnTete";
import { Erreur, LignesFantomes } from "../composants/Etats";
import ListeTitres from "../composants/ListeTitres";
import { useLecteur } from "../etat/Lecteur";
import { useCharger } from "../useCharger";
import { contexteDe } from "./communs";

export default function Genre() {
  const { nom = "" } = useParams();
  const { donnees: titres, erreur, chargement, recharger } = useCharger(() => audius.tendances(nom), [nom]);
  const lecteur = useLecteur();
  const libelle = audius.libelleGenre(nom);
  const couleur = audius.GENRES.find((g) => g.nom === nom)?.couleur ?? "#535353";
  const contexte = contexteDe("genre", nom, libelle, "", "Genre");
  const joue = lecteur.joueContexte("genre", nom);
  const liste = titres ?? [];
  return (
    <div className="page collection">
      <EnTete type="Genre" nom={libelle} couleur={couleur} fondPochette={couleur} icone={<span className="pochette-texte">{libelle}</span>}
        description="Les titres les plus écoutés cette semaine." enLecture={joue} onJouer={() => lecteur.jouerContexte(liste, contexte)} />
      <BarreActions>
        <BoutonLecture enLecture={joue} onClick={() => lecteur.jouerContexte(liste, contexte)} />
        <button className="icone" title="Lecture aléatoire" aria-label="Lecture aléatoire" onClick={() => lecteur.jouerContexte(liste, contexte, { aleatoire: true })}><Shuffle size={28} /></button>
      </BarreActions>
      {erreur ? <Erreur onReessayer={recharger} /> : chargement && !titres ? <LignesFantomes /> : <ListeTitres titres={liste} contexte={contexte} colonne="ecoutes" />}
    </div>
  );
}
