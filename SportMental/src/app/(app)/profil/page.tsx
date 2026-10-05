import type { Metadata } from "next";
import { Profil } from "./Profil";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilPage() {
  return <Profil />;
}
