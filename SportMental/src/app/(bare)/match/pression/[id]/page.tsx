import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITUATIONS_PRESSION } from "@/content/pression";
import { PressionRoutine } from "./PressionRoutine";

export const dynamicParams = false;

export function generateStaticParams() {
  return SITUATIONS_PRESSION.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = SITUATIONS_PRESSION.find((x) => x.id === id);
  return { title: s ? `Pression : ${s.titre}` : "Pression" };
}

export default async function PressionSituationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!SITUATIONS_PRESSION.some((s) => s.id === id)) notFound();
  return <PressionRoutine id={id} />;
}
