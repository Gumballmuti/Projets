import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { appel, NonConnecte } from "../api";
import type { Artiste, Bibliotheque, MaPlaylist, PlaylistDistante, Recent, Titre } from "../types";
import { useSession } from "./Session";
import { useToast } from "./Toasts";

const vide: Bibliotheque = { playlists: [], aimes: [], artistes: [], enregistrees: [], recents: [] };

function useValeur() {
  const [b, setB] = useState<Bibliotheque>(vide);
  const [pret, setPret] = useState(false);
  const toast = useToast();
  const { deconnecte } = useSession();

  const echec = useCallback((e: unknown) => {
    if (e instanceof NonConnecte) return deconnecte();
    toast((e as Error).message);
    appel<Bibliotheque>("bibliotheque").then(setB).catch(() => {});
  }, [deconnecte, toast]);

  useEffect(() => {
    appel<Bibliotheque>("bibliotheque").then((x) => { setB(x); setPret(true); }).catch(echec);
  }, [echec]);

  /** Envoie la modification ; l'interface change tout de suite si on sait déjà le résultat. */
  const maj = useCallback(async (chemin: string, methode: string, corps?: unknown, optimiste?: (b: Bibliotheque) => Bibliotheque, message?: string) => {
    if (optimiste) setB(optimiste);
    try {
      const n = await appel<Bibliotheque>(chemin, methode, corps);
      setB(n);
      if (message) toast(message);
      return n;
    } catch (e) {
      echec(e);
      return null;
    }
  }, [echec, toast]);

  return useMemo(() => {
    const ids = {
      aimes: new Set(b.aimes.map((t) => t.id)),
      artistes: new Set(b.artistes.map((a) => a.id)),
      enregistrees: new Set(b.enregistrees.map((p) => p.id)),
    };
    const sans = <T extends { id: string }>(l: T[], id: string) => l.filter((x) => x.id !== id);
    return {
      ...b,
      pret,
      aime: (id: string) => ids.aimes.has(id),
      suit: (id: string) => ids.artistes.has(id),
      enregistree: (id: string) => ids.enregistrees.has(id),
      maPlaylist: (id: string) => b.playlists.find((p) => p.id === id),

      basculerAime(t: Titre) {
        const deja = ids.aimes.has(t.id);
        return maj(`aimes/${t.id}`, deja ? "DELETE" : "PUT", deja ? undefined : { titre: t },
          (x) => ({ ...x, aimes: deja ? sans(x.aimes, t.id) : [{ ...t, ajoute_le: new Date().toISOString() }, ...x.aimes] }),
          deja ? "Retiré des titres likés" : "Ajouté aux titres likés");
      },
      basculerArtiste(a: Artiste) {
        const deja = ids.artistes.has(a.id);
        return maj(`artistes/${a.id}`, deja ? "DELETE" : "PUT", deja ? undefined : { artiste: a },
          (x) => ({ ...x, artistes: deja ? sans(x.artistes, a.id) : [{ ...a, ajoute_le: new Date().toISOString() }, ...x.artistes] }),
          deja ? "Retiré de la bibliothèque" : "Ajouté à la bibliothèque");
      },
      basculerEnregistree(p: PlaylistDistante) {
        const deja = ids.enregistrees.has(p.id);
        return maj(`enregistrees/${p.id}`, deja ? "DELETE" : "PUT", deja ? undefined : { playlist: p },
          (x) => ({ ...x, enregistrees: deja ? sans(x.enregistrees, p.id) : [{ ...p, ajoute_le: new Date().toISOString() }, ...x.enregistrees] }),
          deja ? "Retiré de la bibliothèque" : "Ajouté à la bibliothèque");
      },
      async creerPlaylist(titres: Titre[] = [], nom = ""): Promise<MaPlaylist | null> {
        const n = await maj("playlists", "POST", { titres, nom }, undefined, titres.length ? "Ajouté à la nouvelle playlist" : "Playlist créée");
        return n?.playlists[0] ?? null;
      },
      modifierPlaylist: (id: string, champs: { nom?: string; description?: string }) =>
        maj(`playlists/${id}`, "PATCH", champs,
          (x) => ({ ...x, playlists: x.playlists.map((p) => (p.id === id ? { ...p, ...champs } : p)) })),
      supprimerPlaylist: (id: string) =>
        maj(`playlists/${id}`, "DELETE", undefined, (x) => ({ ...x, playlists: sans(x.playlists, id) }), "Playlist supprimée"),
      async ajouterAPlaylist(id: string, titres: Titre[]) {
        const p = b.playlists.find((x) => x.id === id);
        const nouveaux = titres.filter((t) => !p?.titres.some((x) => x.id === t.id));
        if (!nouveaux.length) return toast(titres.length > 1 ? "Ces titres sont déjà dans la playlist" : "Ce titre est déjà dans la playlist");
        await maj(`playlists/${id}/titres`, "POST", { titres: nouveaux }, undefined, `Ajouté à « ${p?.nom ?? "la playlist"} »`);
      },
      retirerDePlaylist: (id: string, titreId: string) =>
        maj(`playlists/${id}/titres/${titreId}`, "DELETE", undefined,
          (x) => ({ ...x, playlists: x.playlists.map((p) => (p.id === id ? { ...p, titres: sans(p.titres, titreId) } : p)) }),
          "Retiré de la playlist"),
      reordonner: (id: string, titres: Titre[]) =>
        maj(`playlists/${id}/ordre`, "PUT", { ids: titres.map((t) => t.id) },
          (x) => ({ ...x, playlists: x.playlists.map((p) => (p.id === id ? { ...p, titres } : p)) })),
      ajouterRecent: (element: Omit<Recent, "le">) =>
        maj("recents", "POST", { element }, (x) => ({
          ...x, recents: [{ ...element, le: new Date().toISOString() }, ...x.recents.filter((r) => !(r.type === element.type && r.id === element.id))],
        })),
      effacerRecents: () => maj("recents", "DELETE", undefined, (x) => ({ ...x, recents: [] })),
    };
  }, [b, pret, maj, toast]);
}

const Ctx = createContext<ReturnType<typeof useValeur>>(null!);

export function FournisseurBibliotheque({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useValeur()}>{children}</Ctx.Provider>;
}

export const useBiblio = () => useContext(Ctx);
