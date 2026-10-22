import { Link } from "react-router-dom";
import BoutonLecture from "./BoutonLecture";
import Pochette from "./Pochette";
import type { ReactNode } from "react";

interface Props {
  lien: string;
  titre: string;
  sous?: string;
  image?: string;
  mosaique?: string[];
  rond?: boolean;
  icone?: ReactNode;
  fond?: string;
  enLecture?: boolean;
  onJouer?: () => void;
  onMenu?: (e: React.MouseEvent) => void;
}

/** La carte d'une étagère : pochette, bouton lecture qui apparaît au survol, titre et sous-titre. */
export default function Carte({ lien, titre, sous, image, mosaique, rond, icone, fond, enLecture, onJouer, onMenu }: Props) {
  return (
    <Link to={lien} className="carte" onContextMenu={onMenu ? (e) => { e.preventDefault(); onMenu(e); } : undefined}>
      <div className="carte-image">
        <Pochette src={image} mosaique={mosaique} rond={rond} icone={icone} fond={fond} />
        {onJouer && <BoutonLecture enLecture={!!enLecture} onClick={onJouer} taille={48} className={enLecture ? "visible" : ""} />}
      </div>
      <div className="carte-titre">{titre}</div>
      {sous && <div className="carte-sous">{sous}</div>}
    </Link>
  );
}
