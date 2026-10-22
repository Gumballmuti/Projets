import { useParams } from "react-router-dom";
import { Grille } from "../composants/Etagere";
import { CartesFantomes, Erreur } from "../composants/Etats";
import { useLecteur } from "../etat/Lecteur";
import { useCharger } from "../useCharger";
import { CartesSection, SECTIONS } from "./Accueil";

/** « Tout afficher » d'une rubrique de l'accueil. */
export default function Section() {
  const { cle = "" } = useParams();
  const s = SECTIONS[cle];
  const { donnees, erreur, chargement, recharger } = useCharger(() => s ? s.charger() : Promise.resolve([]), [cle]);
  const lecteur = useLecteur();
  if (!s) return <div className="page"><h1>Page introuvable</h1></div>;
  return (
    <div className="page">
      <h1 className="titre-page">{s.titre}</h1>
      {erreur ? <Erreur onReessayer={recharger} /> : (
        <Grille>{chargement && !donnees ? <CartesFantomes n={12} /> : <CartesSection cle={cle} elements={donnees ?? []} lecteur={lecteur} />}</Grille>
      )}
    </div>
  );
}
