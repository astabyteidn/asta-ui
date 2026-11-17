import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Mark from "@/components/site/Mark";
import PageviewTracker from "@/components/site/PageviewTracker";
import CommandMenu from "@/components/ui-site/CommandMenu";
import { VERSION } from "@/lib/version";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });

const STUDIO = "https://astabyte.com";

export const metadata: Metadata = {
  metadataBase: new URL("https://ui.astabyte.com"),
  title: { default: "Astabyte UI — a motion-first component kit for shadcn", template: "%s — Astabyte UI" },
  description: "A React component kit from atoms to whole sections, plus a motion lab, tuned by hand for pointer, touch and keys. Install with the shadcn CLI or copy the file.",
  openGraph: { type: "website", url: "https://ui.astabyte.com", siteName: "Astabyte UI" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

/** ui.astabyte.com. Links inside are host-relative: "/" is the UI home. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className="ui-light antialiased">
    <div className="flex min-h-svh flex-col">
      <PageviewTracker prefix="/ui" />
      <header className="ui-header px-gutter sticky top-0 z-40 flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.01em]">
          <Mark className="h-5 w-5 text-ink" />
          Astabyte
          <span className="rounded-[5px] bg-paper-2 px-2 font-mono text-[10.5px] leading-5 text-mute">UI</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/introduction" className="btn btn-ghost btn-sm font-normal">
            Docs
          </Link>
          <Link href="/#kit" className="btn btn-ghost btn-sm font-normal">
            Kit
          </Link>
          <Link href="/#components" className="btn btn-ghost btn-sm font-normal">
            Motion
          </Link>
          <a href={`${STUDIO}/?utm_source=ui`} className="btn btn-ghost btn-sm font-normal">
            Studio <span aria-hidden className="text-mute">↗</span>
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <CommandMenu />
          <a href={`${STUDIO}/contact?utm_source=ui`} className="btn btn-primary btn-sm">
            Hire us <span className="btn-arrow" />
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mx-2 mb-2 mt-24 rounded-[14px] bg-ink px-6 pb-6 pt-14 text-paper sm:px-10 [&_.btn-quiet]:bg-paper/10 [&_.btn-quiet]:text-paper [&_.btn-quiet]:shadow-none [&_.btn-primary]:bg-paper [&_.btn-primary]:text-ink [&_.text-mute]:text-paper/55">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <p className="display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1]">Want this feel in your product?</p>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              These come out of client work at Astabyte, a design &amp; engineering studio. We build brands, sites and apps that drive revenue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`${STUDIO}/work?utm_source=ui&utm_campaign=footer`} className="btn btn-quiet btn-lg">
              See our work
            </a>
            <a href={`${STUDIO}/contact?utm_source=ui&utm_campaign=footer`} className="btn btn-primary btn-lg">
              Start a project <span className="btn-arrow" />
            </a>
          </div>
        </div>
        <div className="label mt-14 flex justify-between text-mute">
          <span>© {new Date().getFullYear()} Astabyte Labs · v{VERSION}</span>
          <a href={STUDIO} className="transition-colors hover:text-ink">
            astabyte.com
          </a>
        </div>
      </footer>
    </div>
      </body>
    </html>
  );
}
