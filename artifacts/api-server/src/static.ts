import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { injectSeoMeta } from "./seo";
import { storage } from "./storage";

const KNOWN_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/about$/,
  /^\/about\/board\/[^/]+$/,
  /^\/programs$/,
  /^\/training$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/events$/,
  /^\/ai-hub$/,
  /^\/contact$/,
  /^\/donate$/,
  /^\/login$/,
  /^\/signup$/,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/author\/dashboard$/,
  /^\/author\/posts\/new$/,
  /^\/author\/posts\/[^/]+\/edit$/,
  /^\/profile\/[^/]+$/,
];

function isKnownRoute(urlPath: string): boolean {
  const pathname = urlPath.split("?")[0].replace(/\/+$/, "") || "/";
  return KNOWN_ROUTES.some(re => re.test(pathname));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }
    console.warn(`[static] ${distPath} not found — skipping static site serving (dev mode)`);
    return;
  }

  app.use(express.static(distPath));

  app.use("/{*path}", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      html = await injectSeoMeta(req.originalUrl, html, storage);
      const status = isKnownRoute(req.originalUrl) ? 200 : 404;
      res.status(status).set({ "Content-Type": "text/html" }).end(html);
    } catch {
      const status = isKnownRoute(req.originalUrl) ? 200 : 404;
      res.status(status).sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
