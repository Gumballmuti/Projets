// Générateur statique : assemble les pages de src/pages avec les gabarits partagés
// et produit le site final dans dist/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverSvg } from './src/projects/covers.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'dist');

const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const projects = JSON.parse(readFileSync(join(src, 'projects', 'projects.json'), 'utf8'));
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

const pad = (n) => String(n).padStart(2, '0');

// Blocs HTML réutilisés par plusieurs pages
const blocks = {
  projectRows: projects
    .map(
      (p, i) => `
      <a class="work-row" href="/realisations/${p.slug}" data-cursor="Voir" data-preview="/assets/img/projets/${p.slug}.svg" style="--accent:${p.palette[1]}">
        <span class="work-row__num">${pad(i + 1)}</span>
        <span class="work-row__title">${p.name}</span>
        <span class="work-row__cat">${p.category}</span>
        <span class="work-row__year">${p.year}</span>
        <span class="work-row__arrow" aria-hidden="true">↗</span>
      </a>`
    )
    .join(''),
  projectSlides: projects
    .slice(0, 4)
    .map(
      (p, i) => `
        <a class="hslide" href="/realisations/${p.slug}" data-cursor="Explorer" style="--accent:${p.palette[1]}">
          <div class="hslide__media" data-tilt>
            <img src="/assets/img/projets/${p.slug}.svg" alt="Aperçu du projet ${p.name}" width="1200" height="800" loading="lazy" decoding="async">
          </div>
          <div class="hslide__meta">
            <span class="mono">${pad(i + 1)} / ${pad(Math.min(projects.length, 4))}</span>
            <h3>${p.name}</h3>
            <p>${p.category}</p>
          </div>
        </a>`
    )
    .join(''),
  projectGrid: projects
    .map(
      (p, i) => `
      <a class="pcard reveal-up" href="/realisations/${p.slug}" data-cursor="Voir" data-filter="${p.filters.join(' ')}" style="--accent:${p.palette[1]}">
        <div class="pcard__media" data-tilt>
          <img src="/assets/img/projets/${p.slug}.svg" alt="Aperçu du projet ${p.name}" width="1200" height="800" loading="lazy" decoding="async">
          <span class="pcard__badge mono">Concept</span>
        </div>
        <div class="pcard__meta">
          <h3>${p.name}</h3>
          <span class="mono">${pad(i + 1)} — ${p.year}</span>
        </div>
        <p class="pcard__cat">${p.category}</p>
      </a>`
    )
    .join(''),
};

function pageCtx(meta, extra = {}) {
  const path = meta.path;
  const canonical = site.url + (path === '/' ? '/' : path);
  const nav = (href) => (path === href || (href !== '/' && path.startsWith(href)) ? ' aria-current="page"' : '');
  return {
    site,
    year,
    blocks,
    page: { ...meta, canonical, robots: meta.noindex ? 'noindex, follow' : 'index, follow', bodyClass: meta.bodyClass || '' },
    nav: {
      home: nav('/'),
      services: nav('/services'),
      work: nav('/realisations'),
      agency: nav('/agence'),
      contact: nav('/contact'),
    },
    ...extra,
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
  if (!meta.noindex) urls.push(meta.path);
}

// Pages « étude de cas » générées à partir des données projets
mkdirSync(join(out, 'realisations'), { recursive: true });
mkdirSync(join(out, 'assets', 'img', 'projets'), { recursive: true });
const caseTpl = readPage(join(src, 'projects', 'case.html'));
projects.forEach((p, i) => {
  const next = projects[(i + 1) % projects.length];
  writeFileSync(join(out, 'assets', 'img', 'projets', `${p.slug}.svg`), coverSvg(p, 'cover'));
  writeFileSync(join(out, 'assets', 'img', 'projets', `${p.slug}-mobile.svg`), coverSvg(p, 'mobile'));
  writeFileSync(join(out, 'assets', 'img', 'projets', `${p.slug}-detail.svg`), coverSvg(p, 'detail'));
  const meta = {
    ...caseTpl.meta,
    path: `/realisations/${p.slug}`,
    title: `${p.name} — ${p.category} | ${site.name}`,
    description: p.summary,
  };
  const ctx = pageCtx(meta, {
    p: {
      ...p,
      index: pad(i + 1),
      c0: p.palette[0],
      c1: p.palette[1],
      c2: p.palette[2],
      services: p.services.map((s) => `<li>${s}</li>`).join(''),
      challenge: p.challenge.map((s) => `<p>${s}</p>`).join(''),
      results: p.highlights
        .map((h) => `<div class="stat"><span class="stat__num">${h.value}</span><span class="stat__label">${h.label}</span></div>`)
        .join(''),
      palette: p.palette.map((c) => `<span class="swatch" style="--c:${c}"><span class="mono">${c.toUpperCase()}</span></span>`).join(''),
    },
    next: { slug: next.slug, name: next.name, category: next.category },
  });
  writeFileSync(join(out, 'realisations', `${p.slug}.html`), render(`{{> layout-top}}${caseTpl.body}{{> layout-bottom}}`, ctx));
  urls.push(meta.path);
});

writeFileSync(
  join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.url}${u === '/' ? '/' : u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

if (!existsSync(join(out, 'index.html'))) throw new Error('index.html manquant');
console.log(`Site généré dans dist/ (${urls.length} pages indexables).`);
