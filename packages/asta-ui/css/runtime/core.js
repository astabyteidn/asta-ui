/* Astabyte UI runtime for the HTML + CSS layer. One small script, no dependencies.
 * Everything is wired with event delegation on document, so markup swapped in by htmx works without re-init.
 *   Dialog  <dialog class="asta-dialog">, opened by [data-asta-open="id"], closed by [data-asta-close]
 *   Toast   asta.toast({ title, description, tone, duration, action: { label, href | event, detail } }),
 *           HX-Trigger "asta:toast", <template data-asta-toast>
 *   Tabs    [data-asta-tabs] with [role=tab][aria-controls] and [role=tabpanel]
 *   Menu    [data-asta-menu] with [data-asta-menu-trigger] and [role=menu] holding [role=menuitem]
 */
(() => {
  if (window.asta) return;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const byId = (id) => (id ? document.getElementById(id) : null);

  /* ---------- Dialog ---------- */

  function open(d) {
    if (d && !d.open) d.showModal();
  }
  function close(d) {
    if (!d || !d.open || d.dataset.closing) return;
    // Let the CSS exit transition run before the dialog leaves the top layer.
    if (reduce()) return d.close();
    d.dataset.closing = "";
    const done = () => {
      delete d.dataset.closing;
      d.close();
    };
    const t = setTimeout(done, 320);
    d.addEventListener("transitionend", function end(e) {
      if (e.target !== d || e.propertyName !== "opacity") return;
      d.removeEventListener("transitionend", end);
      clearTimeout(t);
      done();
    });
  }

  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const opener = t.closest("[data-asta-open]");
    if (opener) {
      e.preventDefault();
      open(byId(opener.getAttribute("data-asta-open")));
      return;
    }
    const closer = t.closest("[data-asta-close]");
    if (closer) {
      close(closer.closest("dialog"));
      return;
    }
    // A click on the backdrop lands on the <dialog> itself, outside the panel's box.
    if (t.matches("dialog.asta-dialog[open]")) {
      const r = t.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(t);
    }
  });
  document.addEventListener(
    "cancel",
    (e) => {
      if (e.target.matches?.("dialog.asta-dialog")) {
        e.preventDefault();
        close(e.target);
      }
    },
    true,
  );
  document.addEventListener("asta:open", (e) => open(byId(e.detail?.id)));
  document.addEventListener("asta:close", (e) => close(byId(e.detail?.id)));

  /* ---------- Toast ---------- */

  const TONE = {
    success: { color: "#30a46c", path: "M4.5 8.5l2.2 2.2L11.5 5.5" },
    error: { color: "#e5484d", path: "M8 4.5v4M8 11h.01" },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // The stack sits bottom right, toasts tucked behind each other. Hover or focus fans it out and pauses every
  // timer. Swipe a toast sideways to dismiss it. At most three show; the rest wait behind.
  const MAX = 3;
  const GAP = 8;
  let fanned = false;
  let list = null;

  function stack() {
    if (list?.isConnected) return list;
    const section = document.createElement("section");
    section.id = "asta-toasts";
    section.setAttribute("aria-label", "Notifications");
    section.className = "fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-[340px]";
    list = document.createElement("ol");
    list.setAttribute("aria-live", "polite");
    list.className = "relative";
    section.append(list);
    section.addEventListener("pointerenter", () => fan(true));
    section.addEventListener("pointerleave", () => fan(false));
    section.addEventListener("focusin", () => fan(true));
    section.addEventListener("focusout", (e) => section.contains(e.relatedTarget) || fan(false));
    document.body.append(section);
    return list;
  }

  const live = () => (list ? [...list.children].filter((li) => !li.dataset.leaving).reverse() : []); // newest first

  function fan(on) {
    if (fanned === on) return;
    fanned = on;
    for (const li of live()) on ? pause(li) : run(li);
    layout();
  }

  function place(li, dx = 0) {
    const ty = !li._shown ? 24 : li.dataset.leaving === "down" ? 16 : li._y;
    li.style.transform = `translate3d(${dx}px, ${ty}px, 0) scale(${li._scale})`;
  }

  function layout() {
    const items = live();
    const front = items[0]?.firstElementChild.offsetHeight;
    let above = 0;
    items.forEach((li, i) => {
      const tucked = !fanned && i > 0;
      li._y = i === 0 ? 0 : fanned ? -above : -i * 12;
      li._scale = tucked ? 1 - i * 0.05 : 1;
      above += li.firstElementChild.offsetHeight + GAP;
      li.style.zIndex = String(100 - i);
      li.style.height = tucked ? `${front}px` : "";
      li.firstElementChild.style.opacity = tucked ? "0" : "";
      const off = !li._shown || i >= MAX;
      li.style.opacity = off ? "0" : "";
      li.style.pointerEvents = off ? "none" : "";
      place(li);
    });
  }

  function run(li) {
    if (fanned || li.dataset.leaving) return;
    li._start = Date.now();
    li._timer = setTimeout(() => leave(li, "down"), li._left);
  }
  function pause(li) {
    clearTimeout(li._timer);
    li._left = Math.max(800, li._left - (Date.now() - li._start));
  }

  function toast(t) {
    if (!t || !t.title) return;
    const tone = TONE[t.tone];
    const li = document.createElement("li");
    li.className =
      "asta-toast absolute bottom-0 left-0 right-0 origin-bottom touch-pan-y select-none overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_10%,transparent),0_12px_30px_-14px_rgb(0_0_0/0.35)]";
    li.setAttribute("role", t.tone === "error" ? "alert" : "status");
    const a = t.action;
    const safe = (u) => /^(https?:\/\/|\/(?!\/)|\.{0,2}\/|\?|#)/i.test(String(u ?? ""));
    const action = a?.label
      ? a.href && safe(a.href)
        ? `<a href="${esc(a.href)}" data-asta-toast-action class="flex h-7 shrink-0 items-center rounded-lg bg-ink px-2.5 text-[12px] font-medium text-paper outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand/50">${esc(a.label)}</a>`
        : `<button type="button" data-asta-toast-action class="h-7 shrink-0 rounded-lg bg-ink px-2.5 text-[12px] font-medium text-paper outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand/50">${esc(a.label)}</button>`
      : `<button type="button" data-asta-toast-close aria-label="Dismiss" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"><svg viewBox="0 0 16 16" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m4.5 4.5 7 7M11.5 4.5l-7 7"/></svg></button>`;
    li.innerHTML = `<div class="flex items-start gap-3 p-3.5 pr-3 transition-opacity">${
      tone
        ? `<span class="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style="background:${tone.color}"><svg viewBox="0 0 16 16" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${tone.path}"/></svg></span>`
        : ""
    }<div class="min-w-0 flex-1"><p class="text-[13.5px] font-medium leading-5 tracking-[-0.01em] text-ink">${esc(t.title)}</p>${
      t.description ? `<p class="mt-0.5 text-[12.5px] leading-snug text-mute">${esc(t.description)}</p>` : ""
    }</div>${action}</div>`;

    li._left = t.duration || 4000;
    li._scale = 1;
    li._y = 0;
    stack().append(li);
    layout();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        li._shown = true;
        layout();
      }),
    );
    run(li);

    li.querySelector("[data-asta-toast-close]")?.addEventListener("click", () => leave(li, "down"));
    li.querySelector("[data-asta-toast-action]")?.addEventListener("click", () => {
      // An action names an event (dispatched on document, with the toast's data) or a link.
      if (a.event) document.dispatchEvent(new CustomEvent(a.event, { detail: a.detail ?? null, bubbles: true }));
      leave(li, "down");
    });

    // Swipe sideways to dismiss.
    let drag = null;
    li.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a")) return;
      li.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, t: Date.now() };
      li.style.transition = "none";
    });
    li.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      place(li, dx);
      li.style.opacity = String(1 - Math.min(0.7, Math.abs(dx) / 260));
    });
    const drop = (e, cancel) => {
      if (!drag) return;
      const dx = cancel ? 0 : e.clientX - drag.x;
      const v = Math.abs(dx) / Math.max(1, Date.now() - drag.t);
      drag = null;
      li.style.transition = "";
      if (Math.abs(dx) > 90 || v > 0.6) leave(li, dx < 0 ? "left" : "right");
      else layout();
    };
    li.addEventListener("pointerup", (e) => drop(e, false));
    li.addEventListener("pointercancel", (e) => drop(e, true));
  }

  function leave(li, dir = "down") {
    if (!li || li.dataset.leaving) return;
    clearTimeout(li._timer);
    li.dataset.leaving = dir;
    li.style.opacity = "0";
    li.style.pointerEvents = "none";
    place(li, dir === "left" ? -380 : dir === "right" ? 380 : 0);
    layout();
    setTimeout(() => li.remove(), reduce() ? 0 : 260);
  }

  // htmx hands a non-object HX-Trigger value over as { value }, so a list of toasts arrives wrapped.
  const toasts = (d) => {
    if (d && !d.title && d.value !== undefined) d = d.value;
    (Array.isArray(d) ? d : [d]).forEach(toast);
  };
  document.addEventListener("asta:toast", (e) => toasts(e.detail));

  /* ---------- Tabs ---------- */

  // A shown panel gets "asta:show", so hx-trigger="asta:show once" loads it lazily.
  function select(tab, focus) {
    const root = tab.closest("[data-asta-tabs]");
    if (!root) return;
    for (const t of root.querySelectorAll('[role="tab"]')) {
      if (t.closest("[data-asta-tabs]") !== root) continue;
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = byId(t.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !on;
        if (on) panel.dispatchEvent(new CustomEvent("asta:show", { bubbles: true }));
      }
    }
    if (focus) tab.focus();
    slide(tab.closest('[role="tablist"]'), true);
    root.dispatchEvent(new CustomEvent("asta:tab", { bubbles: true, detail: { tab } }));
  }

  // The indicator moves with transform only. Its width is set once per change, and a scaleX from the old width
  // to the new one (FLIP) hides the jump.
  function slide(list, animate) {
    const bar = list?.querySelector(":scope > [data-asta-tab-indicator]");
    const tab = list?.querySelector('[role="tab"][aria-selected="true"]');
    if (!bar || !tab) return;
    const x = tab.offsetLeft;
    const w = tab.offsetWidth;
    const px = parseFloat(bar.dataset.x ?? "");
    const pw = parseFloat(bar.dataset.w ?? "");
    bar.dataset.x = x;
    bar.dataset.w = w;
    bar.style.width = `${w}px`;
    if (!animate || reduce() || !pw || (px === x && pw === w)) {
      bar.style.transition = "none";
      bar.style.transform = `translateX(${x}px)`;
      bar.style.opacity = "1";
      void bar.offsetWidth;
      bar.style.transition = "";
      return;
    }
    bar.style.transition = "none";
    bar.style.transform = `translateX(${px}px) scaleX(${pw / w})`;
    void bar.offsetWidth;
    bar.style.transition = "";
    bar.style.transform = `translateX(${x}px)`;
  }

  // Re-measure when a tab list or a tab changes size (layout, fonts), never per frame.
  const sized = new ResizeObserver((entries) => {
    const lists = new Set(entries.map((e) => e.target.closest('[role="tablist"]')));
    for (const list of lists) slide(list, false);
  });
  function watchTabs(el) {
    for (const bar of el.querySelectorAll("[data-asta-tab-indicator]")) {
      const list = bar.parentElement;
      if (list.dataset.astaWatched !== undefined) continue;
      list.dataset.astaWatched = "";
      sized.observe(list);
      for (const t of list.querySelectorAll('[role="tab"]')) sized.observe(t);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => watchTabs(document));
  else watchTabs(document);
  document.addEventListener("htmx:afterSettle", (e) => watchTabs(e.detail?.elt?.parentElement || document));

  document.addEventListener("click", (e) => {
    const tab = e.target instanceof Element && e.target.closest('[data-asta-tabs] [role="tab"]');
    if (tab && !tab.disabled) select(tab, false);
  });
  document.addEventListener("keydown", (e) => {
    const tab = e.target instanceof Element && e.target.closest('[data-asta-tabs] [role="tab"]');
    if (!tab) return;
    const list = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]:not([disabled])')];
    const i = list.indexOf(tab);
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    // A click, so hx-get on a tab fires from the keyboard too. The click handler selects it.
    const to = list[(next + list.length) % list.length];
    to.focus();
    to.click();
  });

  /* ---------- Menu ---------- */

  // The nearest ancestor that cuts off overflow, if any.
  function clipper(el) {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (/auto|scroll|hidden|clip/.test(o.overflowX + o.overflowY)) return p;
    }
    return null;
  }
  // A pinned menu doesn't follow its trigger, so close it when anything scrolls.
  addEventListener(
    "scroll",
    () => {
      for (const m of document.querySelectorAll("[data-asta-menu][data-pinned][data-open]")) setMenu(m, false);
    },
    { capture: true, passive: true },
  );
  const items = (m) => [...m.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"]):not([disabled])')];
  function setMenu(root, on, focusFirst) {
    const trigger = root.querySelector("[data-asta-menu-trigger]");
    const menu = root.querySelector('[role="menu"]');
    if (!trigger || !menu) return;
    if (on) {
      for (const other of document.querySelectorAll("[data-asta-menu][data-open]")) if (other !== root) setMenu(other, false);
      root.setAttribute("data-open", "");
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      menu.style.cssText = "";
      const r = menu.getBoundingClientRect();
      const box = clipper(root)?.getBoundingClientRect();
      if (box && (r.bottom > box.bottom || r.right > box.right || r.left < box.left)) {
        // Inside a scroll box (a table, a card) the menu would be cut off, so pin it to the viewport instead.
        const t = trigger.getBoundingClientRect();
        const up = t.bottom + r.height + 6 > innerHeight - 8 && t.top - r.height - 6 > 8;
        const left = root.getAttribute("data-align") === "end" ? t.right - r.width : t.left;
        Object.assign(menu.style, {
          position: "fixed",
          margin: "0",
          right: "auto",
          bottom: "auto",
          top: `${up ? t.top - r.height - 6 : t.bottom + 6}px`,
          left: `${Math.max(8, Math.min(left, innerWidth - r.width - 8))}px`,
        });
        root.toggleAttribute("data-up", up);
        root.setAttribute("data-pinned", "");
      } else {
        // Flip up when there's no room below.
        root.toggleAttribute("data-up", r.bottom > innerHeight - 8 && r.top - r.height > 8);
        root.removeAttribute("data-pinned");
      }
      if (focusFirst) items(menu)[0]?.focus({ preventScroll: true });
    } else if (root.hasAttribute("data-open")) {
      root.removeAttribute("data-open");
      trigger.setAttribute("aria-expanded", "false");
      setTimeout(() => {
        if (!root.hasAttribute("data-open")) menu.hidden = true;
      }, reduce() ? 0 : 160);
    }
  }
  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const trigger = t?.closest("[data-asta-menu-trigger]");
    if (trigger) {
      const root = trigger.closest("[data-asta-menu]");
      setMenu(root, !root.hasAttribute("data-open"), e.detail === 0);
      return;
    }
    const item = t?.closest('[data-asta-menu] [role="menuitem"]');
    for (const root of document.querySelectorAll("[data-asta-menu][data-open]")) {
      if (item && root.contains(item)) {
        if (!item.hasAttribute("data-keep-open")) setMenu(root, false);
      } else if (!root.contains(t)) setMenu(root, false);
    }
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const root = t?.closest("[data-asta-menu]");
    if (!root) return;
    const menu = root.querySelector('[role="menu"]');
    const trigger = root.querySelector("[data-asta-menu-trigger]");
    if (t === trigger && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setMenu(root, true, true);
      return;
    }
    if (!root.hasAttribute("data-open")) return;
    const list = items(menu);
    const i = list.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setMenu(root, false);
      trigger.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      list[e.key === "Home" ? 0 : list.length - 1]?.focus();
    } else if (e.key === "Tab") setMenu(root, false);
  });

  /* ---------- Boot and htmx ---------- */

  function scan(el) {
    for (const d of el.querySelectorAll("dialog.asta-dialog[data-asta-autoopen]")) {
      d.removeAttribute("data-asta-autoopen");
      open(d);
    }
    for (const tpl of el.querySelectorAll("template[data-asta-toast]")) {
      try {
        toasts(JSON.parse(tpl.getAttribute("data-asta-toast")));
      } catch {}
      tpl.remove();
    }
  }
  const boot = () => scan(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("htmx:afterSettle", (e) => scan(e.detail?.elt?.parentElement || document));

  window.asta = { toast, open: (id) => open(byId(id)), close: (id) => close(byId(id)), version: "0.7.0" };
})();
