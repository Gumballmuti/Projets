// Annonces vocales (synthèse vocale du téléphone) et bips (Web Audio).

let audio = null;
let voixFr = null;
export const sons = { voix: true, actif: true };

function choisirVoix() {
  const voix = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith("fr"));
  voixFr = voix.find(v => /amélie|amelie|audrey|thomas|google/i.test(v.name)) || voix[0] || null;
}

/** À appeler lors d'un toucher : iOS n'autorise le son qu'après une action de l'utilisateur. */
export function debloquer() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  } catch {}
  if ("speechSynthesis" in window && !voixFr) {
    choisirVoix();
    speechSynthesis.onvoiceschanged = choisirVoix;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

export function parler(texte, { urgent = false } = {}) {
  if (!sons.actif || !sons.voix || !("speechSynthesis" in window)) return;
  if (urgent) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = "fr-FR";
  if (voixFr) u.voice = voixFr;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

/** Petite mélodie : `notes` = [[fréquence Hz, durée s], …]. */
function jouer(notes, volume = 0.25) {
  if (!sons.actif || !audio) return;
  let t = audio.currentTime + 0.02;
  for (const [f, d] of notes) {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + d + 0.02);
    t += d * 0.9;
  }
}

export const carillonDanger = () => jouer([[880, 0.18], [660, 0.18], [880, 0.3]], 0.3);
export const bipExces = () => jouer([[1250, 0.12], [1250, 0.12]], 0.22);
export const bipInfo = () => jouer([[740, 0.15]], 0.2);
