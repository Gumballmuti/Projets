// Réception du formulaire de contact : validation puis envoi par e-mail.
// Aucune donnée n'est stockée sur le serveur.
// Variables d'environnement : RESEND_API_KEY, CONTACT_TO, CONTACT_FROM (facultatif).

const MAX = { name: 100, email: 160, company: 120, phone: 30, message: 4000, budget: 60 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Requête invalide.' });

  // Champ piège anti-robots : on répond « ok » sans rien envoyer
  if (body.website) return res.status(200).json({ ok: true });

  const data = {
    name: clean(body.name, MAX.name),
    email: clean(body.email, MAX.email),
    company: clean(body.company, MAX.company),
    phone: clean(body.phone, MAX.phone),
    message: clean(body.message, MAX.message),
    budget: clean(body.budget, MAX.budget),
    services: Array.isArray(body.services) ? body.services.slice(0, 10).map((s) => clean(s, 60)).filter(Boolean) : [],
  };

  if (data.name.length < 2 || !EMAIL_RE.test(data.email) || data.message.length < 10 || body.privacy !== true) {
    return res.status(422).json({ error: 'Merci de vérifier les champs obligatoires du formulaire.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!apiKey || !to) {
    // Envoi non configuré : le navigateur bascule sur la messagerie de l'utilisateur
    return res.status(503).json({ error: "L'envoi en ligne n'est pas disponible pour le moment." });
  }

  const rows = [
    ['Nom', data.name],
    ['E-mail', data.email],
    ['Entreprise', data.company],
    ['Téléphone', data.phone],
    ['Services', data.services.join(', ')],
    ['Budget', data.budget],
  ].filter(([, v]) => v);

  const text = rows.map(([k, v]) => `${k} : ${v}`).join('\n') + `\n\n${data.message}`;
  const html =
    `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${rows
      .map(([k, v]) => `<tr><td style="color:#666">${k}</td><td><strong>${esc(v)}</strong></td></tr>`)
      .join('')}</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(data.message)}</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Site Propulse <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()),
        reply_to: data.email,
        subject: `Nouvelle demande de projet — ${data.name}`,
        text,
        html,
      }),
    });
    if (!r.ok) throw new Error(`Statut ${r.status}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Échec de l\'envoi du formulaire :', err.message);
    return res.status(502).json({ error: "L'envoi a échoué. Vous pouvez nous écrire directement par e-mail." });
  }
}
