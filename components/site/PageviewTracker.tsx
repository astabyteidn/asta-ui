"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Sends one cookieless pageview to the Rust API on every navigation (client-side included).
// The referrer and UTM tags are only sent with the first page of a visit. /cms is not counted;
// the API also drops bots and internal paths.
/** `prefix` namespaces paths from another host, e.g. "/ui" for ui.astabyte.com. */
export default function PageviewTracker({ prefix = "" }: { prefix?: string }) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/cms")) return;
    const isFirst = first.current;
    first.current = false;
    const q = new URLSearchParams(window.location.search);
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: !prefix || pathname.startsWith(prefix) ? pathname : prefix + (pathname === "/" ? "" : pathname),
        referrer: isFirst ? document.referrer : "",
        utm_source: isFirst ? q.get("utm_source") || q.get("ref") || undefined : undefined,
        utm_campaign: isFirst ? q.get("utm_campaign") || undefined : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, prefix]);

  return null;
}
