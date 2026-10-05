import type { Metadata } from "next";
import { Progression } from "./Progression";

export const metadata: Metadata = { title: "Progression" };

export default function ProgressionPage() {
  return <Progression />;
}
