import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PROFILE_FIELDS, SPECIALTIES, type Dossier, type Patient, type Specialty } from "../../commun/modele";
import { appel } from "../api";
import { Champ, ChampsDecrits, Message, Puces, useAvertirSiModifie } from "../composants/Champs";

type Brouillon = Omit<Patient, "id" | "created_at" | "updated_at">;

const VIDE: Brouillon = {
  last_name: "", first_name: "", birth_date: null, sex: null, phone: null, email: null, address: null,
  profession: null, niss: null, mutuelle: null, referring_doctor: null, dentist: null, emergency_contact: null,
  dominant_hand: null, specialties: ["generale"], main_complaint: null, history_medical: null, history_surgical: null,
  history_trauma: null, history_family: null, treatments: null, allergies: null, contraindications: null,
  lifestyle: null, migraine_profile: {}, atm_profile: {}, sport_profile: {}, notes: null, consent_at: null, archived: false,
};

export default function FichePatient() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const [p, setP] = useState<Brouillon | null>(id ? null : VIDE);
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  useAvertirSiModifie(modifie);

  useEffect(() => {
    if (id) appel<Dossier>(`patients/${id}`).then((d) => setP(d.patient)).catch((e) => setErreur(e.message));
  }, [id]);

  if (!p) return <Message erreur={erreur} />;

  const maj = <K extends keyof Brouillon>(cle: K, v: Brouillon[K]) => {
    setP({ ...p, [cle]: v });
    setModifie(true);
  };
  const texte = (cle: keyof Brouillon) => ({
    value: (p[cle] as string | null) ?? "",
    onChange: (e: { target: { value: string } }) => maj(cle, (e.target.value || null) as never),
  });

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const d = await appel<Dossier>(id ? `patients/${id}` : "patients", id ? "PUT" : "POST", p);
      setModifie(false);
      naviguer(`/patients/${d.patient.id}`, { replace: !!id });
    } catch (err) {
      setErreur((err as Error).message);
      setEnvoi(false);
    }
  };

  const bilans = (["migraine", "atm", "sport"] as const).filter((s) => p.specialties.includes(s));

  return (
    <form onSubmit={enregistrer}>
      <div className="entete">
        <div>
          <Link to={id ? `/patients/${id}` : "/"} className="discret ligne" style={{ textDecoration: "none" }}><ArrowLeft size={16} />Retour</Link>
          <h1>{id ? `${p.first_name} ${p.last_name}` : "Nouveau patient"}</h1>
        </div>
      </div>

      <section className="carte">
        <h2>Identité</h2>
        <div className="grille">
          <Champ label="Nom *"><input {...texte("last_name")} required maxLength={200} autoCapitalize="characters" /></Champ>
          <Champ label="Prénom *"><input {...texte("first_name")} required maxLength={200} /></Champ>
          <Champ label="Date de naissance"><input type="date" {...texte("birth_date")} /></Champ>
          <Champ label="Sexe">
            <select {...texte("sex")}>
              <option value="">—</option><option value="F">Femme</option><option value="M">Homme</option><option value="X">Autre</option>
            </select>
          </Champ>
          <Champ label="Profession"><input {...texte("profession")} maxLength={200} /></Champ>
          <Champ label="Latéralité">
            <select {...texte("dominant_hand")}>
              <option value="">—</option><option value="droite">Droitier</option><option value="gauche">Gaucher</option><option value="ambidextre">Ambidextre</option>
            </select>
          </Champ>
          <Champ label="N° registre national"><input {...texte("niss")} maxLength={200} /></Champ>
          <Champ label="Mutuelle"><input {...texte("mutuelle")} maxLength={200} /></Champ>
        </div>
      </section>

      <section className="carte">
        <h2>Coordonnées</h2>
        <div className="grille">
          <Champ label="Téléphone"><input type="tel" {...texte("phone")} maxLength={200} /></Champ>
          <Champ label="E-mail"><input type="email" {...texte("email")} maxLength={200} /></Champ>
          <Champ label="Adresse" large><textarea {...texte("address")} rows={2} /></Champ>
          <Champ label="Personne à prévenir"><input {...texte("emergency_contact")} maxLength={200} /></Champ>
          <Champ label="Médecin traitant / prescripteur"><input {...texte("referring_doctor")} maxLength={200} /></Champ>
          <Champ label="Dentiste / orthodontiste"><input {...texte("dentist")} maxLength={200} /></Champ>
        </div>
      </section>

      <section className="carte">
        <h2>Suivi</h2>
        <div className="pile">
          <div className="champ">
            <span>Type de suivi</span>
            <Puces options={SPECIALTIES.map((s) => ({ value: s.value, label: s.label }))} valeur={p.specialties}
              changer={(v) => maj("specialties", v as Specialty[])} />
          </div>
          <Champ label="Motif principal de consultation"><input {...texte("main_complaint")} maxLength={200} /></Champ>
        </div>
      </section>

      <section className="carte">
        <h2>Antécédents</h2>
        <div className="grille">
          <Champ label="Contre-indications / drapeaux rouges" large><textarea {...texte("contraindications")} /></Champ>
          <Champ label="Médicaux"><textarea {...texte("history_medical")} /></Champ>
          <Champ label="Chirurgicaux"><textarea {...texte("history_surgical")} /></Champ>
          <Champ label="Traumatiques (chutes, accidents, fractures…)"><textarea {...texte("history_trauma")} /></Champ>
          <Champ label="Familiaux"><textarea {...texte("history_family")} /></Champ>
          <Champ label="Traitements en cours"><textarea {...texte("treatments")} /></Champ>
          <Champ label="Allergies"><textarea {...texte("allergies")} /></Champ>
          <Champ label="Hygiène de vie (sommeil, stress, activité, alimentation…)" large><textarea {...texte("lifestyle")} /></Champ>
        </div>
      </section>

      {bilans.map((s) => {
        const b = PROFILE_FIELDS[s];
        return (
          <section key={s} className="carte">
            <h2>{b.title}</h2>
            <ChampsDecrits defs={b.defs} valeur={p[b.field]} changer={(v) => maj(b.field, v)} />
          </section>
        );
      })}

      <section className="carte">
        <h2>Notes &amp; consentement</h2>
        <div className="grille">
          <Champ label="Notes libres" large><textarea {...texte("notes")} /></Champ>
          <Champ label="Consentement RGPD signé le"><input type="date" {...texte("consent_at")} /></Champ>
          {id && (
            <label className="champ">
              <span>Dossier archivé</span>
              <span className="ligne"><input type="checkbox" checked={p.archived} onChange={(e) => maj("archived", e.target.checked)} style={{ width: 22, height: 22 }} /> Ne plus afficher dans la liste active</span>
            </label>
          )}
        </div>
      </section>

      <Message erreur={erreur} />
      <div className="actions-fixes">
        <Link to={id ? `/patients/${id}` : "/"} className="bouton leger">Annuler</Link>
        <button className="bouton" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer la fiche"}</button>
      </div>
    </form>
  );
}
