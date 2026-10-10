// Illustrations vectorielles des projets (maquettes navigateur, mobile et détails UI),
// générées à partir de la palette et du motif de chaque projet.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const font = readFileSync(join(here, '..', 'assets', 'fonts', 'syne-latin-wght-normal.woff2')).toString('base64');
const fontFace = `<style>@font-face{font-family:D;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 800}text{font-family:D,Arial,sans-serif}</style>`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Luminance relative simplifiée pour choisir une encre lisible
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function motif(kind, x, y, w, h, [c0, c1, c2], id) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (kind) {
    case 'glow':
      return `
        <circle cx="${cx}" cy="${cy}" r="${h * 0.42}" fill="url(#g${id})" opacity=".9"/>
        <circle cx="${cx}" cy="${cy}" r="${h * 0.22}" fill="${c1}" opacity=".55"/>
        <path d="M${cx} ${cy - h * 0.3} C ${cx + h * 0.12} ${cy - h * 0.08}, ${cx + h * 0.08} ${cy + h * 0.1}, ${cx} ${cy + h * 0.12} C ${cx - h * 0.08} ${cy + h * 0.1}, ${cx - h * 0.12} ${cy - h * 0.08}, ${cx} ${cy - h * 0.3}Z" fill="${c2}"/>
        <rect x="${cx - h * 0.09}" y="${cy + h * 0.14}" width="${h * 0.18}" height="${h * 0.3}" rx="${h * 0.03}" fill="${c2}" opacity=".9"/>`;
    case 'arches': {
      const aw = w / 3.6;
      return [0, 1, 2]
        .map((i) => {
          const ax = x + w * 0.08 + i * (aw + w * 0.05);
          const ah = h * (0.62 + i * 0.1);
          const ay = y + h - ah;
          return `<path d="M${ax} ${y + h} V${ay + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${ay + aw / 2} V${y + h}Z" fill="${i === 1 ? c1 : c2}" opacity="${i === 1 ? 1 : 0.14 + i * 0.1}"/>`;
        })
        .join('');
    }
    case 'bars':
      return Array.from({ length: 7 }, (_, i) => {
        const bh = h * (0.25 + ((i * 37) % 70) / 100);
        const bw = w / 11;
        return `<rect x="${x + i * bw * 1.5}" y="${y + h - bh}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="${i === 4 ? c1 : c2}" opacity="${i === 4 ? 1 : 0.18}"/>`;
      }).join('') + `<path d="M${x} ${y + h * 0.7} Q ${x + w * 0.35} ${y + h * 0.1}, ${x + w * 0.62} ${y + h * 0.45} T ${x + w} ${y + h * 0.05}" stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'rings':
      return Array.from({ length: 6 }, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${h * (0.08 + i * 0.075)}" fill="none" stroke="${i % 2 ? c2 : c1}" stroke-opacity="${1 - i * 0.14}" stroke-width="${i === 0 ? 0 : 2}"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${h * 0.08}" fill="${c1}"/><circle cx="${cx + h * 0.31}" cy="${cy - h * 0.2}" r="${h * 0.035}" fill="${c2}"/>`;
    case 'leaf':
      return [-28, 12, 52]
        .map((r, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${h * 0.14}" ry="${h * 0.42}" transform="rotate(${r} ${cx} ${cy + h * 0.2})" fill="${i === 1 ? c1 : c2}" opacity="${i === 1 ? 1 : 0.22}"/>`)
        .join('') + `<line x1="${cx}" y1="${cy + h * 0.45}" x2="${cx}" y2="${cy - h * 0.2}" stroke="${c0}" stroke-width="4" transform="rotate(12 ${cx} ${cy + h * 0.2})"/>`;
    case 'aurora':
      return [0, 1, 2, 3]
        .map((i) => {
          const yy = y + h * (0.25 + i * 0.17);
          return `<path d="M${x} ${yy} C ${x + w * 0.3} ${yy - h * 0.25}, ${x + w * 0.6} ${yy + h * 0.25}, ${x + w} ${yy - h * 0.1}" stroke="${i % 2 ? c2 : c1}" stroke-width="${18 - i * 3}" fill="none" stroke-linecap="round" opacity="${1 - i * 0.2}"/>`;
        })
        .join('');
    default:
      return '';
  }
}

function lines(x, y, widths, color, opacity = 0.3, gap = 22, height = 10) {
  return widths.map((w, i) => `<rect x="${x}" y="${y + i * gap}" width="${w}" height="${height}" rx="${height / 2}" fill="${color}" opacity="${opacity}"/>`).join('');
}

export function coverSvg(p, variant) {
  const [c0, c1, c2] = p.palette;
  const darkBg = lum(c0) < 0.2;
  const ink = darkBg ? c2 : c0;
  const id = p.slug.replace(/\W/g, '');
  const name = esc(p.name);
  const defs = `<defs>${fontFace}
    <radialGradient id="g${id}"><stop offset="0" stop-color="${c1}" stop-opacity=".9"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c0}"/></linearGradient>
    <filter id="sh${id}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#000" flood-opacity=".35"/></filter>
    <filter id="bl${id}"><feGaussianBlur stdDeviation="70"/></filter>
  </defs>`;

  if (variant === 'cover') {
    const W = 1200, H = 800, bx = 110, by = 120, bw = 980, bh = 620;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}
  <rect width="${W}" height="${H}" fill="url(#bg${id})"/>
  <circle cx="1040" cy="110" r="260" fill="${c2}" opacity=".25" filter="url(#bl${id})"/>
  <circle cx="160" cy="760" r="240" fill="${c0}" opacity=".6" filter="url(#bl${id})"/>
  <g filter="url(#sh${id})">
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18" fill="${c0}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="44" rx="18" fill="${ink}" opacity=".06"/>
    <circle cx="${bx + 26}" cy="${by + 22}" r="6" fill="#FF5F57"/><circle cx="${bx + 46}" cy="${by + 22}" r="6" fill="#FEBC2E"/><circle cx="${bx + 66}" cy="${by + 22}" r="6" fill="#28C840"/>
    <rect x="${bx + 330}" y="${by + 13}" width="320" height="18" rx="9" fill="${ink}" opacity=".08"/>
  </g>
  <text x="${bx + 50}" y="${by + 100}" font-size="20" font-weight="700" fill="${ink}" letter-spacing="1">${name.toUpperCase()}</text>
  ${[0, 1, 2, 3].map((i) => `<rect x="${bx + 600 + i * 80}" y="${by + 86}" width="56" height="9" rx="4.5" fill="${ink}" opacity=".35"/>`).join('')}
  <text x="${bx + 50}" y="${by + 250}" font-size="76" font-weight="800" fill="${ink}" letter-spacing="-3">${name}</text>
  ${lines(bx + 52, by + 300, [380, 320, 250], ink, 0.28, 24, 11)}
  <rect x="${bx + 52}" y="${by + 400}" width="190" height="56" rx="28" fill="${c1}"/>
  <rect x="${bx + 92}" y="${by + 423}" width="110" height="10" rx="5" fill="${lum(c1) > 0.4 ? '#111' : '#fff'}" opacity=".85"/>
  <rect x="${bx + 258}" y="${by + 400}" width="150" height="56" rx="28" fill="none" stroke="${ink}" stroke-opacity=".3" stroke-width="2"/>
  ${motif(p.motif, bx + 560, by + 130, 360, 420, p.palette, id)}
  ${[0, 1, 2].map((i) => `<rect x="${bx + 52 + i * 300}" y="${by + 520}" width="270" height="70" rx="12" fill="${ink}" opacity=".05"/>`).join('')}
</svg>`;
  }

  if (variant === 'mobile') {
    const W = 800, H = 1000, px = 240, py = 90, pw = 320, ph = 660;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}
  <rect width="${W}" height="${H}" fill="${c2}"/>
  <circle cx="400" cy="420" r="300" fill="${c1}" opacity=".55" filter="url(#bl${id})"/>
  <g filter="url(#sh${id})"><rect x="${px - 12}" y="${py - 12}" width="${pw + 24}" height="${ph + 24}" rx="54" fill="#111"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="44" fill="${c0}"/></g>
  <rect x="${px + 115}" y="${py + 14}" width="90" height="24" rx="12" fill="#111"/>
  <text x="${px + 26}" y="${py + 90}" font-size="14" font-weight="700" fill="${ink}" letter-spacing="1">${name.toUpperCase()}</text>
  <rect x="${px + 262}" y="${py + 78}" width="32" height="4" rx="2" fill="${ink}"/><rect x="${px + 274}" y="${py + 88}" width="20" height="4" rx="2" fill="${ink}"/>
  ${motif(p.motif, px + 30, py + 120, 260, 230, p.palette, id)}
  <text x="${px + 26}" y="${py + 410}" font-size="38" font-weight="800" fill="${ink}" letter-spacing="-1.5">${esc(p.name.split(' ')[0])}</text>
  ${lines(px + 28, py + 440, [230, 190, 150], ink, 0.28, 20, 8)}
  <rect x="${px + 26}" y="${py + 520}" width="268" height="52" rx="26" fill="${c1}"/>
  ${[0, 1].map((i) => `<rect x="${px + 26 + i * 138}" y="${py + 590}" width="130" height="44" rx="12" fill="${ink}" opacity=".07"/>`).join('')}
  <text x="400" y="${H - 110}" text-anchor="middle" font-size="22" font-weight="700" fill="${lum(c2) > 0.4 ? '#111' : '#fff'}" opacity=".7" letter-spacing="4">MOBILE FIRST</text>
</svg>`;
  }

  // Planche de détails : typographie, palette et composants
  const W = 1200, H = 800;
  const dInk = lum(c2) > 0.4 ? '#141414' : '#f5f5f5';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}
  <rect width="${W}" height="${H}" fill="${c2}"/>
  <text x="80" y="300" font-size="260" font-weight="800" fill="${dInk}" letter-spacing="-12">Aa</text>
  <text x="86" y="360" font-size="20" font-weight="600" fill="${dInk}" opacity=".6" letter-spacing="3">DISPLAY — 800 / 400</text>
  ${p.palette.map((c, i) => `<rect x="${640 + i * 170}" y="90" width="150" height="220" rx="20" fill="${c}" stroke="${dInk}" stroke-opacity=".12"/><text x="${656 + i * 170}" y="290" font-size="16" font-weight="700" fill="${lum(c) > 0.4 ? '#111' : '#fff'}">${c.toUpperCase()}</text>`).join('')}
  <rect x="80" y="440" width="500" height="280" rx="24" fill="${c0}"/>
  ${motif(p.motif, 330, 470, 220, 220, p.palette, id)}
  <text x="112" y="520" font-size="34" font-weight="800" fill="${ink}">${esc(p.name.split(' ')[0])}</text>
  ${lines(114, 550, [180, 150, 120], ink, 0.3, 20, 8)}
  <rect x="112" y="640" width="150" height="46" rx="23" fill="${c1}"/>
  <rect x="640" y="440" width="480" height="76" rx="38" fill="${c1}"/><text x="880" y="487" text-anchor="middle" font-size="22" font-weight="700" fill="${lum(c1) > 0.4 ? '#111' : '#fff'}">Bouton principal</text>
  <rect x="640" y="540" width="480" height="76" rx="38" fill="none" stroke="${dInk}" stroke-width="2"/><text x="880" y="587" text-anchor="middle" font-size="22" font-weight="700" fill="${dInk}">Bouton secondaire</text>
  <rect x="640" y="640" width="480" height="80" rx="16" fill="${dInk}" opacity=".06"/>
  <rect x="664" y="670" width="200" height="12" rx="6" fill="${dInk}" opacity=".35"/>
  <rect x="1050" y="662" width="48" height="28" rx="14" fill="${c1}"/><circle cx="1084" cy="676" r="10" fill="#fff"/>
</svg>`;
}
