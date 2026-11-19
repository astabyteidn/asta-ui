import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import CodeTabs from "@/components/ui-site/CodeTabs";
import FrameworkTabs from "@/components/ui-site/FrameworkTabs";
import InstallCommand from "@/components/ui-site/InstallCommand";
import { ByPrimitive, PrimitiveSwitch } from "@/components/ui-site/Primitive";
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
const PMS: Pm[] = ["pnpm", "npm", "bun", "yarn"];

/** Run a package binary once (npx …). */
const x = (c: string): Cmd => ({ npm: `npx ${c}`, pnpm: `pnpm dlx ${c}`, bun: `bunx --bun ${c}`, yarn: `yarn dlx ${c}` });
/** Run our CLI once (npx asta-ui@latest …). */
const asta = (c: string): Cmd => ({ npm: `npx asta-ui@latest ${c}`, pnpm: `pnpm dlx asta-ui@latest ${c}`, bun: `bunx asta-ui@latest ${c}`, yarn: `yarn dlx asta-ui@latest ${c}` });
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

/** `cmdBase`: the same step for a Base UI project, shown when Base UI is the picked primitive. */
type Step = { title: string; text?: ReactNode; cmd?: Cmd; cmdBase?: Cmd; file?: [string, string] };

async function steps(list: Step[]) {
  const blocks = await Promise.all(list.map((s) => (s.cmd ? shell(s.cmd) : s.file ? file(...s.file) : null)));
  const bases = await Promise.all(list.map((s) => (s.cmdBase ? shell(s.cmdBase) : null)));
  return (
    <ol className="flex flex-col gap-8">
      {list.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[28px_1fr] gap-x-3">
          <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-[6px] bg-paper-2 font-mono text-[12px] tabular-nums text-ink">{i + 1}</span>
          <div className="min-w-0">
            <h3 className="text-[17px] font-medium tracking-[-0.01em] text-ink">{s.title}</h3>
            {s.text && <p className="mt-1.5 text-[16px] leading-[1.65] text-ink-2">{s.text}</p>}
            {blocks[i] && (
              <div className="mt-3">
                {bases[i] ? <ByPrimitive radix={<CodeTabs files={blocks[i]} />} base={<CodeTabs files={bases[i]} />} /> : <CodeTabs files={blocks[i]} />}
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
  title: "Set up Astabyte UI",
  text: (
    <>
      Runs <code>shadcn init</code> when there is no <code>components.json</code> yet (pick any base colour: our components bring their own
      tokens), then adds the <code>@astabyte</code> registry. With <code>--base</code> it points the registry at the Base UI builds; if shadcn asks
      for a component library, pick the same one.
    </>
  ),
  cmd: asta("init"),
  cmdBase: asta("init --base"),
};
const ADD: Step = {
  title: "Add components",
  text: (
    <>
      Files land in <code>components/astabyte/</code>, npm dependencies are installed and the tokens are merged into your CSS. Plain shadcn works
      too: <code>{`pnpm dlx shadcn@latest add @astabyte/button`}</code>.
    </>
  ),
  cmd: asta("add button price-chart"),
  cmdBase: asta("add button price-chart --base"),
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
const PKG_CSS = `@import "tailwindcss";
@import "asta-ui/styles.css";`;

const PKG_USE = `import { Button, Dialog, PriceChart, TextareaAui003 } from "asta-ui";
// Base UI build: import { Button, Dialog, PriceChart } from "asta-ui/base";
// One component, no primitive package needed: import { PriceChart } from "asta-ui/price-chart";

export default function Page() {
  return (
    <main className="dark bg-paper p-8 text-ink">
      <Button variant="accent">Deploy</Button>
      <div className="mt-6 h-80 max-w-md">
        <PriceChart />
      </div>
      <TextareaAui003 />
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
              Open a component page, pick Radix or Base UI, copy every file from the Code tab and install the packages it lists. The raw files are
              also in <code>{`${SITE}/r/<name>.json`}</code> (Radix) and <code>{`${SITE}/r/base/<name>.json`}</code> (Base UI).
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
      lead="Works in any React project with Tailwind CSS v4. Pick a primitive, pick your framework, add a component."
      toc={[
        { id: "primitive", title: "Radix or Base UI" },
        { id: "frameworks", title: "Pick your framework" },
        { id: "add", title: "Add a component" },
        { id: "package", title: "Install as a package" },
        { id: "registry", title: "Registry URLs" },
        { id: "tokens", title: "Tokens and dark mode" },
        { id: "agents", title: "Use it with an AI agent" },
      ]}
      next={{ href: "/button", title: "Button" }}
    >
      <p>
        Not on React? Use the <Link href="/go">Go + htmx</Link> module or the <Link href="/css">HTML + CSS</Link> layer instead.
      </p>

      <h2 id="primitive">Radix or Base UI</h2>
      <p>
        15 components (dialog, select, menu, tooltip, tabs, slider…) come in two builds. Same props, same look, same motion. Only the library
        underneath changes: <code>radix-ui</code> or <code>@base-ui/react</code>.
      </p>
      <p>
        Use the one your project already has, so you don&rsquo;t ship both. If you picked Base UI during <code>shadcn init</code>, pick it here
        too. Starting fresh? Radix is the long-time default, Base UI is what shadcn recommends now. Both are fine.
      </p>
      <p>This switch changes every command and code sample on the site. It remembers your choice.</p>
      <div className="not-prose my-6">
        <PrimitiveSwitch />
      </div>

      <h2 id="frameworks">Pick your framework</h2>
      <p>Already using shadcn? Still run <code>init</code>. It only adds our registry, nothing else.</p>
      <FrameworkTabs tabs={tabs} />

      <h2 id="add">Add a component</h2>
      <p>
        Name the components you want. The CLI checks the names, uses the build you picked in <code>init</code>, and lets the shadcn CLI do the
        rest. Every component page has its own command.
      </p>
      <div className="not-prose my-6">
        <InstallCommand slugs={["dialog"]} />
      </div>
      <p>
        Two more: <code>list</code> shows every component, <code>prompt &lt;name&gt;</code> prints a prompt for your AI agent.
      </p>

      <h2 id="package">Install as a package</h2>
      <p>
        Prefer imports over owning files? <code>asta-ui</code> is also a regular library: every component, compiled, with types. Update with{" "}
        <code>pnpm update asta-ui</code>. Customise with props and tokens. Needs React 18.3+ and Tailwind CSS v4.
      </p>
      <div className="not-prose my-6">
        <ByPrimitive radix={<CodeTabs files={await shell(add("asta-ui radix-ui"))} />} base={<CodeTabs files={await shell(add("asta-ui @base-ui/react"))} />} />
      </div>
      <p>
        Import the stylesheet once, right after Tailwind. It brings the tokens and tells Tailwind where our classes live.
      </p>
      <div className="not-prose my-6">
        <CodeTabs files={await file("globals.css", PKG_CSS)} />
      </div>
      <p>
        Classes missing? Your <code>node_modules</code> is probably somewhere unusual. Add{" "}
        <code>{`@source "../node_modules/asta-ui/dist";`}</code> to your CSS, with the path relative to that file.
      </p>
      <p>
        <code>asta-ui</code> is the Radix build. <code>asta-ui/base</code> is the Base UI build. Each needs its own library installed.
      </p>
      <p>
        Only need one component? Import it by path, like <code>asta-ui/price-chart</code> or <code>asta-ui/base/dialog</code>. Everything is
        marked <code>&quot;use client&quot;</code>, so Server Components can render it.
      </p>
      <div className="not-prose my-6">
        <CodeTabs files={await file("app/page.tsx", PKG_USE)} />
      </div>
      <p>
        Names match the component pages: <code>Dialog</code>, <code>PriceChart</code>, <code>OrderBook</code>. Variants have two names, the
        id <code>TextareaAui003</code> and a friendly one, <code>ChatComposer</code>. Motion blocks fill their parent, so give the wrapper a
        size.
      </p>

      <h2 id="registry">Registry URLs</h2>
      <p>Don&rsquo;t want our CLI? Every component is a plain shadcn registry item:</p>
      <ul>
        <li>
          Radix: <code>{`${SITE}/r/<name>.json`}</code>
        </li>
        <li>
          Base UI: <code>{`${SITE}/r/base/<name>.json`}</code>
        </li>
        <li>
          Index: <code>{`${SITE}/r/registry.json`}</code>
        </li>
      </ul>
      <p>
        To use short names like <code>@astabyte/button</code>, add this to <code>components.json</code>. It&rsquo;s exactly what{" "}
        <code>asta-ui init</code> writes.
      </p>
      <div className="not-prose my-6">
        <ByPrimitive
          radix={<CodeTabs files={await file("components.json", `{\n  "registries": {\n    "@astabyte": "${SITE}/r/{name}.json"\n  }\n}`)} />}
          base={<CodeTabs files={await file("components.json", `{\n  "registries": {\n    "@astabyte": "${SITE}/r/base/{name}.json"\n  }\n}`)} />}
        />
      </div>
      <p>
        Want both builds at hand? Add a second namespace, like <code>{`"@astabyte-base": "${SITE}/r/base/{name}.json"`}</code>.
      </p>

      <h2 id="tokens">Tokens and dark mode</h2>
      <p>Components read five colours. Change them and everything follows.</p>
      <ul>
        <li>
          <code>paper</code>: background
        </li>
        <li>
          <code>ink</code>: text
        </li>
        <li>
          <code>mute</code>: secondary text
        </li>
        <li>
          <code>signal</code>: strong contrast
        </li>
        <li>
          <code>brand</code>: the one accent colour. Not called <code>accent</code>, so it doesn&rsquo;t clash with shadcn.
        </li>
      </ul>
      <p>
        <code>:root</code> is light, <code>.dark</code> is dark. Motion blocks are designed on dark, so wrap them in an element with the{" "}
        <code>dark</code> class.
      </p>

      <h2 id="agents">Use it with an AI agent</h2>
      <p>
        Claude Code, Cursor and Codex can pick and install components for you. Set it up on <Link href="/skill">AI agents</Link>, or grab a
        prompt from <Link href="/prompts">Prompts</Link>. Every component page also has a <strong>Copy prompt</strong> button.
      </p>
    </DocPage>
  );
}
