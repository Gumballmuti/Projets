// Formulaire de contact — version Vercel
import { handleContact } from '../lib/contact-core.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const result = await handleContact(body, process.env);
  return res.status(result.status).json(result.body);
}
