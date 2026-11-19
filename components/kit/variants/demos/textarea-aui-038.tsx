"use client";

import { SnippetTextarea } from "@/components/kit/variants/textarea-aui-038";

const CODE = `export function middleware(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/cms")) {
    const session = req.headers.get("cookie");
    if (!session) return redirect("/cms/login");
  }
  return next();
}`;

export default function Demo() {
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <div className="w-full max-w-[520px]">
        <p className="mb-3 flex items-center justify-between text-[13px] text-mute">
          <span>
            <span className="font-medium text-ink">Attach a snippet</span> to issue AB-214
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Astabyte · cms</span>
        </p>
        <SnippetTextarea defaultValue={CODE} rows={8} />
      </div>
    </div>
  );
}
