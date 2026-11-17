"use client";

import { Footer, type FooterColumn } from "@/components/kit/footer";

const COLUMNS: FooterColumn[] = [
  { heading: "Product", links: [{ label: "Analytics", href: "#" }, { label: "Automations", href: "#" }, { label: "Pricing", href: "#" }] },
  { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Blog", href: "#" }] },
  { heading: "Help", links: [{ label: "Docs", href: "#" }, { label: "Status", href: "#" }, { label: "Contact", href: "#" }] },
];

export default function FooterDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4 sm:p-8">
      <Footer
        className="w-full max-w-[880px]"
        brand={
          <>
            <span className="h-4 w-4 rounded-full bg-brand" /> Northwind
          </>
        }
        tagline="Revenue analytics for teams that ship. One short letter a month."
        columns={COLUMNS}
        wordmark="Northwind"
        legal={
          <>
            <span>© 2026 Northwind Inc.</span>
            <span>Privacy · Terms</span>
          </>
        }
      />
    </div>
  );
}
