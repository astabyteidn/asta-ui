"use client";

import { HoverCard } from "@/components/kit/hover-card";

const PEOPLE = {
  maya: { name: "Maya Lindqvist", handle: "maya", initials: "ML", bio: "Design systems at Astabyte. Writes about type, spacing and calm interfaces.", following: 182, followers: "4.1k" },
  jonah: { name: "Jonah Reyes", handle: "jonah", initials: "JR", bio: "Frontend engineer. Motion, accessibility and fast pages.", following: 96, followers: "1.8k" },
};

const link = "rounded-sm font-medium text-ink underline decoration-[color-mix(in_srgb,var(--color-ink)_30%,transparent)] underline-offset-4 outline-none transition-[text-decoration-color] duration-200 hover:decoration-brand focus-visible:ring-2 focus-visible:ring-brand/50 data-[state=open]:decoration-brand";

function Profile({ p }: { p: (typeof PEOPLE)["maya"] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-medium text-white">{p.initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{p.name}</p>
          <p className="truncate text-[12.5px] text-mute">@{p.handle}</p>
        </div>
        <button type="button" className="h-8 shrink-0 rounded-lg bg-ink px-3 text-[12.5px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50">
          Follow
        </button>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2">{p.bio}</p>
      <p className="flex gap-4 text-[12.5px] text-mute">
        <span>
          <span className="font-medium tabular-nums text-ink">{p.following}</span> following
        </span>
        <span>
          <span className="font-medium tabular-nums text-ink">{p.followers}</span> followers
        </span>
      </p>
    </div>
  );
}

export default function HoverCardDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="rounded-xl bg-paper-2 p-5">
          <p className="text-[12px] text-mute">Changelog · v2.4</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
            New spacing scale and calmer focus rings, designed by{" "}
            <HoverCard label={PEOPLE.maya.name} trigger={<a href="#maya" onClick={(e) => e.preventDefault()} className={link}>@maya</a>}>
              <Profile p={PEOPLE.maya} />
            </HoverCard>{" "}
            and shipped by{" "}
            <HoverCard label={PEOPLE.jonah.name} side="top" trigger={<a href="#jonah" onClick={(e) => e.preventDefault()} className={link}>@jonah</a>}>
              <Profile p={PEOPLE.jonah} />
            </HoverCard>
            .
          </p>
        </div>
        <p className="text-center text-[12.5px] text-mute">Hover a name, or Tab to it. Move into the card to use it.</p>
      </div>
    </div>
  );
}
