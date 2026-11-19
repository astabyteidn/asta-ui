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
  // Temporary CDN for the HTML + CSS layer (public/cdn, written by `bun run css`). The paths are unversioned, so keep
  // the cache short; other sites load these files, so allow any origin.
  async headers() {
    return [
      {
        source: "/cdn/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
