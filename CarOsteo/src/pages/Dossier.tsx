import { ArrowLeft, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  age, fmtDate, kindLabel, PROFILE_FIELDS, SESSION_SPECIFICS, specialtyLabel,
  type Consultation, type Dossier as TDossier, type Patient,
} from "../../commun/modele";
import { appel } from "../api";
import { Message, ValeursDecrites } from "../composants/Champs";
import { Badges, Initiales } from "./Patients";

type Onglet = "historique" | "fiche" | "bilans";

export default function Dossier() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const [d, setD] = useState<TDossier | null>(null);
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("historique");
  const [impression, setImpression] = useState(false);

  useEffect(() => {
    appel<TDossier>(`patients/${id}`).then(setD).catch((e) => setErreur(e.message));
  }, [id]);

  useEffect(() => {
    if (!impression) return;
    const fin = () => setImpression(false);
    window.addEventListener("afterprint", fin, { once: true });
    window.print();
    return () => window.removeEventListener("afterprint", fin);
  }, [impression]);

  if (!d) return <Message erreur={erreur} />;
  const { patient: p, seances } = d;

  const supprimerPatient = async () => {
    if (!confirm(`Supprimer définitivement le dossier de ${p.first_name} ${p.last_name} et ses ${seances.length} séance(s) ?`)) return;
    await appel(`patients/${id}`, "DELETE").then(() => naviguer("/", { replace: true })).catch((e) => setErreur(e.message));
  };

  const supprimerSeance = async (s: Consultation) => {
    if (!confirm(`Supprimer la séance du ${fmtDate(s.seance_date)} ?`)) return;
    await appel<TDossier>(`patients/${id}/seances/${s.id}`, "DELETE").then(setD).catch((e) => setErreur(e.message));
  };

  const onglets: { id: Onglet; label: string }[] = [
    { id: "historique", label: `Séances (${seances.length})` },
    { id: "fiche", label: "Fiche & antécédents" },
    { id: "bilans", label: "Bilans" },
  ];
  const montrer = (o: Onglet) => impression || onglet === o;

  return (
    <>
      <Link to="/" className="discret ligne actions" style={{ textDecoration: "none", marginBottom: 12 }}><ArrowLeft size={16} />Patients</Link>
      <div className="entete">
        <div className="fiche-tete">
          <Initiales prenom={p.first_name} nom={p.last_name} />
          <div>
            <h1>{p.last_name.toUpperCase()} {p.first_name}</h1>
            <p>{[age(p.birth_date), p.birth_date && `né(e) le ${fmtDate(p.birth_date)}`, p.phone].filter(Boolean).join(" · ")}</p>
            <div style={{ marginTop: 6 }}><Badges specialites={p.specialties} archive={p.archived} /></div>
          </div>
        </div>
        <div className="ligne actions">
          <Link to={`/patients/${id}/seances/nouvelle`} className="bouton sable"><Plus size={18} />Nouvelle séance</Link>
          <Link to={`/patients/${id}/modifier`} className="bouton leger"><Pencil size={16} />Modifier</Link>
          <button type="button" className="bouton leger" onClick={() => setImpression(true)}><Printer size={16} />Imprimer / PDF</button>
        </div>
      </div>

      {p.contraindications && <div className="alerte"><b>Contre-indications :</b> {p.contraindications}</div>}
      {p.main_complaint && <p><b>Motif principal :</b> {p.main_complaint}</p>}

      <div className="onglets" role="tablist">
        {onglets.map((o) => (
          <button key={o.id} role="tab" aria-selected={onglet === o.id} onClick={() => setOnglet(o.id)}>{o.label}</button>
        ))}
      </div>
      <Message erreur={erreur} />

      {montrer("historique") && (
        <div className="chrono">
          {impression && <h2>Séances</h2>}
          {!seances.length && (
            <div className="vide">
              Aucune séance enregistrée.<br /><br />
              <Link to={`/patients/${id}/seances/nouvelle`} className="bouton sable"><Plus size={18} />Noter la première séance</Link>
            </div>
          )}
          {seances.map((s) => <CarteSeance key={s.id} s={s} patientId={id!} supprimer={() => supprimerSeance(s)} />)}
        </div>
      )}

      {montrer("fiche") && <Fiche p={p} />}

      {montrer("bilans") && (
        <div className="pile" style={{ marginTop: impression ? 16 : 0 }}>
          {(["migraine", "atm", "sport"] as const).map((s) => {
            const b = PROFILE_FIELDS[s];
            const rempli = Object.keys(p[b.field]).length > 0;
            if (!rempli && !p.specialties.includes(s)) return null;
            return (
              <section key={s} className="carte">
                <h2>{b.title}</h2>
                <ValeursDecrites defs={b.defs} valeur={p[b.field]} />
              </section>
            );
          })}
          {!p.specialties.some((s) => s !== "generale") && (
            <p className="discret">Coche « Migraines », « ATM » ou « Suivi sportif » dans la fiche pour remplir un bilan spécifique.</p>
          )}
        </div>
      )}

      {!impression && (
        <div className="actions" style={{ marginTop: 40, textAlign: "right" }}>
          <button type="button" className="bouton danger petit" onClick={supprimerPatient}><Trash2 size={16} />Supprimer le dossier</button>
        </div>
      )}
    </>
  );
}

function Bloc({ titre, texte }: { titre: string; texte: string | null }) {
  if (!texte) return null;
  return <div className="bloc"><b>{titre}</b><p>{texte}</p></div>;
}

function CarteSeance({ s, patientId, supprimer }: { s: Consultation; patientId: string; supprimer: () => void }) {
  const mesures = SESSION_SPECIFICS[s.focus];
  return (
    <article className={"seance " + s.focus}>
      <div className="seance-tete">
        <div>
          <h3>{fmtDate(s.seance_date)}</h3>
          <div className="discret">{kindLabel(s.kind)} · {specialtyLabel(s.focus)}{s.reason ? ` · ${s.reason}` : ""}</div>
        </div>
        <div className="ligne">
          {(s.pain_before !== null || s.pain_after !== null) && (
            <span className="eva">EVA {s.pain_before ?? "?"} → {s.pain_after ?? "?"}</span>
          )}
          <Link to={`/patients/${patientId}/seances/${s.id}`} className="icone-bouton" aria-label="Modifier la séance"><Pencil size={17} /></Link>
          <button type="button" className="icone-bouton" aria-label="Supprimer la séance" onClick={supprimer}><Trash2 size={17} /></button>
        </div>
      </div>
      <Bloc titre="Anamnèse" texte={s.anamnesis} />
      {mesures.length > 0 && Object.keys(s.specifics).length > 0 && (
        <div className="bloc"><ValeursDecrites defs={mesures} valeur={s.specifics} /></div>
      )}
      <Bloc titre="Examen" texte={s.exam} />
      <Bloc titre="Diagnostic ostéopathique" texte={s.diagnosis} />
      <Bloc titre="Zones traitées" texte={s.zones.join(" · ") || null} />
      <Bloc titre="Techniques" texte={s.treatment} />
      <Bloc titre="Conseils" texte={s.advice} />
      <Bloc titre="À revoir" texte={s.next_step} />
    </article>
  );
}

function Fiche({ p }: { p: Patient }) {
  const lignes: [string, string | null, boolean?][] = [
    ["Sexe", p.sex ? { F: "Femme", M: "Homme", X: "Autre" }[p.sex] : null],
    ["Profession", p.profession],
    ["Latéralité", p.dominant_hand],
    ["Téléphone", p.phone],
    ["E-mail", p.email],
    ["Adresse", p.address],
    ["N° registre national", p.niss],
    ["Mutuelle", p.mutuelle],
    ["Médecin traitant", p.referring_doctor],
    ["Dentiste / orthodontiste", p.dentist],
    ["Personne à prévenir", p.emergency_contact],
    ["Consentement RGPD", p.consent_at ? fmtDate(p.consent_at) : null],
  ];
  const antecedents: [string, string | null][] = [
    ["Médicaux", p.history_medical],
    ["Chirurgicaux", p.history_surgical],
    ["Traumatiques", p.history_trauma],
    ["Familiaux", p.history_family],
    ["Traitements en cours", p.treatments],
    ["Allergies", p.allergies],
    ["Hygiène de vie", p.lifestyle],
    ["Notes", p.notes],
  ];
  const liste = (l: [string, string | null, boolean?][], large = false) => {
    const remplies = l.filter(([, v]) => v);
    if (!remplies.length) return <p className="discret">Rien de noté.</p>;
    return (
      <dl className="infos-grille">
        {remplies.map(([k, v]) => <div key={k} className={"info" + (large ? " large" : "")}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    );
  };
  return (
    <div className="pile">
      <section className="carte"><h2>Informations</h2>{liste(lignes)}</section>
      <section className="carte"><h2>Antécédents</h2>{liste(antecedents, true)}</section>
      <p className="discret">Dossier créé le {fmtDate(p.created_at)} · modifié le {fmtDate(p.updated_at)}</p>
    </div>
  );
}
