// Tipe konten bersama (aman dipakai di client maupun server).

export type Collection = "work" | "notes" | "lab";

export interface Entry<D = Record<string, unknown>> {
  id: number;
  collection: Collection;
  slug: string;
  title: string;
  status: "draft" | "published";
  data: D;
  body: string;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkData {
  client?: string;
  year?: string;
  services?: string[];
  summary?: string;
  role?: string;
  url?: string;
  /** Warna aksen cover (hex). */
  color?: string;
  /** URL gambar cover (opsional; tanpa ini cover digambar generatif). */
  cover?: string;
  /** One per line: "value — label", e.g. "1 week — site, docs and app shipped". */
  outcomes?: string;
  testimonial?: string;
  /** Who said it, e.g. "Founder, Web3 client". */
  testimonial_by?: string;
}


export interface NoteData {
  excerpt?: string;
  tag?: string;
}

export interface LabData {
  description?: string;
}

export type Work = Entry<WorkData>;
export type Note = Entry<NoteData>;
export type LabEntry = Entry<LabData>;

export const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
export const strArr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

/** Parses WorkData.outcomes into value/label pairs. */
export const outcomes = (v: unknown) =>
  str(v)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [value, ...rest] = l.split(/\s+[—|-]\s+/);
      return { value: value.trim(), label: rest.join(" — ").trim() };
    });
