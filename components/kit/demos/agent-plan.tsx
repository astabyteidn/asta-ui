"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AgentPlan, type PlanStep } from "@/components/kit/agent-plan";

type Spec = { id: string; title: string; ms: number; logs?: string[]; result?: string; subs?: string[]; skip?: string; fail?: string };

const PLAN: Spec[] = [
  { id: "read", title: "Read the current plan schema", ms: 1600, logs: ["read billing/plans.ts", "select plan, count(*) from subscriptions"], result: "4 plans, 2,318 active subscriptions" },
  { id: "map", title: "Map seat plans to usage tiers", ms: 2400, subs: ["Starter → Usage Lite", "Team → Usage Standard", "Business → Usage Pro"], result: "3 tiers mapped. Enterprise stays on contracts." },
  { id: "sql", title: "Write migration 0042_usage_pricing.sql", ms: 1800, logs: ["create table meter_events", "alter table plans add unit_price_cents"], result: "+128 −14 lines" },
  { id: "fill", title: "Backfill 90 days of usage events", ms: 4200, logs: ["backfilled 210k of 1.28M events", "backfilled 640k of 1.28M events", "backfilled 1.05M of 1.28M events"], result: "1.28M events in 4 batches" },
  {
    id: "dry",
    title: "Dry-run invoices for 20 sample accounts",
    ms: 2600,
    logs: ["rendering invoice 7 of 20", "rendering invoice 16 of 20"],
    result: "19 of 20 within ±2%. One is 6% cheaper.",
    fail: "Account 1043 comes out 14% higher than today. Its overage cap isn't mapped yet.",
  },
  { id: "mail", title: "Email Enterprise admins about the change", ms: 0, skip: "Enterprise stays on contract pricing." },
  { id: "pr", title: "Open a pull request", ms: 1400, logs: ["git push origin feat/usage-pricing"], result: "#418 ready for review" },
];

const fresh = (): PlanStep[] => PLAN.map((p) => ({ id: p.id, title: p.title, status: "pending", substeps: p.subs?.map((t, i) => ({ id: `${p.id}${i}`, title: t, status: "pending" })) }));

type Setters = { steps: Dispatch<SetStateAction<PlanStep[]>>; failed: (on: boolean) => void; fade: (on: boolean) => void };

/** Plays the plan on timers. Every other lap the dry run fails, so the stopped state shows too. */
function runner(set: Setters) {
  let timers: ReturnType<typeof setTimeout>[] = [];
  let lap = 0;
  const later = (ms: number, f: () => void) => timers.push(setTimeout(f, ms));
  const stop = () => (timers.forEach(clearTimeout), (timers = []));
  const patch = (id: string, p: Partial<PlanStep>) => set.steps((all) => all.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const tick = (p: Spec, k: number) =>
    set.steps((all) => all.map((s) => (s.id === p.id ? { ...s, substeps: s.substeps?.map((x, j) => ({ ...x, status: j <= k ? "done" : j === k + 1 ? "running" : "pending" })) } : s)));

  function play(from: number, failDry: boolean) {
    stop();
    let at = 400;
    for (let i = from; i < PLAN.length; i++) {
      const p = PLAN[i];
      if (p.skip) {
        later(at, () => patch(p.id, { status: "skipped", detail: p.skip }));
        at += 500;
        continue;
      }
      const start = at;
      later(start, () => patch(p.id, { status: "running", startedAt: Date.now(), detail: p.logs?.[0] }));
      p.logs?.forEach((l, k) => k && later(start + (p.ms / p.logs!.length) * k, () => patch(p.id, { detail: l })));
      p.subs?.forEach((_, k) => later(start + (p.ms / p.subs!.length) * (k + 0.5), () => tick(p, k)));
      if (failDry && p.fail) {
        later(start + p.ms, () => {
          patch(p.id, { status: "failed", detail: p.fail, duration: p.ms });
          set.failed(true);
        });
        later(start + p.ms + 4200, restart);
        return;
      }
      later(start + p.ms, () => patch(p.id, { status: "done", detail: p.result, duration: p.ms }));
      at = start + p.ms + 350;
    }
    later(at + 3600, restart);
  }

  function begin() {
    set.steps(fresh());
    set.failed(false);
    set.fade(false);
    play(0, lap % 2 === 1);
  }

  // Fade out, reset, fade back in and go again.
  function restart() {
    set.fade(true);
    later(450, () => {
      lap += 1;
      begin();
    });
  }

  const retry = () => {
    patch("dry", { status: "pending", detail: undefined, duration: undefined });
    set.failed(false);
    play(4, false);
  };

  return { begin, retry, stop };
}

export default function AgentPlanDemo() {
  const [steps, setSteps] = useState(fresh);
  const [fade, setFade] = useState(false);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const run = useRef<ReturnType<typeof runner> | null>(null);

  // Rest while offscreen or in a hidden tab, and start the lap over when back.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const r = runner({ steps: setSteps, failed: setFailed, fade: setFade });
    run.current = r;
    const t = setTimeout(r.begin, 0);
    return () => {
      clearTimeout(t);
      r.stop();
    };
  }, [visible]);

  return (
    <div ref={root} className="flex min-h-[560px] w-full items-center justify-center p-4 sm:p-10">
      <div className="w-full max-w-[520px] transition-opacity duration-[450ms]" style={{ opacity: fade ? 0 : 1, transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}>
        <AgentPlan
          title="Migrate billing to usage-based plans"
          steps={steps}
          footer={
            failed && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2 animate-[asta-plan-in_.3s_cubic-bezier(.16,1,.3,1)_both]">
                <span>The agent stopped and is waiting for you.</span>
                <button
                  type="button"
                  onClick={() => run.current?.retry()}
                  className="h-7 shrink-0 rounded-md bg-ink px-2.5 text-[12px] font-medium text-paper outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-2"
                >
                  Retry step
                </button>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}
