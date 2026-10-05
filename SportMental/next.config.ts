import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// `npm run build:static` : export 100 % statique (dossier out/) pour Cloudflare Pages, Netlify ou tout hébergeur statique.
// Les en-têtes de sécurité sont alors fournis par public/_headers.
const isStaticExport = process.env.STATIC_EXPORT === "1";

// CSP volontairement simple : tout est servi par le site lui-même, aucun service tiers.
// 'unsafe-inline' est nécessaire pour les scripts d'hydratation des pages statiques Next.js.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Version de build : sert au service worker pour savoir quand rafraîchir son cache.
  env: { APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || String(Date.now()) },
  poweredByHeader: false,
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export" as const, images: { unoptimized: true } } : { headers }),
};

async function headers() {
  return [
    { source: "/:path*", headers: securityHeaders },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ];
}

export default nextConfig;
