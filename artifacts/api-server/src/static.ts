import { injectAnalytics } from "./analytics-tag";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { injectSeoMeta } from "./seo";
import { storage } from "./storage";
import { APP_ROLE, isChildFacingPath } from "./role";

const KNOWN_ROUTES: RegExp[] = [
  /^\/aiforkids(?:\/.*)?$/,
  /^\/$/,
  /^\/about$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/delete-account$/,
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

  // index: false so "/" falls through to the handler below and gets the same
  // SEO meta and analytics injection as every other route.
  app.use(express.static(distPath, { index: false }));

  app.use("/{*path}", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      const pathname = req.originalUrl.split("?")[0];
      if (APP_ROLE !== "kids") html = await injectSeoMeta(req.originalUrl, html, storage);
      // injectAnalytics already skips /aiforkids; on the kids host nothing is
      // ever tagged, whatever the path.
      if (APP_ROLE !== "kids") html = injectAnalytics(html, req.originalUrl);
      const status = isKnownRoute(req.originalUrl) ? 200 : 404;
      const headers: Record<string, string> = { "Content-Type": "text/html" };
      if (APP_ROLE === "kids" || isChildFacingPath(pathname)) {
        headers["Referrer-Policy"] = "no-referrer";
        headers["X-Robots-Tag"] = /\/(studio|hub|facilitator)(\/|$)/.test(pathname) ? "noindex" : "all";
      }
      res.status(status).set(headers).end(html);
    } catch {
      const status = isKnownRoute(req.originalUrl) ? 200 : 404;
      res.status(status).sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
