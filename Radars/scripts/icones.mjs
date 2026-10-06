// Génère les icônes PNG à partir de scripts/icone.svg (avec le Chromium de Playwright).
// Usage : npm run icones (nécessite Playwright : npm i -g playwright)
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("./icone.svg", import.meta.url), "utf8");
const navigateur = await chromium.launch();
for (const taille of [180, 192, 512]) {
  const page = await navigateur.newPage({ viewport: { width: taille, height: taille } });
  await page.setContent(`<style>*{margin:0}svg{width:${taille}px;height:${taille}px;display:block}</style>${svg}`);
  await page.screenshot({ path: new URL(`../public/icone-${taille}.png`, import.meta.url).pathname });
  await page.close();
}
await navigateur.close();
