import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import CodeTabs from "@/components/ui-site/CodeTabs";
import FrameworkTabs from "@/components/ui-site/FrameworkTabs";
import InstallCommand from "@/components/ui-site/InstallCommand";
import { highlight } from "@/lib/ui-highlight";
import { getTokensCss } from "@/lib/ui-source";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "Installation",
  description: "Add Astabyte UI to Next.js, Vite, React Router, Astro, TanStack Start, Gatsby or any React project with Tailwind CSS v4.",
};

const SITE = "https://ui.astabyte.com";

// ---- package-manager variants of one command ----

type Pm = "npm" | "pnpm" | "bun" | "yarn";
type Cmd = Record<Pm, string>;
const PMS: Pm[] = ["npm", "pnpm", "bun", "yarn"];

/** Run a package binary once (npx …). */
const x = (c: string): Cmd => ({ npm: `npx ${c}`, pnpm: `pnpm dlx ${c}`, bun: `bunx --bun ${c}`, yarn: `yarn dlx ${c}` });
/** Install packages. */
const add = (pkgs: string, dev = false): Cmd => ({
  npm: `npm install ${dev ? "-D " : ""}${pkgs}`,
  pnpm: `pnpm add ${dev ? "-D " : ""}${pkgs}`,
  bun: `bun add ${dev ? "-d " : ""}${pkgs}`,
  yarn: `yarn add ${dev ? "-D " : ""}${pkgs}`,
});
/** `npm create <pkg> <dir> [flags]`: npm needs `--` before the starter's flags. */
const create = (pkg: string, args: string): Cmd => ({
  npm: `npm create ${pkg} ${args.replace(/^(\S+) (.+)$/, "$1 -- $2")}`,
  pnpm: `pnpm create ${pkg} ${args}`,
  bun: `bun create ${pkg} ${args}`,
  yarn: `yarn create ${pkg} ${args}`,
});
const join = (...cmds: Cmd[]): Cmd => Object.fromEntries(PMS.map((p) => [p, cmds.map((c) => c[p]).join("\n")])) as Cmd;

let uid = 0;
async function shell(cmd: Cmd) {
  const id = ++uid;
  return Promise.all(PMS.map(async (p) => ({ name: p, path: `${id}-${p}`, code: cmd[p], html: await highlight(cmd[p], "x.sh") })));
}
async function file(name: string, code: string) {
  const lang = name.endsWith(".css") ? "x.css" : "x.tsx";
  return [{ name, path: `${++uid}-${name}`, code, html: await highlight(code, lang) }];
}

type Step = { title: string; text?: ReactNode; cmd?: Cmd; file?: [string, string] };

async function steps(list: Step[]) {
  const blocks = await Promise.all(list.map((s) => (s.cmd ? shell(s.cmd) : s.file ? file(...s.file) : null)));
  return (
    <ol className="flex flex-col gap-8">
      {list.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[28px_1fr] gap-x-3">
          <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-[6px] bg-paper-2 font-mono text-[11px] tabular-nums text-ink">{i + 1}</span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium tracking-[-0.01em] text-ink">{s.title}</h3>
            {s.text && <p className="mt-1.5 text-[15px] leading-[1.65] text-ink-2">{s.text}</p>}
            {blocks[i] && (
              <div className="mt-3">
                <CodeTabs files={blocks[i]} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---- shared steps ----

const INIT: Step = {
  title: "Set up shadcn",
  text: (
    <>
      Creates <code>components.json</code> and the base CSS variables. Pick any base colour: our components bring their own tokens.
    </>
  ),
  cmd: x("shadcn@latest init"),
};
const ADD: Step = {
  title: "Add components",
  text: (
    <>
      Files land in <code>components/astabyte/</code>, npm dependencies are installed and the tokens are merged into your CSS.
    </>
  ),
  cmd: x(`shadcn@latest add ${SITE}/r/button.json ${SITE}/r/price-chart.json`),
};

const TSCONFIG = `{
  "compilerOptions": {
    // TypeScript 6+ dropped baseUrl: paths resolve from this file.
    "paths": { "@/*": ["./src/*"] }
  }
}`;

const USAGE = `import { Button } from "@/components/astabyte/button";
import PriceChart from "@/components/astabyte/price-chart";

export default function Page() {
  return (
    <main className="dark bg-paper p-8 text-ink">
      <Button variant="accent">Deploy</Button>
      <div className="mt-6 aspect-[4/3] max-w-md [container-type:size]">
        <PriceChart />
      </div>
    </main>
  );
}`;
const usage = (name: string) => USAGE.replace("export default function Page", `export default function ${name}`);

export default async function Installation() {
  const frameworks: { id: string; label: string; steps: Step[] }[] = [
    {
      id: "next",
      label: "Next.js",
      steps: [
        {
          title: "Create a project",
          text: (
            <>
              The default starter already has TypeScript, Tailwind CSS v4 and the <code>@/*</code> alias. Skip this in an existing app.
            </>
          ),
          cmd: x("create-next-app@latest my-app --yes"),
        },
        INIT,
        ADD,
        {
          title: "Use it",
          text: (
            <>
              Interactive components start with <code>&quot;use client&quot;</code>, so you can render them straight from a Server Component.
            </>
          ),
          file: ["app/page.tsx", USAGE],
        },
      ],
    },
    {
      id: "vite",
      label: "Vite",
      steps: [
        { title: "Create a project", cmd: create("vite@latest", "my-app --template react-ts") },
        { title: "Add Tailwind CSS", cmd: join(add("tailwindcss @tailwindcss/vite"), add("@types/node", true)) },
        {
          title: "Import Tailwind",
          text: (
            <>
              Replace the contents of <code>src/index.css</code>.
            </>
          ),
          file: ["src/index.css", `@import "tailwindcss";`],
        },
        {
          title: "Add the @ alias to TypeScript",
          text: (
            <>
              Add <code>paths</code> to both <code>tsconfig.json</code> and <code>tsconfig.app.json</code>.
            </>
          ),
          file: ["tsconfig.app.json", TSCONFIG],
        },
        {
          title: "Configure Vite",
          file: [
            "vite.config.ts",
            `import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});`,
          ],
        },
        INIT,
        ADD,
        { title: "Use it", file: ["src/App.tsx", usage("App")] },
      ],
    },
    {
      id: "react-router",
      label: "React Router",
      steps: [
        {
          title: "Create a project",
          text: (
            <>
              Framework mode ships with Tailwind CSS v4 and the <code>~/*</code> alias. The CLI rewrites our imports to match.
            </>
          ),
          cmd: x("create-react-router@latest my-app"),
        },
        INIT,
        ADD,
        { title: "Use it", file: ["app/routes/home.tsx", usage("Home").replaceAll("@/components", "~/components")] },
      ],
    },
    {
      id: "astro",
      label: "Astro",
      steps: [
        { title: "Create a project", cmd: create("astro@latest", "my-app") },
        { title: "Add React and Tailwind CSS", cmd: x("astro add react tailwind") },
        {
          title: "Add the @ alias",
          file: ["tsconfig.json", TSCONFIG.replace('{\n  "compilerOptions"', '{\n  "extends": "astro/tsconfigs/strict",\n  "compilerOptions"')],
        },
        INIT,
        ADD,
        {
          title: "Use it",
          text: (
            <>
              Components are interactive, so hydrate them with a <code>client:</code> directive. <code>client:visible</code> loads each one as it
              scrolls in.
            </>
          ),
          file: [
            "src/pages/index.astro",
            `---
import "@/styles/global.css";
import { Button } from "@/components/astabyte/button";
import PriceChart from "@/components/astabyte/price-chart";
---

<main class="dark bg-paper p-8 text-ink">
  <Button client:load variant="accent">Deploy</Button>
  <div class="mt-6 aspect-[4/3] max-w-md [container-type:size]">
    <PriceChart client:visible />
  </div>
</main>`,
          ],
        },
      ],
    },
    {
      id: "tanstack",
      label: "TanStack Start",
      steps: [
        {
          title: "Create a project",
          text: (
            <>
              Choose Tailwind CSS when the starter asks. It sets up the <code>@/*</code> alias for you.
            </>
          ),
          cmd: create("@tanstack/start@latest", "my-app"),
        },
        INIT,
        ADD,
        {
          title: "Use it",
          file: [
            "src/routes/index.tsx",
            `import { createFileRoute } from "@tanstack/react-router";
${USAGE.split("\n").slice(0, 2).join("\n")}

export const Route = createFileRoute("/")({ component: Home });

${USAGE.split("\n").slice(3).join("\n").replace("export default function Page", "function Home")}`,
          ],
        },
      ],
    },
    {
      id: "gatsby",
      label: "Gatsby",
      steps: [
        { title: "Create a project", cmd: x("gatsby new my-app") },
        { title: "Add Tailwind CSS", cmd: add("tailwindcss @tailwindcss/postcss postcss gatsby-plugin-postcss") },
        {
          title: "Configure PostCSS",
          text: (
            <>
              Add <code>&quot;gatsby-plugin-postcss&quot;</code> to <code>plugins</code> in <code>gatsby-config</code>, then create the PostCSS
              config.
            </>
          ),
          file: ["postcss.config.js", `module.exports = {\n  plugins: { "@tailwindcss/postcss": {} },\n};`],
        },
        {
          title: "Import Tailwind",
          text: (
            <>
              Create <code>src/styles/globals.css</code> and import it from <code>gatsby-browser.tsx</code>.
            </>
          ),
          file: ["src/styles/globals.css", `@import "tailwindcss";`],
        },
        {
          title: "Add the @ alias",
          text: (
            <>
              Add the same <code>paths</code> to <code>tsconfig.json</code>, then point webpack at it.
            </>
          ),
          file: [
            "gatsby-node.ts",
            `import path from "node:path";
import type { GatsbyNode } from "gatsby";

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  });
};`,
          ],
        },
        INIT,
        ADD,
        { title: "Use it", file: ["src/pages/index.tsx", usage("Index")] },
      ],
    },
    {
      id: "manual",
      label: "Manual",
      steps: [
        {
          title: "Have React and Tailwind CSS v4",
          text: <>Any bundler works. Components are plain React with Tailwind classes: no framework imports, no runtime styling library.</>,
        },
        {
          title: "Add the tokens",
          text: (
            <>
              Paste this into your main stylesheet. Components read <code>paper</code>, <code>ink</code>, <code>mute</code>, <code>signal</code> and{" "}
              <code>brand</code>.
            </>
          ),
          file: ["globals.css", await getTokensCss()],
        },
        {
          title: "Copy the component",
          text: (
            <>
              Open a component page, copy every file from the Code tab and install the packages it lists. The raw files are also in{" "}
              <code>{`${SITE}/r/<name>.json`}</code>.
            </>
          ),
        },
        { title: "Use it", file: ["page.tsx", USAGE] },
      ],
    },
  ];

  const tabs = await Promise.all(frameworks.map(async (f) => ({ id: f.id, label: f.label, content: await steps(f.steps) })));

  return (
    <DocPage
      title="Installation"
      lead="Any React project with Tailwind CSS v4 can take these components. The files have no framework imports, so they run the same in Next.js, Vite, Astro and the rest. Interactive components are built on Radix primitives (the radix-ui package, installed for you) for focus, keyboard and screen-reader behaviour; the look and motion are ours."
      toc={[
        { id: "frameworks", title: "Pick your framework" },
        { id: "add", title: "Add a component" },
        { id: "tokens", title: "Tokens and dark mode" },
        { id: "agents", title: "Use it with an AI agent" },
      ]}
      next={{ href: "/button", title: "Button" }}
    >
      <h2 id="frameworks">Pick your framework</h2>
      <p>Already have shadcn set up? Skip straight to adding a component.</p>
      <FrameworkTabs tabs={tabs} />

      <h2 id="add">Add a component</h2>
      <p>Point the CLI at a component&rsquo;s registry URL. Every component page shows its own command.</p>
      <div className="not-prose my-6">
        <InstallCommand url={`${SITE}/r/dial-knob.json`} />
      </div>
      <p>
        The full index lives at <code>{`${SITE}/r/registry.json`}</code>. To use short names like <code>@astabyte/button</code>, add the registry to{" "}
        <code>components.json</code> as shown on the <Link href="/skill">AI agents</Link> page.
      </p>

      <h2 id="tokens">Tokens and dark mode</h2>
      <p>
        Components read five colours: <code>paper</code> (ground), <code>ink</code> (text), <code>mute</code> (secondary), <code>signal</code>{" "}
        (strong contrast) and <code>brand</code> (the one blue). <code>brand</code> has its own name so it never clashes with shadcn&rsquo;s{" "}
        <code>accent</code>. Change the variables and every component follows.
      </p>
      <p>
        <code>:root</code> holds the light palette and <code>.dark</code> the dark one. The motion blocks are designed on dark surfaces, so put them
        inside an element with the <code>dark</code> class.
      </p>

      <h2 id="agents">Use it with an AI agent</h2>
      <p>
        Claude Code, Cursor, Codex and other agents can pick, install and use the right component with the same rules we follow. Set it up on the{" "}
        <Link href="/skill">AI agents</Link> page, or copy a ready-made prompt from <Link href="/prompts">Prompts</Link>. Every component page also
        has a <strong>Copy prompt</strong> button.
      </p>
    </DocPage>
  );
}
