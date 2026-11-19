"use client";

import { useState } from "react";
import { ChatComposer } from "@/components/kit/variants/textarea-aui-003";

type Msg = { id: number; text: string; files: string[] };

export default function Demo() {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, text: "Can you send the latest invoice?", files: [] }]);
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-3">
        <ul className="flex h-[150px] flex-col justify-end gap-2 overflow-hidden" aria-live="polite">
          {msgs.slice(-3).map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] animate-[demo-msg_.35s_cubic-bezier(.16,1,.3,1)_both] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug motion-reduce:animate-none ${m.id === 0 ? "self-start bg-paper-2 text-ink" : "self-end bg-ink text-paper"}`}
            >
              {m.text || <span className="opacity-70">Attachment</span>}
              {m.files.length > 0 && <span className="mt-1 block text-[11.5px] opacity-70">{m.files.join(", ")}</span>}
            </li>
          ))}
        </ul>
        <ChatComposer onSend={({ text, files }) => setMsgs((all) => [...all, { id: Date.now(), text, files: files.map((f) => f.name) }])} />
        <style href="asta-demo-textarea-aui-003" precedence="asta">{`@keyframes demo-msg { from { opacity: 0; transform: translateY(8px) scale(.98) } }`}</style>
      </div>
    </div>
  );
}
