/** Analyse en arrière-plan (jusqu'à 15 min), si le plan Netlify le permet. */
import type { Context } from "@netlify/functions";
import { analyser } from "../lib/analyse.mts";
import { cleInterne, egal, pour } from "../lib/comptes.mts";

export default async (req: Request, _context: Context) => {
  if (!egal(req.headers.get("x-cle") ?? "", cleInterne())) return;
  const { proprio, id } = await req.json();
  await pour(proprio, () => analyser(id));
};
