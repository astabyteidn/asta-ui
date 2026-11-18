"use client";

import { useState } from "react";
import { NotificationCenter, type NotificationEntry } from "@/components/kit/notification-center";

const ago = (min: number) => new Date(Date.now() - min * 60_000);

const START: NotificationEntry[] = [
  { id: "n1", title: "Sekar Ayu commented on Pricing page v3", body: "Can we try the annual toggle above the cards?", time: ago(4), actor: { name: "Sekar Ayu" } },
  { id: "n2", title: "Dimas Arya assigned you Invoice PDF layout", time: ago(52), actor: { name: "Dimas Arya" } },
  { id: "n3", title: "Export finished", body: "orders-november.csv is ready to download.", time: ago(180) },
  { id: "n4", title: "Rani Pratama mentioned you in Weekly sync", body: "Let's ship the onboarding email on Thursday.", time: ago(60 * 26), actor: { name: "Rani Pratama" }, read: true },
  { id: "n5", title: "Your trial ends in 7 days", time: ago(60 * 30), read: true },
  { id: "n6", title: "Bayu Nugroho joined the workspace", time: ago(60 * 74), actor: { name: "Bayu Nugroho" }, read: true },
];

const INCOMING: Omit<NotificationEntry, "id" | "time">[] = [
  { title: "Laras Wening replied to your comment", body: "Agreed, the toggle reads better up top.", actor: { name: "Laras Wening" } },
  { title: "Deploy finished", body: "Production is on build 2.4.1." },
  { title: "Dimas Arya moved Audit empty states to Done", actor: { name: "Dimas Arya" } },
];

export default function NotificationCenterDemo() {
  const [items, setItems] = useState(START);
  const [n, setN] = useState(0);

  const simulate = () => {
    setItems((all) => [{ ...INCOMING[n % INCOMING.length], id: `new-${n}`, time: new Date() }, ...all]);
    setN((x) => x + 1);
  };

  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <div className="flex w-full max-w-[560px] items-center justify-between rounded-[12px] bg-paper-2 py-2 pl-4 pr-2">
        <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Workspace</p>
        <NotificationCenter notifications={items} onNotificationsChange={setItems} />
      </div>
      <button
        type="button"
        onClick={simulate}
        className="rounded-lg px-3 py-1.5 text-[13px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        Simulate a new notification
      </button>
    </div>
  );
}
