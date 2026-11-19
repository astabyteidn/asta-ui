"use client";

import { useEffect, useState } from "react";
import { ThemeSwitch, type ThemeMode } from "@/components/kit/variants/switch-aui-060";

export default function Demo() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [touched, setTouched] = useState(false);
  // One hint after mount: the card flips to dark once.
  useEffect(() => {
    if (touched) return;
    const t = setTimeout(() => {
      setTheme("dark");
      setTouched(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [touched]);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-5 sm:p-8">
      <ThemeSwitch
        theme={theme}
        onThemeChange={(t) => {
          setTouched(true);
          setTheme(t);
        }}
      />
    </div>
  );
}
