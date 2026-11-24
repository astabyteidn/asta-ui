/* Agent: elapsed timers and tool approval.
 * Event delegation on document, so markup swapped in by htmx works without re-init.
 *   Elapsed   [data-asta-elapsed="<epoch ms>"] counts up from that time, or from when it first shows with "now" ("12s", "1m 04s"; inside an agent plan "4.2s"
 *             under ten seconds). Rests off screen and in hidden tabs. Remove the attribute to stop it.
 *   Tool      [data-asta-tool-approval]: [data-asta-decide="deny|once|always"] inside a .asta-tool-approval-card, or
 *             Enter (allow once) / Esc (deny) while the card has focus. The card becomes a receipt in
 *             .asta-tool-approval-receipts, queued calls to an always-allowed tool follow on their own ("auto"), and
 *             "asta:tool-decision" fires with detail { id, tool, decision }. Cancel it to handle the swap yourself.
 */
(() => {
  if (window.astaAgent) return;
  window.astaAgent = true;
  const el = (e) => (e.target instanceof Element ? e.target : null);

  /* ---------- Elapsed ---------- */

  const seen = new WeakSet();
  const onScreen = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => onScreen[e.isIntersecting ? "add" : "delete"](e.target))) : null;
  const fmt = (ms, tenths) => {
    const s = Math.max(0, ms) / 1000;
    if (tenths && s < 10) return `${s.toFixed(1)}s`;
    if (s < 60) return `${Math.floor(s)}s`;
    return `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;
  };
  function paint(node) {
    if (node.getAttribute("data-asta-elapsed") === "now") node.setAttribute("data-asta-elapsed", String(Date.now()));
    const from = Number(node.getAttribute("data-asta-elapsed"));
    if (!Number.isFinite(from) || from <= 0) return;
    const next = fmt(Date.now() - from, !!node.closest(".asta-agent-plan"));
    if (node.textContent !== next) node.textContent = next;
  }
  function scan() {
    document.querySelectorAll("[data-asta-elapsed]").forEach((n) => {
      if (seen.has(n)) return;
      seen.add(n);
      if (io) io.observe(n);
      else onScreen.add(n);
      paint(n);
    });
    onScreen.forEach((n) => {
      if (n.isConnected && n.hasAttribute("data-asta-elapsed")) return paint(n);
      onScreen.delete(n);
      seen.delete(n);
      io?.unobserve(n);
    });
  }
  let timer = 0;
  const run = () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(scan, 500);
    scan();
  };
  document.addEventListener("visibilitychange", run);

  /* ---------- Tool approval ---------- */

  const WORD = { deny: "Denied", once: "Allowed", always: "Always allowed", auto: "Auto-allowed" };
  const NS = "http://www.w3.org/2000/svg";
  const PATH = { ok: "m3.5 8.5 3 3 6-7", deny: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM3.8 12.2l8.4-8.4" };

  function icon(d) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.append(p);
    return svg;
  }

  function receipt(card, decision) {
    const li = document.createElement("li");
    li.className = "asta-tool-approval-receipt";
    li.dataset.decision = decision;
    if (card.dataset.id) li.dataset.id = card.dataset.id;
    const word = document.createElement("b");
    word.textContent = WORD[decision];
    const sep = document.createElement("span");
    sep.className = "asta-tool-approval-receipt-sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "·";
    const code = document.createElement("code");
    code.textContent = card.dataset.tool || card.querySelector(".asta-tool-approval-tool")?.textContent || "tool";
    li.append(icon(decision === "deny" ? PATH.deny : PATH.ok), word, sep, code);
    const sum = card.querySelector(".asta-tool-approval-summary")?.textContent;
    if (sum) {
      const s = document.createElement("span");
      s.className = "asta-tool-approval-receipt-summary";
      s.textContent = sum;
      li.append(s);
    }
    return li;
  }

  // Queue look and "n of total" labels.
  function sync(root) {
    const queue = root.querySelector(".asta-tool-approval-queue");
    const cards = queue ? [...queue.querySelectorAll(":scope > .asta-tool-approval-card")] : [];
    const done = root.querySelectorAll(".asta-tool-approval-receipt").length;
    const total = done + cards.length;
    if (queue) {
      if (cards.length > 1) queue.setAttribute("data-more", String(Math.min(2, cards.length - 1)));
      else queue.removeAttribute("data-more");
    }
    cards.forEach((c, i) => {
      const n = c.querySelector(".asta-tool-approval-count");
      if (n) n.textContent = total > 1 ? `${done + i + 1} of ${total}` : "";
      if (n) n.hidden = total < 2;
      if (i === 0 && total > 1) c.setAttribute("aria-label", `Approve ${c.dataset.tool || "tool"}, ${done + 1} of ${total}`);
    });
  }

  function decide(card, decision) {
    const root = card.closest("[data-asta-tool-approval]");
    if (!root || !card.isConnected) return;
    const detail = { id: card.dataset.id, tool: card.dataset.tool, decision };
    if (!card.dispatchEvent(new CustomEvent("asta:tool-decision", { bubbles: true, cancelable: true, detail }))) return;
    const refocus = card.contains(document.activeElement);
    let list = root.querySelector(".asta-tool-approval-receipts");
    if (!list) {
      list = document.createElement("ul");
      list.className = "asta-tool-approval-receipts";
      list.setAttribute("aria-label", "Tool calls");
      root.prepend(list);
    }
    list.append(receipt(card, decision));
    card.remove();
    if (decision === "always" && card.dataset.tool) {
      root.querySelectorAll(`.asta-tool-approval-card[data-tool="${CSS.escape(card.dataset.tool)}"]`).forEach((c) => decide(c, "auto"));
    }
    sync(root);
    if (refocus) {
      const next = root.querySelector(".asta-tool-approval-queue > .asta-tool-approval-card");
      if (!next) list.tabIndex = -1;
      (next || list).focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", (e) => {
    const b = el(e)?.closest("[data-asta-decide]");
    const card = b?.closest(".asta-tool-approval-card");
    if (!card || b.disabled) return;
    decide(card, b.getAttribute("data-asta-decide"));
  });

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.isComposing) return;
    const t = el(e);
    const card = t?.closest(".asta-tool-approval-card");
    if (!card || t.closest("[data-asta-mpanel]")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      decide(card, "deny");
    } else if (e.key === "Enter" && !t.closest("button,a,input,textarea,select,summary")) {
      e.preventDefault();
      decide(card, "once");
    }
  });

  const init = () => {
    run();
    document.querySelectorAll("[data-asta-tool-approval]").forEach(sync);
  };
  document.addEventListener("htmx:load", () => document.querySelectorAll("[data-asta-tool-approval]").forEach(sync));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
