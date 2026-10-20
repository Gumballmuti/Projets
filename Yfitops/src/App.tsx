import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BarreHaut from "./composants/BarreHaut";
import BarreLecteur from "./composants/BarreLecteur";
import Bibliotheque from "./composants/Bibliotheque";
import { LecteurPleinEcran, MiniLecteur, NavMobile } from "./composants/Mobile";
import PanneauDroit from "./composants/PanneauDroit";
import { FournisseurBibliotheque } from "./etat/Bibliotheque";
import { FournisseurInterface, useInterface } from "./etat/Interface";
import { FournisseurLecteur, useLecteur } from "./etat/Lecteur";
import { FournisseurMenu } from "./etat/Menu";
import { FournisseurSession } from "./etat/Session";
import { FournisseurToasts } from "./etat/Toasts";
import Accueil from "./pages/Accueil";
import Artiste from "./pages/Artiste";
import BibliothequeMobile from "./pages/BibliothequeMobile";
import Compte from "./pages/Compte";
import Genre from "./pages/Genre";
import MaPlaylist from "./pages/MaPlaylist";
import Playlist from "./pages/Playlist";
import Recherche from "./pages/Recherche";
import Section from "./pages/Section";
import TitresLikes from "./pages/TitresLikes";
import { useMobile } from "./useMobile";

export default function App() {
  return (
    <BrowserRouter>
      <FournisseurToasts>
        <FournisseurSession>
          <FournisseurBibliotheque>
            <FournisseurLecteur>
              <FournisseurMenu>
                <FournisseurInterface>{(vue) => <Coquille vue={vue} />}</FournisseurInterface>
              </FournisseurMenu>
            </FournisseurLecteur>
          </FournisseurBibliotheque>
        </FournisseurSession>
      </FournisseurToasts>
    </BrowserRouter>
  );
}

function Coquille({ vue }: { vue: React.RefObject<HTMLElement | null> }) {
  const ui = useInterface();
  const lecteur = useLecteur();
  const mobile = useMobile();

  // Barre d'espace : lecture / pause (sauf quand on écrit)
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(cible.tagName) || cible.isContentEditable) return;
      e.preventDefault();
      lecteur.basculerLecture();
    };
    addEventListener("keydown", touche);
    return () => removeEventListener("keydown", touche);
  }, [lecteur]);

  return (
    <div className={"app" + (ui.panneau && !mobile ? " avec-panneau" : "") + (lecteur.enCours ? " avec-lecteur" : "")}>
      {!mobile && <BarreHaut />}
      {!mobile && <nav className="barre-laterale" aria-label="Bibliothèque"><Bibliotheque /></nav>}
      <main className="vue" ref={vue}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/recherche" element={<Recherche />} />
          <Route path="/recherche/:q" element={<Recherche />} />
          <Route path="/bibliotheque" element={<BibliothequeMobile />} />
          <Route path="/collection/titres" element={<TitresLikes />} />
          <Route path="/ma-playlist/:id" element={<MaPlaylist />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/artiste/:id" element={<Artiste />} />
          <Route path="/genre/:id" element={<Genre />} />
          <Route path="/section/:cle" element={<Section />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="*" element={<div className="page"><h1>Page introuvable</h1></div>} />
        </Routes>
        <div className="marge-bas" />
      </main>
      {ui.panneau && !mobile && <PanneauDroit />}
      {mobile ? <><MiniLecteur /><NavMobile /><LecteurPleinEcran /></> : <BarreLecteur />}
    </div>
  );
}
