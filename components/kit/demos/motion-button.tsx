"use client";

import {
  ArrowButton,
  BeamButton,
  ConfirmButton,
  CopyButton,
  FillButton,
  PressButton,
  RollButton,
  ShineButton,
} from "@/components/kit/motion-button";

const Cell = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl bg-paper px-3 pb-3 pt-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
    <div className="flex h-14 items-center">{children}</div>
    <span className="font-mono text-[10.5px] text-mute">{name}</span>
  </div>
);

export default function MotionButtonDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="grid w-full max-w-[560px] grid-cols-1 gap-2.5 min-[440px]:grid-cols-2">
        <Cell name="RollButton">
          <RollButton>Start a project</RollButton>
        </Cell>
        <Cell name="FillButton">
          <FillButton>Hover me</FillButton>
        </Cell>
        <Cell name="ArrowButton">
          <ArrowButton>Get started</ArrowButton>
        </Cell>
        <Cell name="ShineButton">
          <ShineButton>Upgrade to Pro</ShineButton>
        </Cell>
        <Cell name="BeamButton">
          <BeamButton>Join the beta</BeamButton>
        </Cell>
        <Cell name="PressButton">
          <PressButton>Press me</PressButton>
        </Cell>
        <Cell name="CopyButton">
          <CopyButton value="npx shadcn add button">Copy</CopyButton>
        </Cell>
        <Cell name="ConfirmButton">
          <ConfirmButton confirmLabel="Sure?">Delete</ConfirmButton>
        </Cell>
      </div>
    </div>
  );
}
