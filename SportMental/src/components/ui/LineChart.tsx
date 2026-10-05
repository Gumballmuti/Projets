"use client";

import { useState } from "react";

type Point = { label: string; value: number };

type LineChartProps = {
  title: string;
  points: Point[];
  min?: number;
  max?: number;
};

const W = 320;
const H = 120;
const PAD = { top: 12, right: 12, bottom: 12, left: 26 };

/**
 * Courbe SVG maison (une seule série, un seul axe 1-10).
 * Survol / focus clavier : infobulle avec la date et la note. Tableau des valeurs en dessous.
 */
export function LineChart({ title, points, min = 1, max = 10 }: LineChartProps) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const current = active !== null ? points[active] : undefined;

  return (
    <figure className="flex flex-col gap-1">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`${title} : ${points.map((p) => `${p.label} ${p.value}`).join(", ")}`}
          onMouseLeave={() => setActive(null)}
        >
          {[min, Math.round((min + max) / 2), max].map((g) => (
            <g key={g}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--muted)">
                {g}
              </text>
            </g>
          ))}
          {current && active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 3" />
          )}
          {points.length > 1 && (
            <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={active === i ? 5.5 : 4}
                fill="var(--primary)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
              {/* Zone de survol plus large que le point */}
              <rect
                x={x(i) - (points.length > 1 ? innerW / (points.length - 1) / 2 : innerW / 2)}
                y={0}
                width={points.length > 1 ? innerW / (points.length - 1) : innerW}
                height={H}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.label} : ${p.value} sur ${max}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onTouchStart={() => setActive(i)}
                className="outline-none"
              />
            </g>
          ))}
        </svg>
        {current && active !== null && (
          <div
            className="pointer-events-none absolute -top-2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink shadow-card"
            style={{ left: `${Math.min(85, Math.max(15, (x(active) / W) * 100))}%`, transform: "translate(-50%, -100%)" }}
          >
            <span className="text-muted">{current.label}</span> · <strong>{current.value}</strong>/{max}
          </div>
        )}
      </div>
      <details className="text-sm text-muted">
        <summary className="inline-flex min-h-12 cursor-pointer items-center">Voir les valeurs</summary>
        <table className="mt-1 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col" className="py-1 font-medium">Match</th>
              <th scope="col" className="py-1 text-right font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1">{p.label}</td>
                <td className="py-1 text-right tabular-nums text-ink">{p.value}/{max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
