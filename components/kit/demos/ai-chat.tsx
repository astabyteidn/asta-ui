"use client";

import { AiChat } from "@/components/kit/ai-chat";

const ANSWERS: Record<string, string> = {
  "Summarise last week's sign-ups":
    "Sign-ups grew 18% week over week, to 1,284.\n\nMost came from the pricing page after Tuesday's update. Mobile now makes up 41% of new accounts, up from 33%.\n\nOne thing to watch: activation slipped to 52%. People sign up, then stall on the workspace step.",
  "Draft a reply to a late invoice":
    "Hi Rani,\n\nThanks for the reminder. The invoice for October went to the wrong inbox on our side. I've sent it to finance today, so you should see the payment by Friday.\n\nSorry for the wait, and thanks for your patience.",
  "Explain churn in one paragraph":
    "Churn is the share of customers who leave in a given period. If you start the month with 200 customers and 10 cancel, monthly churn is 5%. It matters because every lost customer has to be replaced before you can grow, so even a small drop in churn compounds over a year.",
};

const FALLBACK =
  "Here's a short take.\n\nStart with the one number that moved the most, then explain why in a sentence. Add a single next step. Anything longer usually belongs in a doc, not a chat.";

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

/** A canned reply streamed word by word. No network. */
async function* reply({ prompt, signal }: { prompt: string; signal: AbortSignal }) {
  await wait(650, signal);
  const text = ANSWERS[prompt] ?? FALLBACK;
  for (const token of text.match(/\S+\s*/g) ?? []) {
    if (signal.aborted) return;
    yield token;
    await wait(28 + Math.random() * 46, signal);
  }
}

export default function AiChatDemo() {
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <div className="w-full max-w-[560px]">
        <AiChat title="Workspace assistant" greeting="What should we look at?" suggestions={Object.keys(ANSWERS)} onSend={reply} />
      </div>
      <p className="text-[12.5px] text-mute">Pick a prompt or type your own. Press Escape or Stop to cut a reply short.</p>
    </div>
  );
}
