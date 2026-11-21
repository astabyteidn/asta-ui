"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

const load = (fn: () => Promise<{ default: ComponentType }>) => dynamic(fn, { ssr: false });

/** slug → live component. Keep in sync with `lib/lab.ts`. */
export const labComponents: Record<string, ComponentType> = {
  "hold-to-confirm": load(() => import("./blocks/HoldToConfirm")),
  "scramble-text": load(() => import("./blocks/ScrambleText")),
  "spotlight-grid": load(() => import("./blocks/SpotlightGrid")),
  "elastic-string": load(() => import("./blocks/ElasticString")),
  "ink-trail": load(() => import("./blocks/InkTrail")),
  "gravity-pills": load(() => import("./blocks/GravityPills")),
  "dial-knob": load(() => import("./blocks/DialKnob")),
  "morse-tap": load(() => import("./blocks/MorseTap")),
  "split-flap": load(() => import("./blocks/SplitFlap")),
  "combo-lock": load(() => import("./blocks/ComboLock")),
  "needle-field": load(() => import("./blocks/NeedleField")),
  "snap-grid": load(() => import("./blocks/SnapGrid")),
  "pixel-reveal": load(() => import("./blocks/PixelReveal")),
  "bubble-wrap": load(() => import("./blocks/BubbleWrap")),
  "price-chart": load(() => import("./blocks/PriceChart")),
  "candlestick": load(() => import("./blocks/Candlestick")),
  "order-book": load(() => import("./blocks/OrderBook")),
  "trade-ticket": load(() => import("./blocks/TradeTicket")),
  "card-checkout": load(() => import("./blocks/CardCheckout")),
  "payment-status": load(() => import("./blocks/PaymentStatus")),
  "pay-methods": load(() => import("./blocks/PayMethods")),
  "add-to-cart": load(() => import("./blocks/AddToCart")),
  "variant-picker": load(() => import("./blocks/VariantPicker")),
  "cart-drawer": load(() => import("./blocks/CartDrawer")),
  "plan-switcher": load(() => import("./blocks/PlanSwitcher")),
  "shipment-tracker": load(() => import("./blocks/ShipmentTracker")),
  "payment-received": load(() => import("./blocks/PaymentReceived")),
  "wishlist": load(() => import("./blocks/Wishlist")),
  "chat-thread": load(() => import("./blocks/ChatThread")),
  "seat-picker": load(() => import("./blocks/SeatPicker")),
  "now-playing": load(() => import("./blocks/NowPlaying")),
  "booking-slots": load(() => import("./blocks/BookingSlots")),
  "notification-stack": load(() => import("./blocks/NotificationStack")),
  "token-swap": load(() => import("./blocks/TokenSwap")),
  "watchlist": load(() => import("./blocks/Watchlist")),
  "split-bill": load(() => import("./blocks/SplitBill")),
  "flash-sale": load(() => import("./blocks/FlashSale")),
  "price-alert": load(() => import("./blocks/PriceAlert")),
};
