import type { Metadata } from "next";
import { Preuves } from "./Preuves";

export const metadata: Metadata = { title: "Carnet de preuves" };

export default function PreuvesPage() {
  return <Preuves />;
}
