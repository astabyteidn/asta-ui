"use client";

import { ReviewTextarea } from "@/components/kit/variants/textarea-aui-037";

export default function Demo() {
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <ReviewTextarea
        defaultRating={4}
        defaultText="Clear, warm sound and they stay comfortable through a full workday. The case feels a bit bulky."
        photos={[
          { src: "/lab/headphones.jpg", alt: "Headphones on a desk" },
          { src: "/lab/art/hoarfrost.webp", alt: "Morning light through the window" },
        ]}
      />
    </div>
  );
}
