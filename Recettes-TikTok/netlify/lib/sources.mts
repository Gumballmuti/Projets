/**
 * Lecture d'une vidéo à partir de son lien, quelle que soit la plateforme :
 * TikTok, YouTube (Shorts compris), Instagram, Facebook, Pinterest, X, sites de recettes…
 * Identique dans les deux apps.
 */
const NAVIGATEUR = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};
// Instagram et Facebook donnent leurs aperçus (description, image, vidéo) au robot d'aperçu de Facebook.
const ROBOT_APERCU = { ...NAVIGATEUR, "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" };
const TAILLE_MAX = 150 * 1024 * 1024;

export class ErreurExtraction extends Error {}

export interface InfosVideo {
  url: string;
  plateforme: string;
  auteur: string;
  description: string;
  sousTitres: string;
  textePage: string; // contenu utile d'une page web (ex. recette d'un blog)
  duree: number;
  miniature: { donnees: ArrayBuffer; type: string } | null;
  videoUrl: string | null; // fichier vidéo à télécharger
  youtube: string | null; // lien YouTube, que Gemini sait regarder directement
  entetes: Record<string, string>; // pour télécharger la vidéo (cookies, referer)
}

const infosVides = (url: string, plateforme: string): InfosVideo => ({
  url, plateforme, auteur: "", description: "", sousTitres: "", textePage: "", duree: 0,
  miniature: null, videoUrl: null, youtube: null, entetes: {},
});

/** Infos d'une vidéo envoyée en fichier : rien d'autre que la vidéo elle-même. */
export const infosFichier = (): InfosVideo => infosVides("", "fichier");

/** Accepte un lien seul ou tout le texte copié depuis le bouton Partager d'une app. */
export function extraireUrl(texte: string): string {
  const m = (texte ?? "").match(/https?:\/\/[^\s<>"]+/);
  if (!m) throw new ErreurExtraction("Je ne trouve pas de lien dans ce texte.");
  return m[0].replace(/[).,;'"!?]+$/, "");
}

export function plateformeDe(url: string): string {
  const hote = (() => { try { return new URL(url).hostname.replace(/^www\.|^m\./, ""); } catch { return ""; } })();
  if (/(^|\.)tiktok\.com$/.test(hote)) return "TikTok";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(hote)) return "YouTube";
  if (/(^|\.)(instagram\.com|instagr\.am)$/.test(hote)) return "Instagram";
  if (/(^|\.)(facebook\.com|fb\.watch|fb\.com)$/.test(hote)) return "Facebook";
  if (/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/.test(hote)) return "Pinterest";
  if (/(^|\.)(x\.com|twitter\.com)$/.test(hote)) return "X";
  if (/(^|\.)snapchat\.com$/.test(hote)) return "Snapchat";
  return hote || "Web";
}

export async function infosVideo(lien: string): Promise<InfosVideo> {
  const plateforme = plateformeDe(lien);
  if (plateforme === "TikTok") return lireTiktok(lien);
  if (plateforme === "YouTube") return lireYoutube(lien);
  if (plateforme === "Instagram") return lireInstagram(lien);
  return lirePage(lien, plateforme);
}

// ---------- TikTok ----------

async function lireTiktok(lien: string): Promise<InfosVideo> {
  let item: any = null;
  let url = lien;
  let cookies = "";
  try {
    const page = await fetch(lien, { headers: NAVIGATEUR, redirect: "follow" });
    url = page.url || lien;
    cookies = page.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const html = await page.text();
    const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (m) item = JSON.parse(m[1])?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct ?? null;
  } catch {
    item = null;
  }

  // Plan B : l'API publique oEmbed de TikTok (description + miniature, pas de vidéo).
  let oembed: any = null;
  if (!item) oembed = await lireJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  if (!item && !oembed) throw new ErreurExtraction("TikTok n'a pas voulu donner les informations de cette vidéo.");

  const video = item?.video ?? {};
  const auteur = item?.author?.uniqueId ?? oembed?.author_unique_id ?? oembed?.author_name ?? "";
  const entetes = { Referer: "https://www.tiktok.com/", Cookie: cookies };
  return {
    ...infosVides(item?.id && auteur ? `https://www.tiktok.com/@${auteur}/video/${item.id}` : url, "TikTok"),
    auteur,
    description: item?.desc ?? oembed?.title ?? "",
    sousTitres: await sousTitresTiktok(video.subtitleInfos ?? [], entetes),
    duree: Number(video.duration) || 0,
    miniature: await telechargerImage(video.cover || video.originCover || oembed?.thumbnail_url, entetes),
    videoUrl: video.playAddr || video.downloadAddr || null,
    entetes,
  };
}

/** Sous-titres générés par TikTok (ce qui est dit dans la vidéo), en français de préférence. */
async function sousTitresTiktok(pistes: any[], entetes: Record<string, string>): Promise<string> {
  const rang = (p: any) => {
    const langue = String(p.LanguageCodeName ?? "").toLowerCase();
    return langue.startsWith("fr") ? 0 : langue.startsWith("en") ? 1 : 2;
  };
  for (const piste of [...pistes].sort((a, b) => rang(a) - rang(b))) {
    if (!piste.Url) continue;
    try {
      const r = await fetch(piste.Url, { headers: { ...NAVIGATEUR, ...entetes } });
      if (r.ok) return nettoyerVtt(await r.text());
    } catch {
      // on essaie la piste suivante
    }
  }
  return "";
}

export function nettoyerVtt(texte: string): string {
  const lignes: string[] = [];
  for (let ligne of texte.split(/\r?\n/)) {
    ligne = ligne.trim();
    if (!ligne || ligne === "WEBVTT" || ligne.includes("-->") || /^\d+$/.test(ligne)) continue;
    ligne = ligne.replace(/<[^>]+>/g, "");
    if (lignes.at(-1) !== ligne) lignes.push(ligne);
  }
  return lignes.join(" ");
}

// ---------- YouTube : Gemini regarde la vidéo directement à partir du lien ----------

async function lireYoutube(lien: string): Promise<InfosVideo> {
  const id = lien.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/live\/|\/embed\/)([\w-]{11})/)?.[1];
  const url = id ? `https://www.youtube.com/watch?v=${id}` : lien;
  const oembed = await lireJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  return {
    ...infosVides(id && lien.includes("/shorts/") ? `https://www.youtube.com/shorts/${id}` : url, "YouTube"),
    auteur: oembed?.author_name ?? "",
    description: oembed?.title ?? "",
    miniature: await telechargerImage(id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : oembed?.thumbnail_url, {}),
    youtube: url,
  };
}

// ---------- Instagram : la page « embed » contient la légende et souvent la vidéo ----------

async function lireInstagram(lien: string): Promise<InfosVideo> {
  const code = lien.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/)?.[1];
  const infos = await lirePage(lien, "Instagram").catch(() => infosVides(lien, "Instagram"));
  if (!code) return infos;
  try {
    const r = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, { headers: NAVIGATEUR });
    const html = await r.text();
    const legende = html.match(/<div class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/)?.[1];
    if (legende) infos.description = texteDe(legende);
    // Dans cette page, le JSON est échappé : \"video_url\":\"https:\/\/…mp4?…\"
    const video = html.match(/video_url\\*":\\*"(https?:[^"]+?)\\*"/)?.[1];
    if (video && !infos.videoUrl) infos.videoUrl = video.replace(/\\+\//g, "/").replace(/\\+u0026/g, "&");
    const auteur = html.match(/class="UsernameText"[^>]*>([^<]+)</)?.[1];
    if (auteur) infos.auteur = auteur.trim();
  } catch {
    // on garde ce que la page normale a donné
  }
  if (!infos.description && !infos.videoUrl) {
    throw new ErreurExtraction("Instagram n'a pas voulu donner cette vidéo (compte privé ?). Envoie-la en fichier à la place.");
  }
  return infos;
}

// ---------- Toute autre page : balises d'aperçu, recette structurée, texte ----------

async function lirePage(lien: string, plateforme: string): Promise<InfosVideo> {
  let page = await lireHtml(lien, NAVIGATEUR);
  // Pas de balise d'aperçu ? On redemande comme le robot d'aperçu de Facebook.
  if (!page || !meta(page.html, "og:title")) page = (await lireHtml(lien, ROBOT_APERCU)) ?? page;
  if (!page) throw new ErreurExtraction(`${plateforme} n'a pas voulu donner cette page.`);
  const { html, url } = page;

  const titre = meta(html, "og:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "";
  const description = meta(html, "og:description") || meta(html, "description") || "";
  const video = [meta(html, "og:video:secure_url"), meta(html, "og:video:url"), meta(html, "og:video"),
    meta(html, "twitter:player:stream")].find((v) => v && /\.(mp4|mov|m4v|webm)(\?|$)|video/i.test(v)) || null;
  const youtube = [meta(html, "og:video:url"), meta(html, "og:video"), html.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/)?.[0]]
    .map((v) => v?.match(/youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)([\w-]{11})/)?.[1]).find(Boolean);

  return {
    ...infosVides(meta(html, "og:url") || url, plateforme),
    auteur: decoder(meta(html, "og:site_name") || meta(html, "author") || ""),
    description: decoder([titre, description].filter(Boolean).join("\n")),
    textePage: [donneesStructurees(html), texteDe(html)].filter(Boolean).join("\n\n").slice(0, 30000),
    miniature: await telechargerImage(meta(html, "og:image") || meta(html, "twitter:image"), { Referer: url }),
    videoUrl: video ? decoder(video) : null,
    youtube: youtube ? `https://www.youtube.com/watch?v=${youtube}` : null,
    entetes: { Referer: url },
  };
}

async function lireHtml(url: string, entetes: Record<string, string>) {
  try {
    const r = await fetch(url, { headers: entetes, redirect: "follow" });
    if (!r.ok) return null;
    return { html: await r.text(), url: r.url || url };
  } catch {
    return null;
  }
}

function meta(html: string, nom: string): string {
  const n = nom.replace(/[.:]/g, (c) => "\\" + c);
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']*)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${n}["']`, "i"));
  return m ? decoder(m[1]) : "";
}

/** Recettes et films décrits en JSON-LD (schema.org), très courant sur les sites de cuisine. */
function donneesStructurees(html: string): string {
  const blocs = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const utiles = blocs.filter((b) => /"@type"\s*:\s*"?\[?\s*"(Recipe|Movie|TVSeries|VideoObject|ItemList)"/.test(b));
  return utiles.join("\n").slice(0, 15000);
}

function texteDe(html: string): string {
  return decoder(
    html
      .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|li|h\d|div|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  ).replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function decoder(texte: string): string {
  return texte
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

// ---------- Téléchargements ----------

async function lireJson(url: string) {
  return fetch(url, { headers: NAVIGATEUR }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}

async function telechargerImage(url: string | undefined, entetes: Record<string, string>) {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { ...NAVIGATEUR, ...entetes } });
    const type = r.headers.get("content-type") ?? "image/jpeg";
    if (!r.ok || !type.startsWith("image/")) return null;
    return { donnees: await r.arrayBuffer(), type };
  } catch {
    return null;
  }
}

/** Télécharge le fichier vidéo (avec les cookies et le referer de la page, sinon certaines plateformes refusent). */
export async function telechargerVideo(infos: InfosVideo): Promise<Buffer> {
  if (!infos.videoUrl) throw new ErreurExtraction(`${infos.plateforme} ne donne pas accès au fichier vidéo.`);
  const r = await fetch(infos.videoUrl, { headers: { ...NAVIGATEUR, ...infos.entetes } });
  if (!r.ok) throw new ErreurExtraction(`Impossible de télécharger la vidéo (erreur ${r.status}).`);
  const video = Buffer.from(await r.arrayBuffer());
  if (video.length > TAILLE_MAX) throw new ErreurExtraction("La vidéo est trop lourde.");
  return video;
}
