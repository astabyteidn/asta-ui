import Sidebar from "@/components/ui-site/Sidebar";
import { uiItems } from "@/lib/ui-catalog";

/** Docs shell: the index stays mounted while pages change, so its highlight can glide between them. */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-gutter flex flex-col lg:flex-row lg:gap-10 xl:gap-12">
      <Sidebar items={uiItems} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
