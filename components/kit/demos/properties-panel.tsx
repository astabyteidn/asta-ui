"use client";

import { useState } from "react";
import { ColorField, PropertiesPanel, PropRow, PropSection, ScrubInput } from "@/components/kit/properties-panel";

const Angle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
    <path d="M5 19h14M5 19 15 6" />
  </svg>
);
const Corner = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
    <path d="M5 19v-6a8 8 0 0 1 8-8h6" />
  </svg>
);

export default function PropertiesPanelDemo() {
  const [s, setS] = useState({ x: 40, y: 36, w: 180, h: 120, r: 0, radius: 14, opacity: 100, fill: "#2f54eb", stroke: "#0a0b0a", sw: 0 });
  const on = (k: keyof typeof s) => (v: number | string) => setS((p) => ({ ...p, [k]: v }));
  return (
    <div className="flex min-h-[540px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-4 md:flex-row">
        <div className="relative h-[300px] min-w-0 flex-1 overflow-hidden rounded-[14px] bg-paper-2 md:h-auto">
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: s.w,
              height: s.h,
              transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`,
              borderRadius: s.radius,
              opacity: s.opacity / 100,
              background: s.fill,
              boxShadow: s.sw ? `inset 0 0 0 ${s.sw}px ${s.stroke}` : undefined,
            }}
          />
          <p className="absolute bottom-3 left-3 right-3 text-[12px] text-mute">Drag a field’s label to scrub. Shift ×10, Alt ×0.1, ↑ ↓ step.</p>
        </div>
        <PropertiesPanel kind="Rect" title="Card" className="md:w-[260px] md:shrink-0">
          <PropSection title="Layout">
            <PropRow cols={2}>
              <ScrubInput label="X" value={s.x} onChange={on("x")} />
              <ScrubInput label="Y" value={s.y} onChange={on("y")} />
              <ScrubInput label="W" value={s.w} onChange={on("w")} min={1} max={400} />
              <ScrubInput label="H" value={s.h} onChange={on("h")} min={1} max={400} />
              <ScrubInput label={<Angle />} name="Rotation" value={s.r} onChange={on("r")} unit="°" min={-180} max={180} />
              <ScrubInput label={<Corner />} name="Corner radius" value={s.radius} onChange={on("radius")} min={0} max={200} />
            </PropRow>
          </PropSection>
          <PropSection title="Layer">
            <PropRow label="Opacity" cols={1}>
              <ScrubInput label="%" name="Opacity" value={s.opacity} onChange={on("opacity")} min={0} max={100} />
            </PropRow>
          </PropSection>
          <PropSection title="Fill">
            <PropRow cols={1}>
              <ColorField name="Fill" value={s.fill} onChange={on("fill")} />
            </PropRow>
          </PropSection>
          <PropSection title="Stroke" defaultOpen={false}>
            <PropRow cols={2}>
              <ColorField name="Stroke" value={s.stroke} onChange={on("stroke")} />
              <ScrubInput label="W" name="Stroke width" value={s.sw} onChange={on("sw")} min={0} max={24} />
            </PropRow>
          </PropSection>
        </PropertiesPanel>
      </div>
    </div>
  );
}
