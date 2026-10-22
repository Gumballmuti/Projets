import { Music, User } from "lucide-react";
import { useState, type ReactNode } from "react";

interface Props {
  src?: string;
  mosaique?: string[]; // jusqu'à 4 pochettes, pour mes playlists
  taille?: number;
  rond?: boolean;
  icone?: ReactNode;
  fond?: string;
  className?: string;
}

/** Une pochette carrée (ou ronde pour un artiste), avec une icône si l'image manque. */
export default function Pochette({ src, mosaique, taille, rond, icone, fond, className = "" }: Props) {
  const [erreur, setErreur] = useState(false);
  const style = { width: taille, height: taille, background: fond, minWidth: taille };
  const classe = `pochette ${rond ? "ronde" : ""} ${className}`;
  const images = (mosaique ?? []).filter(Boolean);
  if (!src && images.length >= 4) {
    return (
      <div className={classe + " mosaique"} style={style}>
        {images.slice(0, 4).map((m, i) => <img key={i} src={m} alt="" loading="lazy" />)}
      </div>
    );
  }
  const image = src || images[0];
  if (!image || erreur) {
    return (
      <div className={classe + " vide"} style={style}>
        {icone ?? (rond ? <User size={(taille ?? 48) * 0.4} /> : <Music size={(taille ?? 48) * 0.4} />)}
      </div>
    );
  }
  return <img className={classe} style={style} src={image} alt="" loading="lazy" onError={() => setErreur(true)} />;
}
