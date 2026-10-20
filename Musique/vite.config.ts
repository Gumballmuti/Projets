import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * En local (« npm run dev »), sert /api/* avec la même fonction que sur Netlify,
 * Netlify Blobs étant remplacé par un fichier. Mot de passe admin : APP_PASSWORD (par défaut « admin123 »).
 */
function apiLocale(): Plugin {
  return {
    name: "api-locale",
    apply: "serve",
    configureServer(serveur) {
      (globalThis as any).Netlify = {
        env: { get: (cle: string) => process.env[cle] ?? (cle === "APP_PASSWORD" ? "admin123" : undefined) },
        context: null,
      };
      serveur.middlewares.use(async (req, res, suite) => {
        if (!req.url?.startsWith("/api/")) return suite();
        try {
          const corps = await new Promise<Buffer>((ok) => {
            const morceaux: Buffer[] = [];
            req.on("data", (m) => morceaux.push(m)).on("end", () => ok(Buffer.concat(morceaux)));
          });
          const requete = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method, headers: req.headers as Record<string, string>,
            body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : corps,
          });
          const { default: api } = await serveur.ssrLoadModule("/netlify/functions/api.mts");
          const reponse: Response = await api(requete, {});
          res.statusCode = reponse.status;
          reponse.headers.forEach((v, k) => k !== "set-cookie" && res.setHeader(k, v));
          const cookies = reponse.headers.getSetCookie();
          if (cookies.length) res.setHeader("set-cookie", cookies);
          res.end(Buffer.from(await reponse.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ erreur: String(e) }));
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), apiLocale()],
  resolve: command === "serve"
    ? { alias: { "@netlify/blobs": fileURLToPath(new URL("./dev/blobs-memoire.mts", import.meta.url)) } }
    : {},
}));
