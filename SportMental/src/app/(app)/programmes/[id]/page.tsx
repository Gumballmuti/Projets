import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROGRAMMES } from "@/content/programmes";
import { ProgrammeDetail } from "./ProgrammeDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROGRAMMES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: PROGRAMMES.find((p) => p.id === id)?.titre ?? "Programme" };
}

export default async function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!PROGRAMMES.some((p) => p.id === id)) notFound();
  return <ProgrammeDetail id={id} />;
}
