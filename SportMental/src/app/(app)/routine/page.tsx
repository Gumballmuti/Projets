import type { Metadata } from "next";
import { RoutineFlow } from "./RoutineFlow";

export const metadata: Metadata = { title: "Routine pré-match" };

export default function RoutinePage() {
  return <RoutineFlow />;
}
