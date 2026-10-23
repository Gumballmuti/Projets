import { CircleUser, Plus, Users } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { appel } from "./api";
import Compte from "./pages/Compte";
import Connexion from "./pages/Connexion";
import Dossier from "./pages/Dossier";
import FichePatient from "./pages/FichePatient";
import Patients from "./pages/Patients";
import SeanceForm from "./pages/SeanceForm";

export interface Moi {
  identifiant: string;
  admin: boolean;
  nom: string;
}

const ContexteMoi = createContext<{ moi: Moi; deconnecter: () => void } | null>(null);
export const useMoi = () => useContext(ContexteMoi)!;

export default function App() {
  const [moi, setMoi] = useState<Moi | null | undefined>(undefined);

  const charger = useCallback(() => {
    appel<Moi>("moi").then(setMoi).catch(() => setMoi(null));
  }, []);

  useEffect(() => {
    charger();
    // une réponse 401 n'importe où (session expirée, mot de passe changé ailleurs) ramène à la connexion
    const perdu = () => setMoi(null);
    window.addEventListener("carosteo:deconnecte", perdu);
    return () => window.removeEventListener("carosteo:deconnecte", perdu);
  }, [charger]);

  const deconnecter = async () => {
    await appel("deconnexion", "POST").catch(() => {});
    setMoi(null);
  };

  if (moi === undefined) return null;
  if (moi === null) return <Connexion connecte={charger} />;

  return (
    <ContexteMoi.Provider value={{ moi, deconnecter }}>
      <BrowserRouter>
        <Cadre admin={moi.admin}>
          <Routes>
            {moi.admin ? (
              <>
                <Route path="/compte" element={<Compte />} />
                <Route path="*" element={<Navigate to="/compte" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Patients />} />
                <Route path="/patients/nouveau" element={<FichePatient />} />
                <Route path="/patients/:id" element={<Dossier />} />
                <Route path="/patients/:id/modifier" element={<FichePatient />} />
                <Route path="/patients/:id/seances/nouvelle" element={<SeanceForm />} />
                <Route path="/patients/:id/seances/:seanceId" element={<SeanceForm />} />
                <Route path="/compte" element={<Compte />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Cadre>
      </BrowserRouter>
    </ContexteMoi.Provider>
  );
}

function Logo() {
  return (
    <NavLink to="/" className="marque-menu">
      <img src="/logo.webp" alt="CE — Caroline Espartero Alonso, ostéopathe" />
      <span className="logo">Car<span>Ostéo</span></span>
    </NavLink>
  );
}

function Cadre({ admin, children }: { admin: boolean; children: ReactNode }) {
  const { moi } = useMoi();
  const enLigne = useEnLigne();
  const liens = admin
    ? [{ to: "/compte", label: "Comptes", icone: <Users size={20} /> }]
    : [
        { to: "/", label: "Patients", icone: <Users size={20} />, fin: true },
        { to: "/patients/nouveau", label: "Nouveau patient", icone: <Plus size={20} /> },
        { to: "/compte", label: "Mon compte", icone: <CircleUser size={20} /> },
      ];
  return (
    <>
      {!enLigne && <div className="hors-ligne">Pas de connexion internet : les modifications ne peuvent pas être enregistrées.</div>}
      <div className="app">
        <nav className="menu">
          <Logo />
          {liens.map((l) => (
            <NavLink key={l.to} to={l.to} end={"fin" in l} className="lien">{l.icone}{l.label}</NavLink>
          ))}
          <div className="bas">{moi.nom || moi.identifiant}</div>
        </nav>
        <header className="barre-mobile">
          <Logo />
          <NavLink to="/compte" className="icone-bouton" aria-label="Mon compte"><CircleUser size={24} /></NavLink>
        </header>
        <main className="contenu">{children}</main>
        {!admin && (
          <nav className="onglets-mobile">
            {liens.map((l) => (
              <NavLink key={l.to} to={l.to} end={"fin" in l}>{l.icone}{l.label === "Nouveau patient" ? "Nouveau" : l.label}</NavLink>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}

function useEnLigne() {
  const [enLigne, setEnLigne] = useState(navigator.onLine);
  useEffect(() => {
    const maj = () => setEnLigne(navigator.onLine);
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);
  return enLigne;
}
