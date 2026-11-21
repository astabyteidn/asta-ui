export type Group = "motion" | "web" | "basics";

export type CodeFile = { name: string; code: string };

/** A live demo a post embeds with `::demo <id>`. The component lives in `components/blog/demos/<slug>/`. */
export type DemoMeta = {
  /** Short label in the stage header, e.g. "ease-out vs ease-in-out vs linear". */
  title: string;
  /** One or two sentences with the numbers, shown under the code. */
  caption: string;
  /** The real code that drives the demo. First file shows first. */
  code: CodeFile[];
  /** Stage height in px. Default 320. */
  height?: number;
};

/**
 * A post. `body` is a small Markdown subset rendered by `components/blog/Prose.tsx`:
 * `## ` and `### ` headings, paragraphs, `- ` and `1. ` lists, fenced code blocks, inline `**bold**`, backtick code
 * and [links](/path), plus two directives on their own line:
 *   ::demo <id>    a live demo from `demos`
 *   ::live <slug>  a real kit component or lab block from this site
 */
export type Post = {
  slug: string;
  group: Group;
  /** Position inside its group: the learning path order. */
  order: number;
  title: string;
  summary: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tldr: string[];
  body: string;
  demos?: Record<string, DemoMeta>;
  /** Demo id to use as the card thumbnail on /blog. Defaults to the first demo. */
  thumb?: string;
};
