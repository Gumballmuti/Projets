import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Sport Mental traite tes données : tout reste sur ton téléphone.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="[date de mise en ligne]">
      <h2>En bref</h2>
      <ul>
        <li>Sport Mental fonctionne <strong>sans compte</strong>.</li>
        <li>Tout ce que tu saisis (profil, notes de match, routines, carnet de preuves) est enregistré <strong>uniquement sur ton appareil</strong>, dans le stockage local de ton navigateur.</li>
        <li>Ces données ne sont <strong>pas envoyées</strong> à l&apos;éditeur ni à des tiers. Il n&apos;y a <strong>ni publicité, ni outil de mesure d&apos;audience, ni traceur</strong>.</li>
        <li>Tu peux exporter ou supprimer toutes tes données à tout moment depuis ton profil.</li>
      </ul>

      <h2>Responsable du traitement</h2>
      <p>[Nom de l&apos;éditeur ou de la société], [adresse], [numéro d&apos;entreprise BCE], contact : [adresse e-mail].</p>

      <h2>Données concernées</h2>
      <p>
        Les notes sur ton état mental et ton ressenti peuvent être considérées comme des données sensibles. C&apos;est pourquoi
        Sport Mental applique la minimisation : seules les informations utiles à ta préparation sont demandées, la plupart
        sont facultatives, et elles restent sur ton appareil.
      </p>
      <ul>
        <li>Profil : prénom (facultatif), sport(s), poste, niveau, classement, objectif, préférences.</li>
        <li>Utilisation : routines réalisées, erreurs notées en mode match, bilans d&apos;après-match, carnet de preuves, progression des programmes.</li>
      </ul>

      <h2>Stockage local et cookies</h2>
      <p>
        Sport Mental n&apos;utilise pas de cookies. Il utilise le stockage local du navigateur (localStorage) et un cache
        hors ligne (service worker), strictement nécessaires au fonctionnement de l&apos;app que tu as demandée.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par [nom de l&apos;hébergeur, ex. Vercel Inc.]. Comme tout serveur web, l&apos;hébergeur peut
        enregistrer des journaux techniques (adresse IP, date, page demandée) pour assurer la sécurité et le bon
        fonctionnement du service. Ces journaux ne contiennent pas tes notes, qui ne quittent pas ton appareil.
        [Préciser la durée de conservation et le cadre des transferts hors UE selon les conditions de l&apos;hébergeur.]
      </p>

      <h2>Synchronisation (non disponible)</h2>
      <p>
        La version actuelle ne propose aucune synchronisation en ligne. Si une synchronisation entre appareils est
        ajoutée un jour, elle sera facultative et soumise à ton consentement explicite préalable, et cette politique sera
        mise à jour.
      </p>

      <h2>Tes droits</h2>
      <p>
        Conformément au RGPD, tu disposes notamment des droits d&apos;accès, de rectification, d&apos;effacement et de
        portabilité. Comme tes données sont sur ton appareil, tu les exerces directement : modification dans le profil,
        export au format JSON, suppression complète (« Supprimer toutes mes données »). Pour toute question :
        [adresse e-mail de contact].
      </p>
      <p>
        Tu peux aussi introduire une réclamation auprès de l&apos;Autorité de protection des données (Belgique) :{" "}
        <a href="https://www.autoriteprotectiondonnees.be" rel="noopener noreferrer">autoriteprotectiondonnees.be</a>.
      </p>
    </LegalPage>
  );
}
