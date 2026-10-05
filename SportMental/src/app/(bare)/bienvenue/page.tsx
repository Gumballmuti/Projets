import type { Metadata } from "next";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Bienvenue" };

export default function BienvenuePage() {
  return <Onboarding />;
}
