/** Logo de l'app : un disque vert et trois ondes (dessin original). */
export default function Logo({ taille = 32 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="var(--accent)" />
      <g fill="#000">
        <rect x="8" y="13" width="3.2" height="8" rx="1.6" />
        <rect x="14.4" y="8" width="3.2" height="16" rx="1.6" />
        <rect x="20.8" y="11" width="3.2" height="11" rx="1.6" />
      </g>
    </svg>
  );
}
