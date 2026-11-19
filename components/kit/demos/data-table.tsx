"use client";

import { DataTable, type DataTableColumn } from "@/components/kit/data-table";

type Status = "Paid" | "Pending" | "Overdue" | "Draft";

interface Invoice {
  id: string;
  client: string;
  email: string;
  issued: string;
  amount: number;
  status: Status;
}

const CLIENTS = [
  ["Design studio", "billing@studio.example.com"],
  ["Research lab", "ap@lab.example.com"],
  ["Pixel agency", "hello@agency.example.com"],
  ["Freight company", "finance@freight.example.com"],
  ["Health clinic", "accounts@clinic.example.com"],
  ["Dev shop", "pay@devshop.example.com"],
  ["Notes app", "team@notes.example.com"],
  ["Coffee roaster", "owner@coffee.example.com"],
  ["Logistics co.", "ops@logistics.example.com"],
];
const STATUSES: Status[] = ["Paid", "Paid", "Pending", "Paid", "Overdue", "Pending", "Draft", "Paid"];

// Deterministic fake data, so server and client render the same rows.
const INVOICES: Invoice[] = Array.from({ length: 23 }, (_, i) => {
  const [client, email] = CLIENTS[(i * 4) % CLIENTS.length];
  const day = 28 - i;
  return {
    id: `INV-${String(2041 - i).padStart(4, "0")}`,
    client,
    email,
    issued: `2026-${day > 0 ? "11" : "10"}-${String(day > 0 ? day : day + 31).padStart(2, "0")}`,
    amount: ((i * 7919) % 4800) + 240 + (i % 3) * 0.5,
    status: STATUSES[(i * 3) % STATUSES.length],
  };
});

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const DOT: Record<Status, string> = {
  Paid: "bg-brand",
  Pending: "bg-[color-mix(in_srgb,var(--color-brand)_40%,transparent)]",
  Overdue: "bg-ink",
  Draft: "bg-[color-mix(in_srgb,var(--color-ink)_25%,transparent)]",
};

const columns: DataTableColumn<Invoice>[] = [
  { key: "id", header: "Invoice", sortable: true, cell: (r) => <span className="font-medium tabular-nums text-ink">{r.id}</span> },
  {
    key: "client",
    header: "Client",
    sortable: true,
    cell: (r) => (
      <div className="flex flex-col">
        <span className="text-ink">{r.client}</span>
        <span className="text-[12px] text-mute">{r.email}</span>
      </div>
    ),
  },
  { key: "issued", header: "Issued", sortable: true, cell: (r) => <span className="tabular-nums">{dateFmt.format(new Date(r.issued))}</span> },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (r) => (
      <span className="inline-flex items-center gap-1.5 text-ink-2">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[r.status]}`} />
        {r.status}
      </span>
    ),
  },
  { key: "amount", header: "Amount", sortable: true, align: "right", cell: (r) => <span className="text-ink">{money.format(r.amount)}</span> },
];

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium outline-none transition-[background-color,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50";

export default function DataTableDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Invoices</p>
            <p className="mt-0.5 text-[13px] text-mute">Last 30 days · {money.format(INVOICES.reduce((s, r) => s + r.amount, 0))} billed</p>
          </div>
        </div>
        <DataTable
          label="Invoices"
          columns={columns}
          data={INVOICES}
          getRowId={(r) => r.id}
          selectable
          searchable
          searchPlaceholder="Search invoices…"
          pageSize={6}
          maxHeight={380}
          actions={(rows) =>
            rows.length > 0 ? (
              <>
                <button type="button" className={`${btn} text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:bg-paper-2`}>
                  Export {rows.length}
                </button>
                <button type="button" className={`${btn} bg-brand text-white hover:bg-[color-mix(in_srgb,var(--color-brand)_88%,black)]`}>
                  Mark paid
                </button>
              </>
            ) : (
              <button type="button" className={`${btn} bg-ink text-paper hover:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))]`}>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M8 3.5v9M3.5 8h9" />
                </svg>
                New invoice
              </button>
            )
          }
        />
        <p className="text-center text-[12.5px] text-mute">Click a header to sort. Search, select rows and page through.</p>
      </div>
    </div>
  );
}
