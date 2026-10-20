import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/** Une rangée de cartes, avec « Tout afficher ». */
export default function Etagere({ titre, lien, children, sous }: { titre: string; lien?: string; sous?: string; children: ReactNode }) {
  return (
    <section className="etagere">
      <header>
        <div>
          {sous && <span className="etagere-sous">{sous}</span>}
          <h2>{lien ? <Link to={lien}>{titre}</Link> : titre}</h2>
        </div>
        {lien && <Link to={lien} className="tout-afficher">Tout afficher</Link>}
      </header>
      <div className="etagere-cartes">{children}</div>
    </section>
  );
}

export function Grille({ children }: { children: ReactNode }) {
  return <div className="grille-cartes">{children}</div>;
}
