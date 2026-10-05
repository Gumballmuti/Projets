import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="[date de mise en ligne]">
      <h2>Éditeur</h2>
      <ul>
        <li>Nom ou dénomination sociale : [à compléter]</li>
        <li>Forme juridique : [à compléter]</li>
        <li>Adresse du siège : [à compléter]</li>
        <li>Numéro d&apos;entreprise (BCE) : [à compléter]</li>
        <li>Numéro de TVA : [à compléter, le cas échéant]</li>
        <li>E-mail de contact : [à compléter]</li>
        <li>Responsable de la publication : [à compléter]</li>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        <li>Hébergeur : [nom de l&apos;hébergeur, ex. Vercel Inc.]</li>
        <li>Adresse : [à compléter d&apos;après les informations légales publiées par l&apos;hébergeur]</li>
        <li>Site : [à compléter]</li>
      </ul>

      <h2>Avertissement</h2>
      <p>
        Sport Mental est un outil de préparation mentale sportive. Il ne remplace pas l&apos;avis ou l&apos;accompagnement
        d&apos;un professionnel de santé ou d&apos;un psychologue.
      </p>

      <h2>Crédits</h2>
      <p>Conception, contenus et logo : [à compléter]. Icônes dessinées pour Sport Mental.</p>
    </LegalPage>
  );
}
