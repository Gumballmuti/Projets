import type { Metadata } from "next";
import { Bibliotheque } from "./Bibliotheque";

export const metadata: Metadata = { title: "Exercices" };

export default function ExercicesPage() {
  return <Bibliotheque />;
}
