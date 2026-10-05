import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXERCICES } from "@/content/exercices";
import { ExerciceDetail } from "./ExerciceDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXERCICES.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: EXERCICES.find((e) => e.id === id)?.titre ?? "Exercice" };
}

export default async function ExercicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!EXERCICES.some((e) => e.id === id)) notFound();
  return <ExerciceDetail id={id} />;
}
