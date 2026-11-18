"use client";

import { useState } from "react";
import { Pagination } from "@/components/kit/pagination";

const TOTAL = 248;
const PER_PAGE = 10;

export default function PaginationDemo() {
  const [page, setPage] = useState(5);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(TOTAL, page * PER_PAGE);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-10">
        <div className="flex w-full flex-col items-center gap-4 rounded-xl bg-paper-2 px-4 py-5">
          <p className="text-[13px] tabular-nums text-mute">
            Showing <span className="text-ink">{from}–{to}</span> of {TOTAL} orders
          </p>
          <Pagination label="Orders pages" count={Math.ceil(TOTAL / PER_PAGE)} page={page} onPageChange={setPage} />
        </div>
        <Pagination label="Results pages" count={6} size="sm" />
        <p className="text-center text-[12.5px] text-mute">Click a page or use the arrow keys once a page has focus.</p>
      </div>
    </div>
  );
}
