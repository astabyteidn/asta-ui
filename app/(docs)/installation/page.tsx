import type { Metadata } from "next";
import InstallCommand from "@/components/ui-site/InstallCommand";
import DocPage from "../DocPage";

export const metadata: Metadata = { title: "Installation", description: "Add Astabyte UI components with the shadcn CLI." };

export default function Installation() {
  return (
    <DocPage
      title="Installation"
      lead="Any React project with Tailwind CSS v4 and shadcn set up can take these components."
      toc={[
        { id: "setup", title: "Set up shadcn" },
        { id: "add", title: "Add a component" },
        { id: "tokens", title: "Tokens" },
      ]}
      next={{ href: "/button", title: "Button" }}
    >
      <h2 id="setup">Set up shadcn</h2>
      <p>
        If your project has no <code>components.json</code> yet, create one first. Follow the{" "}
        <a href="https://ui.shadcn.com/docs/installation" rel="noreferrer" target="_blank">
          shadcn installation guide
        </a>{" "}
        for your framework.
      </p>

      <h2 id="add">Add a component</h2>
      <p>Point the CLI at a component&rsquo;s registry URL. Every component page shows its own command.</p>
      <div className="not-prose my-6">
        <InstallCommand url="https://ui.astabyte.com/r/dial-knob.json" />
      </div>
      <p>
        The file lands in <code>components/astabyte/</code>, its npm dependencies are installed, and its colour tokens are merged into your CSS.
        The full index lives at <code>https://ui.astabyte.com/r/registry.json</code>.
      </p>

      <h2 id="tokens">Tokens</h2>
      <p>
        Components read a few colours: <code>paper</code> (ground), <code>ink</code> (text), <code>mute</code> (secondary) and{" "}
        <code>signal</code> (accent). Change those variables and every component follows.
      </p>
    </DocPage>
  );
}
