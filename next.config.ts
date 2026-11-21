import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,
  // Extra hosts allowed to load the dev server (comma separated), e.g. DEV_ORIGINS=my-box.local
  allowedDevOrigins: ["127.0.0.1", ...(process.env.DEV_ORIGINS?.split(",").filter(Boolean) ?? [])],
  // Pin the workspace root: a stray package.json/lockfile in a parent folder otherwise makes Turbopack pick that.
  turbopack: { root: path.resolve(__dirname) },
  // Dev only: forward /api/* (pageview analytics) to a local Astabyte API, e.g. API_PROXY_URL=http://localhost:8791.
  // In production nginx sends /api/analytics/collect to the API service.
  async rewrites() {
    const api = process.env.API_PROXY_URL;
    return api ? [{ source: "/api/:path*", destination: `${api}/api/:path*` }] : [];
  },
  // The Go + htmx port was dropped in 0.9.0; its guide now points at the HTML + CSS layer.
  async redirects() {
    return [
      { source: "/go", destination: "/css", permanent: true },
      // Blog posts folded into the techniques series.
      { source: "/blog/motion-that-feels-good", destination: "/blog/easing", permanent: true },
    ];
  },
  // Temporary CDN for the HTML + CSS layer (public/cdn, written by `bun run css`). The paths are unversioned, so keep
  // the cache short. No long stale-while-revalidate: Cloudflare kept serving the old file for hours with it (the VPS
  // in front already serves a stale copy when the homelab is down). Other sites load these files, so allow any origin.
  async headers() {
    return [
      {
        source: "/cdn/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=600, stale-while-revalidate=60" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
