import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { KINDS, SESSION_SPECIFICS, SPECIALTIES, ZONES, type Consultation, type Dossier, type Patient } from "../../commun/modele";
import { appel } from "../api";
import { Champ, ChampsDecrits, Echelle, Message, Puces, useAvertirSiModifie } from "../composants/Champs";

type Brouillon = Omit<Consultation, "id" | "patient_id" | "created_at" | "updated_at">;

const aujourdhui = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function SeanceForm() {
  const { id, seanceId } = useParams();
  const naviguer = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [s, setS] = useState<Brouillon | null>(null);
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  useAvertirSiModifie(modifie);

  useEffect(() => {
    appel<Dossier>(`patients/${id}`).then((d) => {
      setPatient(d.patient);
      const existante = d.seances.find((x) => x.id === seanceId);
      if (seanceId && !existante) return setErreur("Séance introuvable");
      setS(existante ?? {
        seance_date: aujourdhui(),
        kind: d.seances.length ? "suivi" : "premiere",
        focus: d.patient.specialties.find((x) => x !== "generale") ?? "generale",
        reason: null, anamnesis: null, pain_before: null, pain_after: null, exam: null, diagnosis: null,
        zones: [], treatment: null, advice: null, specifics: {}, next_step: null,
      });
    }).catch((e) => setErreur(e.message));
  }, [id, seanceId]);

  if (!s || !patient) return <Message erreur={erreur} />;

  const maj = <K extends keyof Brouillon>(cle: K, v: Brouillon[K]) => {
    setS({ ...s, [cle]: v });
    setModifie(true);
  };
  const texte = (cle: keyof Brouillon) => ({
    value: (s[cle] as string | null) ?? "",
    onChange: (e: { target: { value: string } }) => maj(cle, (e.target.value || null) as never),
  });

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await appel(seanceId ? `patients/${id}/seances/${seanceId}` : `patients/${id}/seances`, seanceId ? "PUT" : "POST", s);
      setModifie(false);
      naviguer(`/patients/${id}`, { replace: true });
    } catch (err) {
      setErreur((err as Error).message);
      setEnvoi(false);
    }
  };

  const mesures = SESSION_SPECIFICS[s.focus];

  return (
    <form onSubmit={enregistrer}>
      <div className="entete">
        <div>
          <Link to={`/patients/${id}`} className="discret ligne" style={{ textDecoration: "none" }}><ArrowLeft size={16} />{patient.first_name} {patient.last_name}</Link>
          <h1>{seanceId ? "Modifier la séance" : "Nouvelle séance"}</h1>
        </div>
      </div>

      {patient.contraindications && <div className="alerte" style={{ marginBottom: 16 }}><b>Contre-indications :</b> {patient.contraindications}</div>}

      <section className="carte">
        <div className="grille">
          <Champ label="Date"><input type="date" {...texte("seance_date")} required /></Champ>
          <Champ label="Type de séance">
            <select value={s.kind} onChange={(e) => maj("kind", e.target.value as Brouillon["kind"])}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </Champ>
          <Champ label="Orientation">
            <select value={s.focus} onChange={(e) => setS({ ...s, focus: e.target.value as Brouillon["focus"], specifics: {} })}>
              {SPECIALTIES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </Champ>
          <Champ label="Motif de la séance" large><input {...texte("reason")} maxLength={10000} /></Champ>
        </div>
      </section>

      <section className="carte">
        <h2>Anamnèse</h2>
        <div className="grille">
          <Champ label="Évolution depuis la dernière séance, plaintes du jour" large><textarea {...texte("anamnesis")} rows={4} /></Champ>
          <div className="champ large"><span>Douleur au début (EVA 0–10)</span><Echelle valeur={s.pain_before} changer={(v) => maj("pain_before", v)} /></div>
        </div>
      </section>

      {mesures.length > 0 && (
        <section className="carte">
          <h2>Mesures {SPECIALTIES.find((x) => x.value === s.focus)?.short}</h2>
          <ChampsDecrits defs={mesures} valeur={s.specifics} changer={(v) => maj("specifics", v)} />
        </section>
      )}

      <section className="carte">
        <h2>Examen &amp; traitement</h2>
        <div className="grille">
          <Champ label="Examen clinique, tests" large><textarea {...texte("exam")} /></Champ>
          <Champ label="Diagnostic ostéopathique / dysfonctions" large><textarea {...texte("diagnosis")} /></Champ>
          <div className="champ large">
            <span>Zones traitées</span>
            <Puces options={ZONES.map((z) => ({ value: z, label: z }))} valeur={s.zones} changer={(v) => maj("zones", v)} />
          </div>
          <Champ label="Techniques utilisées" large><textarea {...texte("treatment")} /></Champ>
          <div className="champ large"><span>Douleur en fin de séance (EVA 0–10)</span><Echelle valeur={s.pain_after} changer={(v) => maj("pain_after", v)} /></div>
        </div>
      </section>

      <section className="carte">
        <h2>Suite</h2>
        <div className="grille">
          <Champ label="Conseils, exercices donnés" large><textarea {...texte("advice")} /></Champ>
          <Champ label="À revoir / prochaine séance" large><textarea {...texte("next_step")} rows={2} /></Champ>
        </div>
      </section>

      <Message erreur={erreur} />
      <div className="actions-fixes">
        <Link to={`/patients/${id}`} className="bouton leger">Annuler</Link>
        <button className="bouton" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer la séance"}</button>
      </div>
    </form>
  );
}
