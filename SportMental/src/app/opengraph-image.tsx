import { ImageResponse } from "next/og";

export const alt = "Sport Mental — Ton meilleur jeu commence dans ta tête.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #f5faf6 0%, #e6f3ea 60%, #bfe8d0 100%)",
          color: "#14261c",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="31" fill="#1f5f3f" />
            <circle cx="32" cy="32" r="21" fill="none" stroke="#bfe8d0" strokeWidth="4.5" />
            <circle cx="32" cy="32" r="11" fill="none" stroke="#7fd3a8" strokeWidth="4.5" />
            <circle cx="32" cy="32" r="4" fill="#fff" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#1f5f3f" }}>Sport Mental</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 48, lineHeight: 1.1 }}>
          Ton meilleur jeu commence dans ta tête.
        </div>
        <div style={{ fontSize: 34, marginTop: 28, color: "#4a5f53" }}>
          Préparation mentale pour le padel, le volley et les sports de match.
        </div>
      </div>
    ),
    size,
  );
}
