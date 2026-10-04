/** Analyse en arrière-plan (jusqu'à 15 min), si le plan Netlify le permet. */
import type { Context } from "@netlify/functions";
import { analyser } from "../lib/analyse.mts";
import { egal, jeton } from "../lib/commun.mts";

export default async (req: Request, _context: Context) => {
  if (!egal(req.headers.get("x-cle") ?? "", jeton())) return;
  const { id } = await req.json();
  await analyser(id);
};
