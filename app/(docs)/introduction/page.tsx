import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "../DocPage";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";

export const metadata: Metadata = { title: "Introduction", description: "What Astabyte UI is, who it is for, and how it works." };

export default function Introduction() {
  return (
    <DocPage
      title="Introduction"
      lead="Components that feel good to use. For React, or as plain CSS in any HTML."
      toc={[
        { id: "tldr", title: "TL;DR" },
        { id: "why", title: "Why we made it" },
        { id: "what", title: "What's inside" },
        { id: "how", title: "How it works" },
        { id: "primitives", title: "Radix or Base UI" },
        { id: "stacks", title: "Not on React?" },
      ]}
      next={{ href: "/installation", title: "Installation" }}
    >
      <h2 id="tldr">TL;DR</h2>
      <ul>
        <li>
          {kitItems.length} everyday components (buttons, inputs, dialogs, a navbar) and {labBlocks.length} motion pieces (price charts, order
          books, checkout flows).
        </li>
        <li>React 19, Tailwind CSS v4, TypeScript. One file per component.</li>
        <li>
          Not on React? The main kit also ships as <Link href="/css">plain CSS classes</Link> for any HTML: Go, Django, Rails, Laravel
          or htmx.
        </li>
        <li>
          Add one with <code>pnpm dlx asta-ui@latest add dialog</code>, or <code>pnpm add asta-ui</code> and import it.
        </li>
        <li>Built on Radix or Base UI. You pick.</li>
        <li>
          <strong>Still in beta.</strong> Names and props can change before 1.0. Check the changelog before you update.
        </li>
      </ul>

      <h2 id="why">Why we made it</h2>
      <p>Most UI kits look fine in a screenshot. Then you click around and nothing feels like anything.</p>
      <p>
        We build product UI for clients at Astabyte. Over time we kept rewriting the same pieces: a chart traders scrub all day, a card form that
        has to feel safe, a cart that makes adding one more item feel good. So we cleaned them up and put them here.
      </p>

      <h2 id="what">What&rsquo;s inside</h2>
      <p>
        <b>The kit.</b> Everyday building blocks, grouped from small to big: atoms (button, input), molecules (select, tabs) and organisms (navbar,
        sign-in card).
      </p>
      <p>
        <b>The motion lab.</b> Bigger pieces from real use cases: trading, payments, ecommerce. Each one has one motion moment, tuned by hand.
      </p>
      <p>Every piece works with a mouse, a finger and a keyboard. Turn on reduced motion and it calms down.</p>

      <h2 id="how">How it works</h2>
      <p>Same idea as shadcn. You run one command and the source file lands in your repo. Now it&rsquo;s your code. Change whatever you want.</p>
      <p>
        Don&rsquo;t want to own the files? Install the <code>asta-ui</code> package instead and get updates with <code>pnpm update</code>. See{" "}
        <Link href="/installation#package">Install as a package</Link>.
      </p>
      <p>
        Colours come from a few tokens like <code>paper</code>, <code>ink</code> and <code>brand</code>. Change them once and every component
        follows.
      </p>

      <h2 id="primitives">Radix or Base UI</h2>
      <p>
        Dialogs, menus and selects need focus traps, keyboard support and screen-reader labels. We don&rsquo;t rebuild that. It comes from{" "}
        <code>radix-ui</code> or <code>@base-ui/react</code>.
      </p>
      <p>
        Both builds have the same props, look and motion. Use the one your project already has. Starting fresh? Either is fine. Use the{" "}
        <strong>Primitive</strong> switch on any component page to see both.
      </p>
      <h2 id="stacks">Not on React?</h2>
      <p>
        <strong>HTML + CSS.</strong> The same look as semantic classes like <code>.asta-btn</code>, plus a small script for menus, dialogs and
        toasts. Works with Go html/template, Rails, Django, Laravel, htmx or a static page. See <Link href="/css">HTML + CSS</Link>.
      </p>
      <p>The motion lab is React only for now.</p>
      <p>
        Next: <Link href="/installation">Installation</Link>, or pick a component from the sidebar.
      </p>
    </DocPage>
  );
}
