"use client";

import { SplitSignIn } from "@/components/kit/variants/sign-in-aui-016";

const ART = "/lab/art/grande-jatte.webp";

const signIn = ({ password }: { email: string; password: string }) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (password === "wrongpass" ? reject(new Error("That password doesn't match.")) : resolve()), 1200));

export default function Demo() {
  return (
    <div className="relative isolate flex min-h-[640px] w-full items-center justify-center overflow-hidden px-4 py-10 sm:px-10">
      {/* The same painting, enlarged and blurred, as the backdrop. */}
      <img src={ART} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover blur-2xl" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-paper/10" />
      <SplitSignIn image={ART} onSubmit={signIn} />
    </div>
  );
}
