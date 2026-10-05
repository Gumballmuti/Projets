"use client";

import { useSyncExternalStore } from "react";
import {
  STORAGE_KEY,
  clearData,
  defaultData,
  getBrowserStorage,
  readData,
  writeData,
  type AppData,
  type StorageBackend,
  type StorageStatus,
} from "./storage";

/**
 * Store client minimal (sans dépendance) au-dessus du service de stockage.
 * Côté serveur et pendant l'hydratation : `loaded = false`, pour rendre un état neutre.
 */
type State = { data: AppData; status: StorageStatus; loaded: boolean };

const SERVER_STATE: State = { data: defaultData(), status: "ok", loaded: false };

let backend: StorageBackend | null = null;
let state: State = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function applyTheme(theme: AppData["profil"]["theme"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  backend = getBrowserStorage();
  const { data, status } = readData(backend);
  state = { data, status, loaded: true };
  applyTheme(data.profil.theme);
  // Synchronisation entre onglets.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = readData(backend);
    state = { data: next.data, status: next.status, loaded: true };
    applyTheme(next.data.profil.theme);
    emit();
  });
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): State {
  init();
  return state;
}

function getServerSnapshot(): State {
  return SERVER_STATE;
}

export function updateData(updater: (data: AppData) => AppData): StorageStatus {
  init();
  const data = updater(state.data);
  const status = writeData(backend, data);
  state = { data, status, loaded: true };
  applyTheme(data.profil.theme);
  emit();
  return status;
}

export function replaceData(data: AppData): StorageStatus {
  return updateData(() => data);
}

export function resetAllData() {
  init();
  clearData(backend);
  state = { data: defaultData(), status: backend ? "ok" : "unavailable", loaded: true };
  applyTheme("system");
  emit();
}

export function getData(): AppData {
  init();
  return state.data;
}

export function useAppData() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { data: s.data, status: s.status, loaded: s.loaded, update: updateData };
}

/** Sport actuellement suivi (« autre » tant que le joueur n'a pas choisi). */
export function useSport() {
  const { data } = useAppData();
  return data.profil.sportActif;
}
