"use client";

import { Tabs } from "@/components/kit/tabs";

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-paper-2 p-5">
    <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</p>
    <p className="mt-1.5 text-[14px] leading-relaxed text-mute">{children}</p>
  </div>
);

export default function TabsDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-lg flex-col gap-10">
        <Tabs
          label="Project"
          tabs={[
            { value: "overview", label: "Overview", content: <Panel title="Overview">Traffic is up 18% this week. Two deploys went out on Tuesday.</Panel> },
            { value: "activity", label: "Activity", count: 12, content: <Panel title="Activity">12 new events since your last visit: comments, deploys and invites.</Panel> },
            { value: "settings", label: "Settings", content: <Panel title="Settings">Domains, environment variables and who can see this project.</Panel> },
            { value: "billing", label: "Billing", content: <Panel title="Billing">You are on Pro. The next invoice is on the 1st.</Panel> },
          ]}
        />
        <Tabs
          variant="pill"
          label="Code"
          defaultValue="npm"
          tabs={[
            { value: "npm", label: "npm", content: <Code>npm install @acme/ui</Code> },
            { value: "pnpm", label: "pnpm", content: <Code>pnpm add @acme/ui</Code> },
            { value: "bun", label: "bun", content: <Code>bun add @acme/ui</Code> },
          ]}
        />
      </div>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="rounded-lg bg-paper-2 px-4 py-3 font-mono text-[13px] text-ink-2">
    <span className="select-none text-mute">$ </span>
    {children}
  </pre>
);
