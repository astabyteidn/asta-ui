"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { Drawer, type DrawerSide } from "@/components/kit/drawer";

const ITEMS = [
  { k: "Linen overshirt · M", v: "$89.00" },
  { k: "Canvas tote", v: "$34.00" },
  { k: "Shipping", v: "Free" },
];

export default function DrawerDemo() {
  const [side, setSide] = useState<DrawerSide | null>(null);
  const close = () => setSide(null);

  return (
    <div className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden rounded-xl p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-paper-2 p-5">
        <p className="text-[12px] text-mute">Order #10482 · Paid</p>
        <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">2 items · $123.00</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setSide("right")}>
            View order
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSide("left")}>
            Filters
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSide("bottom")}>
            Share
          </Button>
        </div>
      </div>

      <Drawer
        contained
        open={side === "right"}
        onOpenChange={close}
        side="right"
        title="Order #10482"
        description="Placed today at 09:41"
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Refund
            </Button>
            <Button data-autofocus onClick={close}>
              Mark as shipped
            </Button>
          </>
        }
      >
        <div className="rounded-[10px] bg-paper-2 px-4 py-2">
          {ITEMS.map((i) => (
            <div key={i.k} className="flex justify-between gap-4 py-1.5 text-[13.5px]">
              <span className="text-mute">{i.k}</span>
              <span className="tabular-nums text-ink">{i.v}</span>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer contained open={side === "left"} onOpenChange={close} side="left" title="Filters">
        {["Paid", "Shipped", "Refunded"].map((s) => (
          <label key={s} className="flex items-center gap-3 py-2 text-[14px] text-ink">
            <input type="checkbox" defaultChecked={s === "Paid"} className="h-4 w-4 accent-[var(--color-brand)]" />
            {s}
          </label>
        ))}
      </Drawer>

      <Drawer contained open={side === "bottom"} onOpenChange={close} side="bottom" title="Share receipt" description="Drag the handle down to close.">
        <div className="flex gap-2">
          <Button variant="soft" className="flex-1" onClick={close}>
            Copy link
          </Button>
          <Button variant="soft" className="flex-1" onClick={close}>
            Email
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
