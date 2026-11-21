import type { Group, Post } from "./types";
import buttonSizes from "./posts/button-and-touch-target-sizes";
import containerQueries from "./posts/container-queries";
import durationAndDistance from "./posts/duration-and-distance";
import easing from "./posts/easing";
import emptyStates from "./posts/empty-loading-error-states";
import flip from "./posts/flip";
import fluidType from "./posts/fluid-type";
import hasSelector from "./posts/has-selector";
import hierarchy from "./posts/hierarchy-in-dense-ui";
import scrollDriven from "./posts/scroll-driven-animation";
import smoothOnPhones from "./posts/smooth-on-phones";
import springs from "./posts/springs";
import stagger from "./posts/stagger";
import startingStyle from "./posts/starting-style";
import viewTransitions from "./posts/view-transitions";

export type { CodeFile, DemoMeta, Group, Post } from "./types";

export const GROUPS: { id: Group; title: string; lead: string }[] = [
  { id: "motion", title: "Motion techniques", lead: "Curves, timing, springs and layout. How to make movement feel right and stay smooth." },
  { id: "web", title: "Web techniques", lead: "Newer CSS and browser APIs that replace a lot of JavaScript, each with a fallback." },
  { id: "basics", title: "Basics", lead: "Sizing, hierarchy and states. The ground rules the techniques build on." },
];

const all: Post[] = [
  easing,
  durationAndDistance,
  springs,
  stagger,
  flip,
  scrollDriven,
  startingStyle,
  viewTransitions,
  fluidType,
  containerQueries,
  hasSelector,
  smoothOnPhones,
  buttonSizes,
  hierarchy,
  emptyStates,
];

/** The learning path: group by group, in order. */
export const POSTS = GROUPS.flatMap((g) => all.filter((p) => p.group === g.id).sort((a, b) => a.order - b.order));

export const postsIn = (g: Group) => POSTS.filter((p) => p.group === g);

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);

/** Specimen id for a post, by its place in the path: AB-B01, AB-B02… */
export const postId = (p: Post) => `AB-B${String(POSTS.indexOf(p) + 1).padStart(2, "0")}`;

/** Plain text of a body: no code blocks or directives. For word counts. */
export const plainText = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^::\w+.*$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*#]/g, "")
    .replace(/^\s*(-|\d+\.)\s+/gm, "");

export const wordCount = (p: Post) => plainText(`${p.tldr.join(" ")} ${p.body}`).split(/\s+/).filter(Boolean).length;

/** Minutes to read at about 230 words a minute, plus a little for each demo. */
export const readingTime = (p: Post) => Math.max(1, Math.round(wordCount(p) / 230 + Object.keys(p.demos ?? {}).length * 0.25));

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Block =
  | { t: "h2" | "h3"; text: string; id: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "code"; lang: string; code: string }
  | { t: "demo"; id: string }
  | { t: "live"; slug: string };

/** Splits a body into blocks, line by line. */
export function parse(md: string): Block[] {
  const out: Block[] = [];
  const lines = md.trim().split("\n");
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join(" ") });
    if (list) out.push(list);
    para = [];
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("```")) {
      flush();
      const lang = line.slice(3).trim() || "txt";
      const body: string[] = [];
      // Keep the code's own indentation: read the raw lines.
      while (++i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i]);
      out.push({ t: "code", lang, code: body.join("\n") });
      continue;
    }
    if (!line) {
      flush();
      continue;
    }
    const directive = /^::(demo|live)\s+([\w-]+)$/.exec(line);
    if (directive) {
      flush();
      out.push(directive[1] === "demo" ? { t: "demo", id: directive[2] } : { t: "live", slug: directive[2] });
      continue;
    }
    const h = /^(##|###)\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push({ t: h[1] === "##" ? "h2" : "h3", text: h[2], id: slugify(h[2]) });
      continue;
    }
    const ul = /^-\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      const t = ul ? "ul" : "ol";
      if (para.length || (list && list.t !== t)) flush();
      list ??= { t, items: [] };
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (list) flush();
    para.push(line);
  }
  flush();
  return out;
}

export const tocOf = (p: Post) => [
  { id: "tldr", title: "TL;DR" },
  ...parse(p.body).flatMap((b) => (b.t === "h2" ? [{ id: b.id, title: b.text }] : [])),
];
