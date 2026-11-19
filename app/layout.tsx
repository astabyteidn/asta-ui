import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Mark from "@/components/site/Mark";
import PageviewTracker from "@/components/site/PageviewTracker";
import CommandMenu from "@/components/ui-site/CommandMenu";
import GitHubStars from "@/components/ui-site/GitHubStars";
import MobileMenu from "@/components/ui-site/MobileMenu";
import SiteNav from "@/components/ui-site/SiteNav";
import { PRIMITIVE_SCRIPT } from "@/lib/primitive";
import { VERSION } from "@/lib/version";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });

const STUDIO = "https://astabyte.com";

export const metadata: Metadata = {
  metadataBase: new URL("https://ui.astabyte.com"),
  title: { default: "Astabyte UI — a motion-first component kit for shadcn", template: "%s — Astabyte UI" },
  description: "A component kit from atoms to whole sections, plus a motion lab, tuned by hand for pointer, touch and keys. For React, Go + htmx, or plain HTML and CSS.",
  openGraph: { type: "website", url: "https://ui.astabyte.com", siteName: "Astabyte UI" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

/** ui.astabyte.com. Links inside are host-relative: "/" is the UI home. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRIMITIVE_SCRIPT }} />
      </head>
      <body className="ui-light antialiased">
    <div className="flex min-h-svh flex-col">
      <PageviewTracker prefix="/ui" />
      <header className="ui-header px-shell sticky top-0 z-40 flex h-14 items-center gap-3 sm:gap-5">
        <Link href="/" className="nav-logo flex shrink-0 items-center gap-2 text-[15px] font-medium tracking-[-0.01em]">
          <Mark className="h-[18px] w-[18px] text-ink" />
          Astabyte
          <span className="rounded-[5px] bg-brand/10 px-1.5 font-mono text-[11px] leading-[18px] text-brand">UI</span>
        </Link>
        <SiteNav />
        <div className="ml-auto flex items-center gap-1.5">
          <CommandMenu />
          <GitHubStars />
          <a href={`${STUDIO}/contact?utm_source=ui`} className="btn btn-primary btn-sm hidden sm:inline-flex">
            Hire us <span className="btn-arrow" />
          </a>
          <MobileMenu studio={STUDIO} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mx-auto mb-6 mt-24 w-[calc(100%-2*var(--gutter))] max-w-[calc(1600px-2*var(--gutter))] rounded-[14px] bg-ink px-6 pb-6 pt-14 text-paper sm:px-10 [&_.btn-quiet]:bg-paper/10 [&_.btn-quiet]:text-paper [&_.btn-quiet]:shadow-none [&_.btn-primary]:bg-paper [&_.btn-primary]:text-ink [&_.text-mute]:text-paper/55">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <p className="display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1]">Want this feel in your product?</p>
            <p className="mt-4 text-[16px] leading-relaxed text-mute">
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
