import type { ReactNode } from "react";
import { DemoStill } from "@/components/blog/DemoFrame";
import { DEMOS } from "@/components/blog/demos";
import { Live, LiveSlot } from "@/components/ui-site/Live";
import { parse, type Post } from "@/lib/blog";
import { uiItems } from "@/lib/ui-catalog";


/** The card thumbnail for a post: its first demo, or the first kit or lab item it embeds. */
export function thumbOf(p: Post): { thumb: ReactNode; tone: "light" | "dark" } {
  const first = p.thumb ?? Object.keys(p.demos ?? {})[0];
  const Demo = first ? DEMOS[p.slug]?.[first] : undefined;
  if (Demo) {
    return {
      tone: "light",
      thumb: (
        <LiveSlot>
          <DemoStill>
            <Demo />
          </DemoStill>
        </LiveSlot>
      ),
    };
  }
  const live = parse(p.body).find((b) => b.t === "live");
  const slug = live?.t === "live" ? live.slug : undefined;
  const item = slug ? uiItems.find((i) => i.slug === slug) : undefined;
  if (!slug || !item) return { tone: "light", thumb: null };
  return { tone: item.source === "lab" ? "dark" : "light", thumb: <Live slug={slug} /> };
}
