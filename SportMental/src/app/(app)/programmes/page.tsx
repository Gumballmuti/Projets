import type { Metadata } from "next";
import { ProgrammesListe } from "./ProgrammesListe";

export const metadata: Metadata = { title: "Programmes" };

export default function ProgrammesPage() {
  return <ProgrammesListe />;
}
