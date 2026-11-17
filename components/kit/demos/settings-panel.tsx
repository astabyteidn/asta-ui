"use client";

import { useRef, useState } from "react";
import { SettingsPanel, type Settings, type SettingsPanelHandle } from "@/components/kit/settings-panel";

const INITIAL: Settings = {
  name: "Rani Pratama",
  email: "rani@studio.dev",
  notify: { product: true, mentions: true, digest: false },
  theme: "system",
  language: "English",
};

export default function SettingsPanelDemo() {
  const panel = useRef<SettingsPanelHandle>(null);
  const [note, setNote] = useState("");

  return (
    <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <div className="flex w-full max-w-[520px] items-center justify-between px-1">
        <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Settings</p>
        {/* A fake navigation: blocked (and the save bar shakes) while there are unsaved changes. */}
        <button
          type="button"
          onClick={() => setNote(panel.current?.requestLeave() ? "Left the page" : "Save or reset first")}
          className="rounded-lg px-2 py-1 text-[13px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          ← Back to dashboard
        </button>
      </div>
      <SettingsPanel ref={panel} initial={INITIAL} onSave={() => new Promise((r) => setTimeout(r, 900))} />
      <p className="h-4 text-[12.5px] text-mute" aria-live="polite">
        {note || "Change anything and the save bar slides up."}
      </p>
    </div>
  );
}
