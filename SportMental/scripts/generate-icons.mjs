// Génère les icônes PNG de la PWA à partir du logo SVG (sharp est fourni par Next.js).
// Usage : node scripts/generate-icons.mjs
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const logo = await readFile(new URL("./logo.svg", import.meta.url));
const out = (p) => new URL(`../${p}`, import.meta.url);

// Icône standard : logo sur fond transparent, légère marge.
async function standard(size, path) {
  const inner = Math.round(size * 0.92);
  const png = await sharp(logo, { density: 1024 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: png, gravity: "center" }])
    .png()
    .toFile(out(path).pathname);
}

// Icône « maskable » / Apple : fond plein vert forêt, logo dans la zone sûre (80 %).
async function fullBleed(size, path, ratio = 0.72) {
  const inner = Math.round(size * ratio);
  const png = await sharp(logo, { density: 1024 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#1f5f3f" } })
    .composite([{ input: png, gravity: "center" }])
    .png()
    .toFile(out(path).pathname);
}

await standard(192, "public/icons/icon-192.png");
await standard(512, "public/icons/icon-512.png");
await fullBleed(512, "public/icons/maskable-512.png", 0.7);
await fullBleed(192, "public/icons/maskable-192.png", 0.7);
await fullBleed(180, "src/app/apple-icon.png", 0.82);
console.log("Icônes générées.");
