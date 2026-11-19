import { BASE_SLUGS } from "@/lib/base-slugs";
import { useCases } from "@/lib/prompts";
import { uiItems } from "@/lib/ui-catalog";
import { variantItems } from "@/lib/variant-items";
import { VERSION } from "@/lib/version";

// Astabyte UI MCP server: Streamable HTTP, stateless, no auth, read-only. Every response comes from the deployed
// site, so agents connected here always see the current catalogue and skills (nothing to update on their side).
// The catalogue is bundled; component source and skill files are the site's own static routes, read over loopback
// because the standalone server doesn't ship the source tree.

export const dynamic = "force-dynamic";

const SITE = "https://ui.astabyte.com";
const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Json = Record<string, unknown>;
type Args = Record<string, unknown>;

const all = () => [
  ...uiItems.map((i) => ({ ...i, kind: i.source as "kit" | "lab" | "variant" })),
  ...variantItems.map((v) => ({ ...v, kind: "variant" as const })),
];
const page = (slug: string) => {
  const v = variantItems.find((x) => x.slug === slug);
  return v ? `${SITE}/${v.variant.base}#${v.id}` : `${SITE}/${slug}`;
};

async function self(path: string, origin: string): Promise<Response> {
  const bases = [process.env.ASTA_SELF_URL, process.env.PORT && `http://127.0.0.1:${process.env.PORT}`, origin, SITE].filter(Boolean) as string[];
  let last: unknown;
  for (const b of [...new Set(bases)]) {
    try {
      const res = await fetch(`${b}${path}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (res.ok) return res;
      last = new Error(`${path} returned ${res.status}`);
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error(`Could not load ${path}`);
}

const TOOLS = [
  {
    name: "search_components",
    title: "Search components",
    description:
      "Search the Astabyte UI catalogue (kit components, motion lab components and variants) by words in the name or description. Returns slugs to pass to get_component. Call with no query to list everything.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to match, e.g. 'price chart', 'checkout', 'toast'." },
        kind: { type: "string", enum: ["kit", "lab", "variant"], description: "Only this part of the catalogue." },
        limit: { type: "number", description: "Most results to return (default 30)." },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_component",
    title: "Get a component",
    description:
      "One component by slug: what it does, its page, the install commands for Radix or Base UI, its npm dependencies and (by default) the full source files from the shadcn registry.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Component slug from search_components, e.g. 'price-chart' or 'textarea-aui-003'." },
        primitive: { type: "string", enum: ["radix", "base"], description: "Headless library the project uses (default radix)." },
        include_source: { type: "boolean", description: "Include the source files (default true)." },
      },
      required: ["slug"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_setup",
    title: "Set up a project",
    description: "How to set up Astabyte UI in a React + Tailwind v4 project (registry or npm package), and the rules to follow when using or editing the components.",
    inputSchema: { type: "object", properties: { primitive: { type: "string", enum: ["radix", "base"] } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_design_guide",
    title: "Astabyte design guide",
    description:
      "The Astabyte design rules (colour, type, spacing, motion, copy). Without a surface it returns the overview; pass a surface for its full tokens and patterns: 'studio' (dark, lime, square), 'ui-kit' (white, one blue, soft corners) or 'app-ui' (dense dark editor chrome).",
    inputSchema: { type: "object", properties: { surface: { type: "string", enum: ["studio", "ui-kit", "app-ui"] } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_use_cases",
    title: "Example requests",
    description: "Typical product requests (a trading dashboard, a checkout, a settings page…) and the components that cover each one.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_skills",
    title: "Agent skills and updates",
    description:
      "The current Astabyte agent skills with content hashes and file URLs, plus the command that updates local copies. Use it to tell whether installed skills are out of date.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const text = (t: string) => ({ content: [{ type: "text", text: t }] });

async function callTool(name: string, args: Args, origin: string) {
  if (name === "search_components") {
    const q = String(args.query ?? "").toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    const limit = Math.min(200, Math.max(1, Number(args.limit) || 30));
    const rows = all().filter((i) => (!args.kind || i.kind === args.kind) && words.every((w) => `${i.slug} ${i.title} ${i.description} ${i.group}`.toLowerCase().includes(w)));
    const shown = rows.slice(0, limit);
    if (!shown.length) return text(`No components match "${q}". Try fewer words, or call search_components with no query for the full list.`);
    return text(
      [
        `${rows.length} match${rows.length === 1 ? "" : "es"}${rows.length > shown.length ? ` (showing ${shown.length})` : ""}. Astabyte UI v${VERSION}.`,
        "",
        ...shown.map((i) => `- \`${i.slug}\` ${i.title} (${i.kind}, ${i.group.replace("Motion · ", "motion: ")}${BASE_SLUGS.includes(i.slug) ? ", Radix + Base UI" : ""}): ${i.description}`),
      ].join("\n"),
    );
  }

  if (name === "get_component") {
    const slug = String(args.slug ?? "").trim();
    const it = all().find((i) => i.slug === slug);
    if (!it) {
      const near = all().filter((i) => i.slug.includes(slug) || slug.includes(i.slug)).slice(0, 5).map((i) => i.slug);
      return { ...text(`Unknown component "${slug}".${near.length ? ` Did you mean ${near.join(", ")}?` : ""} Use search_components to find slugs.`), isError: true };
    }
    const base = args.primitive === "base";
    const flag = base ? " --base" : "";
    const lines = [
      `# ${it.title} (\`${it.slug}\`)`,
      "",
      it.description,
      "",
      `Page and usage example: ${page(it.slug)}`,
      BASE_SLUGS.includes(it.slug) ? "Comes in a Radix and a Base UI build with the same props and motion." : "No headless primitives: the same file works with Radix or Base UI projects.",
      "",
      "## Install",
      "",
      "```sh",
      `npx asta-ui@latest add ${it.slug}${flag}`,
      `# or: npx shadcn@latest add ${SITE}/r/${base ? "base/" : ""}${it.slug}.json`,
      "```",
      "",
      `Files land in \`components/astabyte/\`. Or with the npm package: \`import { … } from "asta-ui${base ? "/base" : ""}/${it.slug}"\`.`,
    ];
    if (args.include_source !== false) {
      const item = (await (await self(`/r/${base ? "base/" : ""}${it.slug}.json`, origin)).json()) as {
        dependencies?: string[];
        registryDependencies?: string[];
        files?: { path: string; content?: string }[];
      };
      if (item.dependencies?.length) lines.push("", `npm dependencies: ${item.dependencies.join(", ")}`);
      if (item.registryDependencies?.length) lines.push(`Registry dependencies: ${item.registryDependencies.join(", ")}`);
      for (const f of item.files ?? []) lines.push("", `## ${f.path}`, "", "```tsx", (f.content ?? "").trimEnd(), "```");
    }
    return text(lines.join("\n"));
  }

  if (name === "get_setup") {
    const base = args.primitive === "base";
    return text(`# Set up Astabyte UI (v${VERSION})

Any React 19 + Tailwind CSS v4 project (Next.js, Vite, React Router, Astro islands, TanStack Start).

## Registry (the project owns the source)

\`\`\`sh
npx asta-ui@latest init${base ? " --base" : ""}      # runs shadcn init if needed, adds the @astabyte registry
npx asta-ui@latest add <slug> [<slug>...]
\`\`\`

## npm package (the project takes updates)

\`\`\`sh
npm i asta-ui ${base ? "@base-ui/react" : "radix-ui"}
\`\`\`

\`\`\`css
@import "tailwindcss";
@import "asta-ui/styles.css";
\`\`\`

\`\`\`tsx
import { Dialog, PriceChart } from "asta-ui${base ? "/base" : ""}";
\`\`\`

## Rules

- Colour tokens only (paper, paper-2, ink, ink-2, mute, brand, signal), never hard-coded colours. Rebrand by remapping tokens.
- One accent. In market UI, up = accent and down = neutral unless the user asks for green/red.
- Animate transform and opacity only, ease cubic-bezier(.16,1,.3,1) or springs, honour prefers-reduced-motion.
- Keep pointer, touch and keyboard support and the focus rings.
- One headless library per project: every component with the same build.
- Fake data and fake brands in demos.

Full catalogue: ${SITE}/llms.txt`);
  }

  if (name === "get_design_guide") {
    const s = typeof args.surface === "string" && ["studio", "ui-kit", "app-ui"].includes(args.surface) ? args.surface : null;
    const md = await (await self(`/skills/astabyte-design/${s ? `references/${s}.md` : "SKILL.md"}`, origin)).text();
    return text(md);
  }

  if (name === "get_use_cases") {
    return text(useCases.map((c) => `- **${c.title}**: ${c.description} Components: ${c.slugs.map((x) => `\`${x}\``).join(", ")}.`).join("\n"));
  }

  if (name === "get_skills") {
    const m = (await (await self("/skills.json", origin)).json()) as { version: string; update: string; skills: { name: string; hash: string; description: string; files: { url: string }[] }[] };
    return text(
      [
        `Astabyte agent skills, v${m.version}. Update every installed copy that changed:`,
        "",
        "```sh",
        `${m.update} --quiet`,
        "```",
        "",
        "Turn on automatic updates at the start of each Claude Code session: `npx -y asta-ui@latest skills auto`.",
        "",
        ...m.skills.map((s) => `- **${s.name}** (hash ${s.hash}): ${s.description}\n  Files: ${s.files.map((f) => f.url).join(", ")}`),
      ].join("\n"),
    );
  }

  return null;
}

async function handle(msg: Json, origin: string): Promise<Json | null> {
  const id = msg.id as string | number | undefined;
  const method = msg.method as string | undefined;
  const params = (msg.params ?? {}) as Json;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

  if (msg.jsonrpc !== "2.0" || typeof method !== "string") return id === undefined ? null : fail(-32600, "Invalid request");
  if (id === undefined) return null; // notifications (initialized, cancelled) need no answer

  switch (method) {
    case "initialize": {
      const asked = String(params.protocolVersion ?? "");
      return ok({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "astabyte-ui", title: "Astabyte UI", version: VERSION, websiteUrl: SITE },
        instructions:
          "Astabyte UI: motion-first React + Tailwind v4 components. Find components with search_components, read one (install command + source) with get_component, set up a project with get_setup, and follow get_design_guide when designing around them. This server always serves the live catalogue.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      try {
        const res = await callTool(String(params.name ?? ""), (params.arguments ?? {}) as Args, origin);
        return res ? ok(res) : fail(-32602, `Unknown tool: ${String(params.name)}`);
      } catch (e) {
        return ok({ ...text(`Failed: ${e instanceof Error ? e.message : String(e)}`), isError: true });
      }
    }
    case "resources/list":
      return ok({ resources: [] });
    case "prompts/list":
      return ok({ prompts: [] });
    default:
      return fail(-32601, `Method not found: ${method}`);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS });
  }
  const origin = new URL(req.url).origin;
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as Json[];
  const out = (await Promise.all(msgs.map((m) => handle(m && typeof m === "object" ? m : {}, origin)))).filter((r) => r !== null);
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return Response.json(batch ? out : out[0], { headers: CORS });
}

export function GET() {
  // No server-initiated stream: this server only answers requests.
  return new Response("Astabyte UI MCP server. Connect with an MCP client over Streamable HTTP (POST).", { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
