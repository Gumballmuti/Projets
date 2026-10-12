// Formulaire de contact — version Netlify (même logique que la version Vercel)
import { handleContact } from '../../lib/contact-core.mjs';

export default async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée.' }), { status: 405, headers: { ...headers, Allow: 'POST' } });
  }
  let body = null;
  try { body = await req.json(); } catch { body = null; }
  const result = await handleContact(body, process.env);
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
};

export const config = { path: '/api/contact' };
