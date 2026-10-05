import type { Metadata } from "next";
import { Suspense } from "react";
import { PointSuivant } from "./PointSuivant";

export const metadata: Metadata = { title: "Point suivant" };

export default function PointSuivantPage() {
  return (
    <Suspense>
      <PointSuivant />
    </Suspense>
  );
}
