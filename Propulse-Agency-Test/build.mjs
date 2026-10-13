// Générateur statique : assemble les pages de src/pages avec les gabarits partagés
// et produit le site final dans dist/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'dist');

const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const year = new Date().getFullYear();

const partials = Object.fromEntries(
  readdirSync(join(src, 'partials')).map((f) => [f.replace(/\.html$/, ''), readFileSync(join(src, 'partials', f), 'utf8')])
);

const get = (ctx, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);

function render(tpl, ctx, depth = 0) {
  if (depth > 6) throw new Error('Inclusion de gabarits trop profonde');
  let html = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Gabarit inconnu : ${name}`);
    return render(partials[name], ctx, depth + 1);
  });
  html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, path) => {
    const v = get(ctx, path);
    if (v === undefined) throw new Error(`Variable inconnue : ${path}`);
    return String(v);
  });
  return html;
}

function readPage(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Métadonnées manquantes dans ${file}`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

// Liens vers les réseaux sociaux (affichés seulement s'ils sont renseignés dans site.config.json)
const FB_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4v3.2h2.8V22h3.3z"/></svg>';
const fb = site.social && site.social.facebook;
const socialHtml = fb
  ? `<div class="social"><a class="social__link" href="${fb}" target="_blank" rel="noopener noreferrer" aria-label="${site.name} sur Facebook (nouvel onglet)"><span class="social__icon">${FB_ICON}</span>Facebook</a></div>`
  : '';
const social = { footer: socialHtml, menu: socialHtml };

function pageCtx(meta) {
  const path = meta.path;
  return {
    site,
    year,
    social,
    page: {
      ...meta,
      canonical: site.url + path,
      robots: meta.noindex ? 'noindex, follow' : 'index, follow',
      bodyClass: meta.bodyClass || '',
    },
  };
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(src, 'assets'), join(out, 'assets'), { recursive: true });
for (const f of readdirSync(join(src, 'static'))) cpSync(join(src, 'static', f), join(out, f), { recursive: true });

const urls = [];
for (const f of readdirSync(join(src, 'pages'))) {
  const { meta, body } = readPage(join(src, 'pages', f));
  const html = render(`{{> layout-top}}${body}{{> layout-bottom}}`, pageCtx(meta));
  writeFileSync(join(out, f), html);
  // Copie en dossier (/page/index.html) : la page répond aussi à « /page/ », quel que soit l'hébergeur
  if (meta.path !== '/' && f !== '404.html') {
    mkdirSync(join(out, meta.path), { recursive: true });
    writeFileSync(join(out, meta.path, 'index.html'), html);
  }
  if (!meta.noindex) urls.push(meta.path);
}

writeFileSync(
  join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.url}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

if (!existsSync(join(out, 'index.html'))) throw new Error('index.html manquant');
console.log(`Site généré dans dist/ (${urls.length} pages indexables).`);
