import type { Metadata } from "next";
import { PressionListe } from "./PressionListe";

export const metadata: Metadata = { title: "Je suis sous pression" };

export default function PressionPage() {
  return <PressionListe />;
}
