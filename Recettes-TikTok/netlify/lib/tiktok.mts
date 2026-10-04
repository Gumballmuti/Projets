/** Lecture d'une vidéo TikTok : description, sous-titres, miniature et fichier vidéo. */
const NAVIGATEUR = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

export class ErreurExtraction extends Error {}

export interface InfosVideo {
  url: string;
  auteur: string;
  description: string;
  sousTitres: string;
  duree: number;
  miniature: { donnees: ArrayBuffer; type: string } | null;
  videoUrl: string | null;
  cookies: string;
}

/** Accepte un lien seul ou tout le texte copié depuis le bouton Partager de TikTok. */
export function extraireUrl(texte: string): string {
  const m = (texte ?? "").match(/https?:\/\/\S*tiktok\.com\/\S+/);
  if (!m) throw new ErreurExtraction("Je ne trouve pas de lien TikTok dans ce texte.");
  return m[0].replace(/[).,;'"]+$/, "");
}

export async function infosVideo(lien: string): Promise<InfosVideo> {
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
  if (!item) {
    oembed = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { headers: NAVIGATEUR })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  if (!item && !oembed) {
    throw new ErreurExtraction("TikTok n'a pas voulu donner les informations de cette vidéo.");
  }

  const video = item?.video ?? {};
  const auteur = item?.author?.uniqueId ?? oembed?.author_unique_id ?? oembed?.author_name ?? "";
  return {
    url: item?.id && auteur ? `https://www.tiktok.com/@${auteur}/video/${item.id}` : url,
    auteur,
    description: item?.desc ?? oembed?.title ?? "",
    sousTitres: await sousTitres(video.subtitleInfos ?? [], cookies),
    duree: Number(video.duration) || 0,
    miniature: await telechargerImage(video.cover || video.originCover || oembed?.thumbnail_url, cookies),
    videoUrl: video.playAddr || video.downloadAddr || null,
    cookies,
  };
}

async function telechargerImage(url: string | undefined, cookies: string) {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { ...NAVIGATEUR, Referer: "https://www.tiktok.com/", Cookie: cookies } });
    if (!r.ok) return null;
    return { donnees: await r.arrayBuffer(), type: r.headers.get("content-type") ?? "image/jpeg" };
  } catch {
    return null;
  }
}

/** Sous-titres générés par TikTok (ce qui est dit dans la vidéo), en français de préférence. */
async function sousTitres(pistes: any[], cookies: string): Promise<string> {
  const rang = (p: any) => {
    const langue = String(p.LanguageCodeName ?? "").toLowerCase();
    return langue.startsWith("fr") ? 0 : langue.startsWith("en") ? 1 : 2;
  };
  for (const piste of [...pistes].sort((a, b) => rang(a) - rang(b))) {
    if (!piste.Url) continue;
    try {
      const r = await fetch(piste.Url, { headers: { ...NAVIGATEUR, Referer: "https://www.tiktok.com/", Cookie: cookies } });
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

const TAILLE_MAX = 100 * 1024 * 1024;

/** Télécharge le fichier vidéo (avec les cookies de la page, sinon TikTok refuse). */
export async function telechargerVideo(infos: InfosVideo): Promise<Buffer> {
  if (!infos.videoUrl) throw new ErreurExtraction("TikTok ne donne pas accès au fichier vidéo.");
  const r = await fetch(infos.videoUrl, {
    headers: { ...NAVIGATEUR, Referer: "https://www.tiktok.com/", Cookie: infos.cookies },
  });
  if (!r.ok) throw new ErreurExtraction(`Impossible de télécharger la vidéo (erreur ${r.status}).`);
  const video = Buffer.from(await r.arrayBuffer());
  if (video.length > TAILLE_MAX) throw new ErreurExtraction("La vidéo est trop lourde.");
  return video;
}
