import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { age, fmtDate, SPECIALTIES, specialtyLabel, type Resume } from "../../commun/modele";
import { appel } from "../api";
import { Message } from "../composants/Champs";

const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Initiales({ prenom, nom }: { prenom: string; nom: string }) {
  return <div className="initiales" aria-hidden>{(prenom[0] ?? "") + (nom[0] ?? "")}</div>;
}

export function Badges({ specialites, archive }: { specialites: string[]; archive?: boolean }) {
  return (
    <>
      {specialites.map((s) => <span key={s} className={"badge " + s}>{specialtyLabel(s)}</span>)}
      {archive && <span className="badge archive">Archivé</span>}
    </>
  );
}

export default function Patients() {
  const [patients, setPatients] = useState<Resume[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [texte, setTexte] = useState("");
  const [filtre, setFiltre] = useState<string>("tous");

  useEffect(() => {
    appel<Resume[]>("patients").then(setPatients).catch((e) => setErreur(e.message));
  }, []);

  const visibles = useMemo(() => {
    const q = sansAccents(texte.trim());
    return (patients ?? []).filter((p) => {
      if (filtre === "archives" ? !p.archived : p.archived) return false;
      if (filtre !== "tous" && filtre !== "archives" && !p.specialties.includes(filtre as never)) return false;
      if (!q) return true;
      return sansAccents(`${p.last_name} ${p.first_name} ${p.first_name} ${p.last_name} ${p.phone ?? ""} ${p.main_complaint ?? ""}`).includes(q);
    });
  }, [patients, texte, filtre]);

  const filtres = [{ value: "tous", label: "Tous" }, ...SPECIALTIES.map((s) => ({ value: s.value, label: s.short })), { value: "archives", label: "Archivés" }];

  return (
    <>
      <div className="entete">
        <div>
          <h1>Patients</h1>
          {patients && <p>{patients.filter((p) => !p.archived).length} dossiers actifs</p>}
        </div>
        <Link to="/patients/nouveau" className="bouton sable"><Plus size={18} />Nouveau patient</Link>
      </div>

      <div className="pile">
        <div className="recherche">
          <Search size={18} />
          <input type="search" placeholder="Rechercher un nom, un téléphone, un motif…" value={texte}
            onChange={(e) => setTexte(e.target.value)} aria-label="Rechercher un patient" />
        </div>
        <div className="puces">
          {filtres.map((f) => (
            <button key={f.value} type="button" className="puce" aria-pressed={filtre === f.value} onClick={() => setFiltre(f.value)}>{f.label}</button>
          ))}
        </div>
      </div>

      <Message erreur={erreur} />

      <div className="liste">
        {patients && visibles.map((p) => (
          <Link key={p.id} to={`/patients/${p.id}`} className="patient">
            <Initiales prenom={p.first_name} nom={p.last_name} />
            <div>
              <div className="nom">{p.last_name.toUpperCase()} {p.first_name}</div>
              <div className="infos">
                {[age(p.birth_date), p.main_complaint].filter(Boolean).join(" · ")}
              </div>
              <div style={{ marginTop: 4 }}><Badges specialites={p.specialties} archive={p.archived} /></div>
            </div>
            <div className="droite">
              {p.derniere_seance ? <>Dernière séance<br /><b>{fmtDate(p.derniere_seance)}</b></> : "Aucune séance"}
              <br />{p.nb_seances} séance{p.nb_seances > 1 ? "s" : ""}
            </div>
          </Link>
        ))}
        {patients && !visibles.length && (
          <div className="vide">
            {patients.length ? "Aucun patient ne correspond." : "Aucun dossier pour l'instant. Commence par créer un patient."}
          </div>
        )}
      </div>
    </>
  );
}
