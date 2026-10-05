import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { DISCLAIMER_TEXT } from "@/components/ui/Disclaimer";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  alternates: { canonical: "/conditions" },
};

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="[date de mise en ligne]">
      <h2>Objet</h2>
      <p>
        Sport Mental est une application web gratuite de préparation mentale sportive éditée par [nom de l&apos;éditeur].
        En l&apos;utilisant, tu acceptes les présentes conditions.
      </p>

      <h2>Pas un dispositif médical</h2>
      <p>{DISCLAIMER_TEXT}</p>
      <p>
        L&apos;app ne pose aucun diagnostic et ne propose aucun traitement. Si tu traverses une période difficile (anxiété
        envahissante, tristesse persistante, pensées sombres), parles-en à un professionnel de santé. En cas d&apos;urgence,
        appelle le 112.
      </p>

      <h2>Aucune garantie de résultat</h2>
      <p>
        Les exercices et conseils proposés visent à t&apos;aider à mieux gérer tes émotions et ton attention en compétition.
        Ils ne garantissent aucun résultat sportif. Pratique les exercices physiques (respiration, activation) à ton rythme
        et arrête si tu ressens un inconfort.
      </p>

      <h2>Tes données</h2>
      <p>
        Les données que tu saisis restent sur ton appareil (voir la <a href="/confidentialite">politique de confidentialité</a>).
        Tu es responsable de leur sauvegarde : une suppression des données du navigateur ou un changement d&apos;appareil peut
        les effacer. Utilise l&apos;export JSON pour les conserver.
      </p>

      <h2>Disponibilité</h2>
      <p>
        L&apos;éditeur s&apos;efforce de maintenir le service accessible, sans obligation de résultat. Le service peut évoluer,
        être interrompu ou modifié à tout moment.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, exercices, programmes, le logo et le design de Sport Mental sont la propriété de [nom de l&apos;éditeur].
        Toute reproduction sans autorisation est interdite, sauf usage personnel.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Ces conditions sont soumises au droit belge. [Préciser la juridiction compétente et les règles applicables aux
        consommateurs.]
      </p>

      <h2>Contact</h2>
      <p>[adresse e-mail de contact]</p>
    </LegalPage>
  );
}
