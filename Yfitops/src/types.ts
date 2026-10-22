export interface Titre {
  id: string;
  titre: string;
  artiste: string;
  artisteId: string;
  image: string;
  duree: number;
  album?: string;
  albumId?: string;
  apercu?: string; // extrait de 30 s, si le titre n'est pas trouvé sur YouTube
  ajoute_le?: string;
}

export interface Artiste {
  id: string;
  nom: string;
  image: string;
  banniere?: string;
  abonnes?: number;
  verifie?: boolean;
  pseudo?: string;
  bio?: string;
  ajoute_le?: string;
}

/** Playlist ou album du catalogue. id : « a123 » pour un album, « p123 » pour une playlist. */
export interface PlaylistDistante {
  id: string;
  nom: string;
  auteur: string;
  auteurId?: string;
  image: string;
  album: boolean;
  nbTitres?: number;
  description?: string;
  annee?: string;
  ajoute_le?: string;
}

export interface MaPlaylist {
  id: string;
  nom: string;
  description: string;
  titres: Titre[];
  cree_le: string;
  maj_le: string;
}

export type TypeRecent = "maPlaylist" | "playlist" | "artiste" | "aimes" | "genre";

export interface Recent {
  type: TypeRecent;
  id: string;
  nom: string;
  image: string;
  sous_titre: string;
  le: string;
}

export interface Bibliotheque {
  playlists: MaPlaylist[];
  aimes: Titre[];
  artistes: Artiste[];
  enregistrees: PlaylistDistante[];
  recents: Recent[];
}

/** D'où vient la lecture en cours (pour « Lecture en cours depuis… » et les récents). */
export interface Contexte {
  type: TypeRecent | "recherche" | "titres";
  id: string;
  nom: string;
  lien: string;
  image?: string;
  sous_titre?: string;
}
