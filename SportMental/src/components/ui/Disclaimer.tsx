import { cn } from "@/lib/cn";

export const DISCLAIMER_TEXT =
  "Sport Mental est un outil de préparation mentale sportive. Il ne remplace pas l'avis ou l'accompagnement d'un professionnel de santé ou d'un psychologue.";

export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn("text-sm leading-relaxed text-muted", className)}>{DISCLAIMER_TEXT}</p>;
}
