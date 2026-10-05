import type { Metadata } from "next";
import { Erreur } from "./Erreur";

export const metadata: Metadata = { title: "J'ai fait une erreur" };

export default function ErreurPage() {
  return <Erreur />;
}
