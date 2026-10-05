import type { Metadata } from "next";
import { BilanForm } from "./BilanForm";

export const metadata: Metadata = { title: "Bilan d'après-match" };

export default function BilanPage() {
  return <BilanForm />;
}
