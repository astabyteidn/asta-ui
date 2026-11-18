"use client";

import { useState } from "react";
import { Onboarding, type OnboardingStep } from "@/components/kit/onboarding";

const STEPS: OnboardingStep[] = [
  { id: "profile", title: "Create your profile", description: "Add a name and a photo so your team knows who is who.", duration: "1 min" },
  { id: "invite", title: "Invite your team", description: "Send invites by email. People join with one click.", action: "Send invites", duration: "2 min" },
  { id: "connect", title: "Connect a data source", description: "Pick a database or upload a CSV. We only read what you choose.", action: "Connect", duration: "3 min" },
  { id: "dashboard", title: "Build your first dashboard", description: "Start from a template, then make it yours.", action: "Open templates", duration: "5 min" },
];

const wait = () => new Promise<void>((r) => setTimeout(r, 700));

export default function OnboardingDemo() {
  // Bump the key to start over.
  const [run, setRun] = useState(0);

  return (
    <div className="flex min-h-[460px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <Onboarding
        key={run}
        title="Get set up"
        subtitle="Four steps, about ten minutes."
        steps={STEPS}
        defaultCompleted={["profile"]}
        onStep={wait}
        onFinish={() => setRun((n) => n + 1)}
        finishLabel="Start over"
      />
      <p className="text-[12.5px] text-mute">Finish a step and the next one opens.</p>
    </div>
  );
}
