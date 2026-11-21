/* Modules: countdown, phone input, sortable list, cookie consent, inbox.
 * Event delegation on document, so markup swapped in by htmx works without re-init.
 *   Countdown  [data-asta-countdown="ISO date"] ticks [data-unit=d|h|m|s] every second, rests off screen,
 *              sets data-done and fires "asta:countdown-done" at zero
 *   Phone      [data-asta-phone]: formats digits with the selected option's data-mask, fills name="*_e164",
 *              sets data-valid when complete
 *   Sortable   [data-asta-sortable]: drag a .asta-sortable-handle, or Space to grab, arrows to move, Space to drop,
 *              Esc to cancel. Fires "asta:reorder" with detail.order (data-id values)
 *   Consent    [data-asta-consent="key"]: [data-asta-consent-accept|reject|save|customize|back], remembers the choice
 *              in localStorage and fires "asta:consent" with detail { necessary, ... }
 *   Inbox      [data-asta-inbox]: a row click moves aria-current, clears data-unread and opens the message on narrow
 *              containers; [data-asta-inbox-back] returns to the list
 */
(() => {
  if (window.astaModules) return;
  window.astaModules = true;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const fire = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  /* ---------- Countdown ---------- */

  const pad = (n) => String(n).padStart(2, "0");
  const seen = new WeakSet();
  const onScreen = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => onScreen[e.isIntersecting ? "add" : "delete"](e.target))) : null;
  function paint(cd) {
    const end = Date.parse(cd.getAttribute("data-asta-countdown"));
    if (Number.isNaN(end)) return;
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const units = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
    // Without a days slot, hours carry the days.
    if (!cd.querySelector('[data-unit="d"]')) units.h += units.d * 24;
    cd.querySelectorAll("[data-unit]").forEach((v) => {
      const next = pad(units[v.getAttribute("data-unit")] ?? 0);
      if (v.textContent === next) return;
      v.textContent = next;
      v.removeAttribute("data-tick");
      void v.offsetWidth;
      v.setAttribute("data-tick", "");
    });
    if (s === 0 && !cd.hasAttribute("data-done")) {
      cd.setAttribute("data-done", "");
      fire(cd, "asta:countdown-done");
    }
  }
  function scan() {
    document.querySelectorAll("[data-asta-countdown]").forEach((cd) => {
      if (!seen.has(cd)) {
        seen.add(cd);
        if (io) io.observe(cd);
        else onScreen.add(cd);
        paint(cd);
      }
    });
    onScreen.forEach((cd) => {
      if (cd.isConnected) return paint(cd);
      onScreen.delete(cd);
      io?.unobserve(cd);
    });
  }
  let timer = 0;
  const run = () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(scan, 1000);
    scan();
  };
  document.addEventListener("visibilitychange", run);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();

  /* ---------- Phone input ---------- */

  function format(digits, mask) {
    let out = "";
    let i = 0;
    for (const c of mask) {
      if (i >= digits.length) break;
      out += c === "#" ? digits[i++] : c;
    }
    return out + digits.slice(i);
  }
  function phone(root) {
    const sel = root.querySelector(".asta-phone-country");
    const input = root.querySelector(".asta-phone-input");
    if (!sel || !input) return;
    const opt = sel.selectedOptions[0];
    const mask = opt?.getAttribute("data-mask") || "";
    const max = (mask.match(/#/g) || []).length;
    const digits = input.value.replace(/\D/g, "").slice(0, max || 15);
    input.value = format(digits, mask);
    const valid = max > 0 && digits.length === max;
    root.toggleAttribute("data-valid", valid);
    const hidden = root.querySelector('input[type="hidden"][name$="_e164"]');
    if (hidden) hidden.value = valid ? `${sel.value}${digits}` : "";
  }
  document.addEventListener("input", (e) => {
    const root = el(e)?.closest("[data-asta-phone]");
    if (root) phone(root);
  });
  document.addEventListener("change", (e) => {
    const root = el(e)?.closest("[data-asta-phone]");
    if (root) phone(root);
  });

  /* ---------- Sortable list ---------- */

  const order = (list) => [...list.querySelectorAll(":scope > .asta-sortable-item")].map((i) => i.getAttribute("data-id"));
  function flip(list, mutate) {
    const items = [...list.children];
    const before = new Map(items.map((i) => [i, i.getBoundingClientRect().top]));
    mutate();
    if (reduce()) return;
    items.forEach((i) => {
      const d = before.get(i) - i.getBoundingClientRect().top;
      if (d) i.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  }
  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    const handle = el(e)?.closest("[data-asta-sortable] .asta-sortable-handle");
    if (!handle || e.button !== 0) return;
    const item = handle.closest(".asta-sortable-item");
    const list = item.parentElement;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    item.setAttribute("data-dragging", "");
    drag = { item, list, handle, y: e.clientY, start: order(list).join() };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { item, list } = drag;
    const prev = item.previousElementSibling;
    const next = item.nextElementSibling;
    if (prev && e.clientY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) flip(list, () => list.insertBefore(item, prev));
    else if (next && e.clientY > next.getBoundingClientRect().top + next.offsetHeight / 2) flip(list, () => list.insertBefore(next, item));
  });
  const drop = () => {
    if (!drag) return;
    const { item, list, start } = drag;
    item.removeAttribute("data-dragging");
    drag = null;
    if (order(list).join() !== start) fire(list, "asta:reorder", { order: order(list) });
  };
  document.addEventListener("pointerup", drop);
  document.addEventListener("pointercancel", drop);
  document.addEventListener("keydown", (e) => {
    const handle = el(e)?.closest("[data-asta-sortable] .asta-sortable-handle");
    if (!handle) return;
    const item = handle.closest(".asta-sortable-item");
    const list = item.parentElement;
    const grabbed = item.hasAttribute("data-dragging");
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (grabbed) {
        item.removeAttribute("data-dragging");
        if (order(list).join() !== list.dataset.astaStart) fire(list, "asta:reorder", { order: order(list) });
      } else {
        item.setAttribute("data-dragging", "");
        list.dataset.astaStart = order(list).join();
      }
    } else if (grabbed && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const to = e.key === "ArrowUp" ? item.previousElementSibling : item.nextElementSibling?.nextElementSibling;
      if (e.key === "ArrowDown" && !item.nextElementSibling) return;
      flip(list, () => list.insertBefore(item, to ?? null));
      handle.focus();
    } else if (grabbed && e.key === "Escape") {
      const ids = (list.dataset.astaStart || "").split(",");
      flip(list, () => ids.forEach((id) => list.appendChild(list.querySelector(`:scope > [data-id="${id}"]`))));
      item.removeAttribute("data-dragging");
      handle.focus();
    }
  });

  /* ---------- Cookie consent ---------- */

  const store = {
    get(k) {
      try {
        return JSON.parse(localStorage.getItem(k) || "null");
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    },
  };
  function consentInit() {
    document.querySelectorAll("[data-asta-consent]:not([data-state])").forEach((b) => {
      b.setAttribute("data-state", store.get(b.getAttribute("data-asta-consent") || "consent") ? "closed" : "open");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", consentInit, { once: true });
  else consentInit();
  document.addEventListener("htmx:afterSettle", consentInit);
  document.addEventListener("click", (e) => {
    const t = el(e);
    const box = t?.closest("[data-asta-consent]");
    if (!box) return;
    const btn = t.closest("[data-asta-consent-accept],[data-asta-consent-reject],[data-asta-consent-save],[data-asta-consent-customize],[data-asta-consent-back]");
    if (!btn) return;
    if (btn.hasAttribute("data-asta-consent-customize") || btn.hasAttribute("data-asta-consent-back")) {
      e.preventDefault();
      box.setAttribute("data-view", btn.hasAttribute("data-asta-consent-back") ? "summary" : "custom");
      return;
    }
    e.preventDefault();
    const boxes = [...box.querySelectorAll('input[type="checkbox"][name]')];
    const all = btn.hasAttribute("data-asta-consent-accept");
    const none = btn.hasAttribute("data-asta-consent-reject");
    const choice = { necessary: true };
    boxes.forEach((c) => (choice[c.name] = c.disabled ? c.checked : all ? true : none ? false : c.checked));
    store.set(box.getAttribute("data-asta-consent") || "consent", choice);
    box.setAttribute("data-state", "closed");
    fire(box, "asta:consent", choice);
  });

  /* ---------- Inbox ---------- */

  document.addEventListener("click", (e) => {
    const t = el(e);
    const inbox = t?.closest("[data-asta-inbox]");
    if (!inbox) return;
    if (t.closest("[data-asta-inbox-back]")) {
      inbox.setAttribute("data-view", "list");
      return;
    }
    const row = t.closest(".asta-inbox-row");
    if (!row) return;
    inbox.querySelectorAll('.asta-inbox-row[aria-current="true"]').forEach((r) => r.removeAttribute("aria-current"));
    row.setAttribute("aria-current", "true");
    row.removeAttribute("data-unread");
    inbox.setAttribute("data-view", "message");
    const pane = inbox.querySelector(".asta-inbox-pane");
    if (pane) {
      pane.removeAttribute("data-fresh");
      void pane.offsetWidth;
      pane.setAttribute("data-fresh", "");
    }
  });
})();
