import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * En local (« npm run dev »), sert /api/* avec le même code que sur Vercel ;
 * les données vont dans .donnees-dev.json (chiffré). Mot de passe admin : APP_PASSWORD (par défaut « admin123 »).
 */
function apiLocale(): Plugin {
  return {
    name: "api-locale",
    apply: "serve",
    configureServer(serveur) {
      process.env.APP_PASSWORD ??= "admin123";
      serveur.middlewares.use(async (req, res, suite) => {
        if (!req.url?.startsWith("/api/")) return suite();
        try {
          const corps = await new Promise<Buffer>((ok) => {
            const morceaux: Buffer[] = [];
            req.on("data", (m) => morceaux.push(m)).on("end", () => ok(Buffer.concat(morceaux)));
          });
          const url = new URL(`http://${req.headers.host}${req.url}`);
          const requete = new Request(url, {
            method: req.method, headers: req.headers as Record<string, string>,
            body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : corps,
          });
          const { traiter, cheminDe } = await serveur.ssrLoadModule("/serveur/api.ts");
          const reponse: Response = await traiter(requete, cheminDe(url.pathname.slice(5)));
          res.statusCode = reponse.status;
          reponse.headers.forEach((v, k) => k !== "set-cookie" && res.setHeader(k, v));
          const cookies = reponse.headers.getSetCookie();
          if (cookies.length) res.setHeader("set-cookie", cookies);
          res.end(Buffer.from(await reponse.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ erreur: "Erreur du serveur" }));
        }
      });
    },
  };
}

// pas de « source maps » en ligne : le code d'origine n'est pas publié
export default defineConfig({ plugins: [react(), apiLocale()], build: { sourcemap: false } });
