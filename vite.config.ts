import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

function authPopupPlugin() {
  return {
    name: "app-builder:auth-popup",
    apply: "serve" as const,
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0];
        if (pathOnly !== "/auth/popup" || (req.method ?? "GET").toUpperCase() !== "GET") {
          next();
          return;
        }
        try {
          const { handleAuthPopupRequest } = await server.ssrLoadModule(
            "/src/lib/auth/popup.server.ts",
          );
          const host = req.headers.host ?? "localhost:8080";
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const item of value) headers.append(key, item);
            } else {
              headers.set(key, value);
            }
          }
          const response = await handleAuthPopupRequest(
            new Request(`http://${host}${req.url}`, { method: "GET", headers }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          const cookies =
            typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
          for (const cookie of cookies) res.appendHeader("set-cookie", cookie);
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Sign-in popup failed");
          }
        }
      });
    },
  };
}

function pgliteBootstrapPlugin() {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve" as const,
    configureServer(server) {
      return async () => {
        const { ensureDbReady } = await server.ssrLoadModule("/src/lib/db.ts");
        await ensureDbReady();
      };
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    tsconfigPaths: true,
  },
  plugins: [
    grokPwaPlugin(),
    appEnvPlugin(),
    authPopupPlugin(),
    pgliteBootstrapPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: process.env.NETLIFY === "true" ? "netlify" : "vercel",
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));
