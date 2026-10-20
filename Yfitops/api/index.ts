// Point d'entrée Vercel : vercel.json envoie /api/<chemin> ici, avec ?chemin=<chemin>.
import { cheminDe, traiter } from "../serveur/api.js";

const repondre = (req: Request) => traiter(req, cheminDe(new URL(req.url).searchParams.get("chemin") ?? ""));

export const GET = repondre;
export const POST = repondre;
export const PUT = repondre;
export const PATCH = repondre;
export const DELETE = repondre;
