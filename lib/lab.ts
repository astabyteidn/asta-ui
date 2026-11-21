// Metadata eksperimen lab (aman untuk server & client). Komponennya dipetakan lewat slug
// di `components/lab/components.ts`. Judul, deskripsi dan urutan bisa ditimpa lewat CMS
// (koleksi `lab`, slug sama) — lihat `mergeLab`.
import type { LabEntry } from "./types";

/** What a component is *for*, not how you poke it. */
export const KINDS = ["Actions", "Inputs", "Feedback", "Surfaces"] as const;
export type Kind = (typeof KINDS)[number];
/** Which input it listens to — shown as a spec on each specimen. */
export type Input = "pointer" | "touch" | "keys";

export interface LabMeta {
  slug: string;
  title: string;
  kind: Kind[];
  input: Input[];
  description: string;
  /** Markdown notes from the CMS (detail page). */
  body?: string;
}

/** Catalogue number shown on each specimen, e.g. AB-L03. */
export const specimenId = (i: number) => `AB-L${String(i + 1).padStart(2, "0")}`;

export const labBlocks: LabMeta[] = [
  { slug: "hold-to-confirm", title: "Hold to confirm", kind: ["Actions"], input: ["pointer", "touch"], description: "Destructive actions ask for commitment: hold to fill, let go early and it drains away." },
  { slug: "scramble-text", title: "Scramble text", kind: ["Feedback"], input: ["pointer"], description: "Words decode letter by letter on hover — a tiny reward for curiosity." },
  { slug: "spotlight-grid", title: "Spotlight grid", kind: ["Surfaces"], input: ["pointer"], description: "One light source shared across every tile, so borders glow as the cursor passes." },
  { slug: "elastic-string", title: "Elastic string", kind: ["Feedback"], input: ["pointer", "touch"], description: "Pluck a line: it follows you, then rings back to rest." },
  { slug: "ink-trail", title: "Ink trail", kind: ["Feedback"], input: ["pointer", "touch"], description: "The pointer leaves a ribbon that thins and fades as it ages." },
  { slug: "gravity-pills", title: "Gravity words", kind: ["Surfaces"], input: ["pointer", "touch"], description: "Words as physical discs. They fall, pile up, and you can grab one and throw it at the rest." },
  { slug: "dial-knob", title: "Rotary dial", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "A knob you actually turn: drag around it, scroll, or use the arrows, with a detent every ten." },
  { slug: "morse-tap", title: "Morse key", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "Tap for a dot, hold for a dash. Pauses commit letters, so one button can spell anything." },
  { slug: "split-flap", title: "Split-flap board", kind: ["Feedback"], input: ["pointer"], description: "Each flap steps through the alphabet until it lands, like an old departure board." },
  { slug: "combo-lock", title: "Combination lock", kind: ["Inputs"], input: ["pointer", "keys"], description: "Three wheels to drag or scroll. Find the code and the shackle pops open." },
  { slug: "needle-field", title: "Needle field", kind: ["Surfaces"], input: ["pointer", "touch"], description: "A grid of compass needles that all turn to face you. The closest ones light up." },
  { slug: "snap-grid", title: "Snap to grid", kind: ["Surfaces"], input: ["pointer", "touch"], description: "Drag a block anywhere; it springs into the nearest cell. The grid only appears while you drag." },
  { slug: "pixel-reveal", title: "Pixel reveal", kind: ["Surfaces"], input: ["pointer", "touch"], description: "Rub away a wall of pixels to read the message underneath. It slowly grows back." },
  { slug: "bubble-wrap", title: "Bubble wrap", kind: ["Feedback"], input: ["pointer", "touch"], description: "Press to pop, or drag across to pop a whole row. Pointless, and hard to stop." },
  { slug: "price-chart", title: "Price chart", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "A live price line that eases each new tick in. Hover to scrub it with a crosshair." },
  { slug: "candlestick", title: "Candlestick chart", kind: ["Surfaces", "Inputs"], input: ["pointer", "touch", "keys"], description: "Candles stream in and the current one grows live. Hover for its open, high, low and close." },
  { slug: "order-book", title: "Order book", kind: ["Feedback"], input: ["pointer"], description: "Bids and asks with depth bars that ease to the new size and prices that flash when they move." },
  { slug: "trade-ticket", title: "Trade ticket", kind: ["Inputs", "Actions"], input: ["pointer", "touch", "keys"], description: "Buy or sell with one slider. The amount rolls as you drag and the order fills with a check." },
  { slug: "card-checkout", title: "Card checkout", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "An illustrated card that fills in as you type. The front slides aside to show the CVC on the back. Click it to type your own." },
  { slug: "payment-status", title: "Payment status", kind: ["Feedback"], input: ["pointer", "touch"], description: "One ring tells the whole story: it spins while processing, fills while verifying, then turns into a check." },
  { slug: "pay-methods", title: "Payment methods", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "Four ways to pay. The highlight glides between them and the detail line morphs to match." },
  { slug: "add-to-cart", title: "Add to cart", kind: ["Actions", "Feedback"], input: ["pointer", "touch"], description: "A dot arcs from the button into the cart, the badge pops, and the button turns into a stepper." },
  { slug: "variant-picker", title: "Product options", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "Pick a finish and it sweeps across the product; change the storage and the price rolls." },
  { slug: "cart-drawer", title: "Free shipping bar", kind: ["Surfaces", "Feedback"], input: ["pointer", "touch"], description: "Items pop in, the bar fills, and it locks in with a check when shipping is free." },
  { slug: "plan-switcher", title: "Plan switcher", kind: ["Inputs"], input: ["pointer", "touch", "keys"], description: "Switch plans and the ring glides over, the price rolls and features slide in or get struck out. Go yearly and a savings pill pops." },
  { slug: "shipment-tracker", title: "Shipment tracker", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "A van rides the route and pauses at each stop while the ETA counts down. At the door a check draws. Click a stop to scrub." },
  { slug: "payment-received", title: "Payment received", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "A payment lands as a toast, the balance rolls up and the sparkline grows a point. Hover to pause." },
  { slug: "wishlist", title: "Wishlist", kind: ["Actions", "Feedback"], input: ["pointer", "touch", "keys"], description: "Tap a heart and it bursts, then flies into Saved and the badge pops. Tap again and it flies back." },
  { slug: "chat-thread", title: "Chat thread", kind: ["Inputs", "Feedback"], input: ["pointer", "touch", "keys"], description: "Typing dots grow into a reply, and your message lifts out of the composer. The receipt ticks over to Read. Type and press Enter to join in." },
  { slug: "seat-picker", title: "Seat picker", kind: ["Inputs", "Feedback"], input: ["pointer", "touch", "keys"], description: "Pick a seat and it pops blue while the total rolls. Now and then someone else books one and it fades in. Arrow keys move between seats." },
  { slug: "now-playing", title: "Now playing", kind: ["Actions", "Surfaces"], input: ["pointer", "touch", "keys"], description: "The equalizer bounces while it plays. Skip and the title and cover slide across. Space plays or pauses, arrows seek." },
  { slug: "booking-slots", title: "Booking slots", kind: ["Inputs", "Actions"], input: ["pointer", "touch", "keys"], description: "Pick a day and its times stagger in. Pick a time and Confirm slides up, then turns into a check and a Booked summary." },
  { slug: "notification-stack", title: "Notification stack", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "Notifications land on top of a soft stack and the unread badge pops. Hover to fan them out. Swipe or tap X to dismiss and the rest settle up." },
  { slug: "token-swap", title: "Token swap", kind: ["Inputs", "Actions", "Feedback"], input: ["pointer", "touch", "keys"], description: "Type an amount and the quote rolls. Flip and the rows trade places. Swap goes from Confirming to a check, and the rate refreshes on a ring." },
  { slug: "watchlist", title: "Watchlist", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "Top movers re-rank live. A tick flashes the price and the row glides to its new place. Hover to pause." },
  { slug: "split-bill", title: "Split bill", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "Friends join the bill and everyone's share rolls down. Requests go out and each one ticks over to Paid." },
  { slug: "flash-sale", title: "Flash sale", kind: ["Feedback", "Surfaces"], input: ["pointer", "touch", "keys"], description: "Stock drains, the claimed count rolls and the clock ticks until it sells out and turns into a waitlist." },
  { slug: "price-alert", title: "Price alert", kind: ["Feedback"], input: ["pointer", "touch", "keys"], description: "The price walks up to your alert line and crosses it. The alert drops in and the bell rings." },
];

/** Apply CMS overrides (title, description, notes, order). Blocks without an entry keep code order after those with one. */
export function mergeLab(entries: LabEntry[]): LabMeta[] {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const merged = labBlocks.map((b, i) => {
    const e = bySlug.get(b.slug);
    return {
      meta: {
        ...b,
        title: e?.title || b.title,
        description: (typeof e?.data?.description === "string" && e.data.description) || b.description,
        body: e?.body || undefined,
      },
      order: e ? e.sort_order : 1000 + i,
    };
  });
  return merged.sort((a, b) => a.order - b.order).map((m) => m.meta);
}
