import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "../DocPage";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";

export const metadata: Metadata = { title: "Introduction", description: "What Astabyte UI is, and how it differs from a component package." };

export default function Introduction() {
  return (
    <DocPage
      title="Introduction"
      lead="Small, physical interface pieces you copy into your own code. Not a package you depend on."
      toc={[
        { id: "what", title: "What this is" },
        { id: "principles", title: "Principles" },
        { id: "stack", title: "Stack" },
      ]}
      next={{ href: "/installation", title: "Installation" }}
    >
      <h2 id="what">What this is</h2>
      <p>
        Astabyte UI has two parts. The <b>kit</b> is {kitItems.length} everyday building blocks, built up from the smallest piece: atoms like
        buttons and inputs, molecules like radio groups and selects, and organisms like a navbar or a sign-in card. The <b>motion lab</b> is{" "}
        {labBlocks.length} interaction pieces from our studio: dials you turn, cards you fling, words you can throw. Each one is plain React with
        its motion tuned by hand.
      </p>
      <p>
        It follows the shadcn way of working. You run one command, the source lands in your repo, and from then on it is your code. There is no
        package to keep up to date and nothing to override.
      </p>

      <h2 id="principles">Principles</h2>
      <ul>
        <li>
          <strong>Physics over tweens.</strong> Springs, inertia and friction, so things settle the way objects do.
        </li>
        <li>
          <strong>Every input counts.</strong> Pointer, touch and keyboard each get a real path, and reduced motion is respected.
        </li>
        <li>
          <strong>Readable source.</strong> Plain React and Tailwind v4 in one file, written to be changed.
        </li>
      </ul>

      <h2 id="stack">Stack</h2>
      <p>
        React 19, Tailwind CSS v4 and TypeScript. A few pieces use GSAP; the install command adds it when needed. Colours come from a handful
        of tokens (<code>paper</code>, <code>ink</code>, <code>signal</code>) that you can remap to your brand.
      </p>
      <p>
        Ready? Start with <Link href="/installation">Installation</Link>, or open any component from the sidebar.
      </p>
    </DocPage>
  );
}
