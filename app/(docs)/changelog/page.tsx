import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every Astabyte UI release: new components, fixes and changes, newest first.",
};

const REPO = "https://github.com/astabyteidn/asta-ui";

type Item = { text: string; children: string[] };
type Release = { version: string; date: string; intro: string[]; items: Item[] };

/** Reads CHANGELOG.md at build time. It only needs the subset the file uses: `## 1.2.3 — date`, paragraphs and two levels of `- ` bullets. */
function releases(): Release[] {
  const md = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  const out: Release[] = [];
  for (const line of md.split("\n")) {
    const head = line.match(/^## (\S+)\s+[—-]\s+(.+)$/);
    if (head) {
      out.push({ version: head[1], date: head[2].trim(), intro: [], items: [] });
      continue;
    }
    const r = out.at(-1);
    if (!r || !line.trim()) continue;
    const sub = line.match(/^\s{2,}- (.+)$/);
    const top = line.match(/^- (.+)$/);
    if (sub && r.items.length) r.items.at(-1)!.children.push(sub[1]);
    else if (top) r.items.push({ text: top[1], children: [] });
    else r.intro.push(line.trim());
  }
  return out;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+[^\s).,])/g;

/** Bold, code, links and bare URLs. */
function Inline({ text }: { text: string }) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}><Inline text={part.slice(2, -2)} /></strong>;
    if (part.startsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={link[2]}><Inline text={link[1]} /></a>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part}>{part.replace(/^https?:\/\//, "")}</a>;
    return part;
  });
}

const id = (v: string) => `v${v.replaceAll(".", "-")}`;

function when(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function ChangelogPage() {
  const list = releases();

  return (
    <DocPage
      title="Changelog"
      lead="What changed in each release, newest first. The npm package, the Go module and this site share one version."
      toc={list.map((r) => ({ id: id(r.version), title: `v${r.version}` }))}
    >
      <p>
        Pin a version with <code>asta-ui@{list[0]?.version}</code> on npm or <code>go get …/go@v{list[0]?.version}</code>. Tags and notes are
        also on <a href={`${REPO}/releases`}>GitHub releases</a>.
      </p>

      {list.map((r, n) => (
        <section key={r.version} id={id(r.version)} className="mt-16 scroll-mt-28">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="display text-[clamp(1.5rem,2.4vw,2rem)]">v{r.version}</h2>
            <time dateTime={r.date} className="font-mono text-[12px] text-mute">
              {when(r.date)}
            </time>
            {n === 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium leading-[1.4] text-white">Latest</span>}
          </div>
          {r.intro.map((p) => (
            <p key={p}>
              <Inline text={p} />
            </p>
          ))}
          {r.items.length > 0 && (
            <ul>
              {r.items.map((it) => (
                <li key={it.text}>
                  <Inline text={it.text} />
                  {it.children.length > 0 && (
                    <ul className="changelog-sub">
                      {it.children.map((c) => (
                        <li key={c}>
                          <Inline text={c} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </DocPage>
  );
}
