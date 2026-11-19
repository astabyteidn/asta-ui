/* Overlays: popover, hover card, dropdown and context menus, drawer drag, command palette, navbar, sidebar,
 * workspace switcher, footer newsletter and wordmark, announcement bar, stepper, tool dock.
 * Event delegation on document, so markup swapped in by htmx works. Dialog open/close comes from core (window.asta).
 *   Popover    [data-asta-popover][popover] opened by [popovertarget]
 *   HoverCard  [data-asta-hovercard][popover=manual] opened by [data-asta-hovercard-for]
 *   Menus      [data-asta-dropdown] / [data-asta-context-menu] holding [role=menu][data-asta-mpanel]
 *   Drawer     dialog.asta-drawer, [data-asta-drawer-handle] drags a bottom sheet
 *   Command    dialog[data-asta-command], ⌘K / Ctrl+K
 *   Navbar     [data-asta-navbar], Sidebar [data-asta-sidebar], ToolDock [data-asta-tooldock]
 *   Stepper    [data-asta-stepper], AnnouncementBar [data-asta-announce], Newsletter [data-asta-newsletter]
 */
(() => {
  if (window.__astaOverlays) return;
  window.__astaOverlays = true;

  const PAD = 8;
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elOf = (t) => (t instanceof Element ? t : null);
  const byId = (id) => (id ? document.getElementById(id) : null);
  const isOpen = (p) => !!p && p.matches(":popover-open");
  const showPop = (p, source) => {
    if (isOpen(p)) return;
    try {
      p.showPopover(source ? { source } : undefined);
    } catch {
      p.showPopover();
    }
  };
  const hidePop = (p) => {
    if (isOpen(p)) p.hidePopover();
  };
  const fire = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const typing = (t) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const num = (v, d) => {
    const n = parseInt(v ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? n : d;
  };

  /* ---------- Anchored placement (popover, hover card) ---------- */

  const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };

  // Measure, pick the side (flip if needed), clamp to the viewport, and point the growth origin at the trigger.
  function anchor(panel, a) {
    const want = panel.dataset.side || "bottom";
    const align = panel.dataset.align || "center";
    const offset = num(panel.dataset.offset, 8);
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const vw = innerWidth;
    const vh = innerHeight;
    const room = { top: a.top, bottom: vh - a.bottom, left: a.left, right: vw - a.right };
    let s = OPPOSITE[want] ? want : "bottom";
    const need = s === "top" || s === "bottom" ? h : w;
    if (room[s] < need + offset + PAD && room[OPPOSITE[s]] > room[s]) s = OPPOSITE[s];
    const vertical = s === "top" || s === "bottom";
    let x;
    let y;
    if (vertical) {
      x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
      y = s === "bottom" ? a.bottom + offset : a.top - offset - h;
      x = Math.min(Math.max(PAD, x), vw - w - PAD);
    } else {
      y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
      x = s === "right" ? a.right + offset : a.left - offset - w;
      y = Math.min(Math.max(PAD, y), vh - h - PAD);
    }
    const along = vertical ? Math.min(Math.max(14, a.left + a.width / 2 - x), w - 14) : Math.min(Math.max(14, a.top + a.height / 2 - y), h - 14);
    const nudge = { top: ["0px", "4px"], bottom: ["0px", "-4px"], left: ["4px", "0px"], right: ["-4px", "0px"] }[s];
    panel.style.left = `${Math.round(x)}px`;
    panel.style.top = `${Math.round(y)}px`;
    panel.style.transformOrigin = vertical ? `${along}px ${s === "bottom" ? "0" : "100%"}` : `${s === "right" ? "0" : "100%"} ${along}px`;
    panel.style.setProperty("--asta-nx", nudge[0]);
    panel.style.setProperty("--asta-ny", nudge[1]);
    panel.style.setProperty("--asta-gap", `${offset + 2}px`);
    panel.dataset.placed = s;
    const ar = panel.querySelector(":scope > [data-asta-arrow]");
    if (ar) {
      // The arrow box is 14×7. Its base overlaps the panel edge by 1px to hide the ring under it.
      ar.style.transform = `rotate(${{ bottom: 0, top: 180, left: 90, right: -90 }[s]}deg)`;
      ar.style.left = vertical ? `${along - 7}px` : s === "right" ? "-9.5px" : `${w - 4.5}px`;
      ar.style.top = vertical ? (s === "bottom" ? "-6px" : `${h - 1}px`) : `${along - 3.5}px`;
    }
  }

  // Open anchored panels follow their trigger on scroll and resize.
  const anchored = new Set();
  const follow = () => {
    for (const p of anchored) {
      if (!p.isConnected || !isOpen(p) || !p._astaAnchor?.isConnected) {
        anchored.delete(p);
        continue;
      }
      anchor(p, p._astaAnchor.getBoundingClientRect());
    }
  };
  addEventListener("scroll", () => anchored.size && follow(), { capture: true, passive: true });
  addEventListener("resize", () => anchored.size && follow());

  /* ---------- Popover ---------- */

  // The click is handled here, not by the browser, so the panel is placed before it paints.
  document.addEventListener(
    "pointerdown",
    (e) => {
      const btn = elOf(e.target)?.closest("[popovertarget]");
      const panel = btn && byId(btn.getAttribute("popovertarget"));
      if (panel?.hasAttribute("data-asta-popover")) btn._astaWasOpen = isOpen(panel);
    },
    true,
  );
  document.addEventListener("click", (e) => {
    const btn = elOf(e.target)?.closest("[popovertarget]");
    const panel = btn && byId(btn.getAttribute("popovertarget"));
    if (!panel?.hasAttribute("data-asta-popover") || btn.disabled) return;
    e.preventDefault();
    // A pointer press on the trigger may already have light-dismissed it: don't open it again.
    const was = btn._astaWasOpen ?? isOpen(panel);
    btn._astaWasOpen = undefined;
    if (was || isOpen(panel)) {
      hidePop(panel);
      return;
    }
    openPopover(panel, btn);
  });
  function openPopover(panel, btn) {
    panel._astaAnchor = btn;
    showPop(panel, btn);
    anchor(panel, btn.getBoundingClientRect());
    anchored.add(panel);
    btn.setAttribute("aria-expanded", "true");
    const first = panel.querySelector("[autofocus],[data-autofocus]") || panel.querySelector(FOCUSABLE);
    (first || panel).focus({ preventScroll: true });
  }
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;
      const p = elOf(e.target)?.closest("[data-asta-popover]");
      if (p) p._astaRefocus = true;
    },
    true,
  );
  document.addEventListener(
    "toggle",
    (e) => {
      const p = e.target;
      if (!(p instanceof HTMLElement) || !p.hasAttribute("data-asta-popover") || e.newState !== "closed") return;
      anchored.delete(p);
      p._astaAnchor?.setAttribute("aria-expanded", "false");
      // Focus goes back to the trigger after Escape, or when it was lost with the panel.
      if (p._astaRefocus || document.activeElement === document.body) p._astaAnchor?.focus({ preventScroll: true });
      p._astaRefocus = false;
    },
    true,
  );

  /* ---------- Hover card ---------- */

  const cardFor = (trigger) => byId(trigger.getAttribute("data-asta-hovercard-for"));
  const cardTrigger = (card) => card._astaAnchor || document.querySelector(`[data-asta-hovercard-for="${CSS.escape(card.id)}"]`);
  function cardLater(card, trigger, open) {
    clearTimeout(card._astaT);
    if (open === isOpen(card) && !(open && trigger !== card._astaAnchor)) return;
    const ms = open ? num(card.dataset.openDelay, 500) : num(card.dataset.closeDelay, 220);
    card._astaT = setTimeout(() => (open ? cardOpen(card, trigger) : cardClose(card)), ms);
  }
  function cardOpen(card, trigger) {
    clearTimeout(card._astaT);
    if (!trigger?.isConnected) return;
    card._astaAnchor = trigger;
    showPop(card);
    anchor(card, trigger.getBoundingClientRect());
    anchored.add(card);
    trigger.setAttribute("aria-describedby", card.id);
  }
  function cardClose(card) {
    clearTimeout(card._astaT);
    if (!isOpen(card)) return;
    hidePop(card);
    anchored.delete(card);
    card._astaAnchor?.removeAttribute("aria-describedby");
  }
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = elOf(e.target);
    const trigger = t?.closest("[data-asta-hovercard-for]");
    if (trigger && !trigger.contains(elOf(e.relatedTarget))) {
      const card = cardFor(trigger);
      if (card) cardLater(card, trigger, true);
    }
    const card = t?.closest("[data-asta-hovercard]");
    if (card) clearTimeout(card._astaT);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = elOf(e.target);
    const to = elOf(e.relatedTarget);
    const trigger = t?.closest("[data-asta-hovercard-for]");
    if (trigger && !trigger.contains(to)) {
      const card = cardFor(trigger);
      if (card && !card.contains(to)) cardLater(card, trigger, false);
    }
    const card = t?.closest("[data-asta-hovercard]");
    if (card && !card.contains(to) && !cardTrigger(card)?.contains(to)) cardLater(card, null, false);
  });
  document.addEventListener("focusin", (e) => {
    const t = elOf(e.target);
    const trigger = t?.closest("[data-asta-hovercard-for]");
    // Keyboard focus only: a mouse click shouldn't pop the card a second time.
    if (trigger?.matches(":focus-visible")) {
      const card = cardFor(trigger);
      if (card) cardLater(card, trigger, true);
    }
    const card = t?.closest("[data-asta-hovercard]");
    if (card) clearTimeout(card._astaT);
  });
  document.addEventListener("focusout", (e) => {
    const t = elOf(e.target);
    const to = elOf(e.relatedTarget);
    const trigger = t?.closest("[data-asta-hovercard-for]");
    const card = trigger ? cardFor(trigger) : t?.closest("[data-asta-hovercard]");
    if (!card || card.contains(to) || cardTrigger(card)?.contains(to)) return;
    cardLater(card, null, false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const t = elOf(e.target);
    const trigger = t?.closest("[data-asta-hovercard-for]");
    const card = trigger ? cardFor(trigger) : t?.closest("[data-asta-hovercard]");
    if (!card || !isOpen(card)) return;
    e.stopPropagation();
    const back = !trigger && card.contains(t);
    cardClose(card);
    if (back) card._astaAnchor?.focus({ preventScroll: true });
  });

  /* ---------- Menus: dropdown and context ---------- */

  const ROOTS = "[data-asta-dropdown],[data-asta-context-menu]";
  const panelOf = (root) => root.querySelector(":scope > [data-asta-mpanel]");
  const subOf = (item) => item.parentElement?.matches("[data-asta-menu-sub]") ? item.parentElement.querySelector(":scope > [data-asta-mpanel]") : null;
  const enabled = (i) => !i.disabled && i.getAttribute("aria-disabled") !== "true";
  const itemsOf = (panel) => [...panel.querySelectorAll('[role^="menuitem"]')].filter((i) => i.closest('[role="menu"]') === panel && enabled(i));
  const openRoots = () => [...document.querySelectorAll(`[data-asta-dropdown][data-open],[data-asta-context-menu][data-open]`)];

  // at: { x, y } for a context menu, { rect, align } under a trigger, { rect, sub: true } beside a parent item.
  function placeMenu(panel, at) {
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const vw = innerWidth;
    const vh = innerHeight;
    let x;
    let y;
    let right = false;
    let up = false;
    if (at.sub) {
      x = at.rect.right + 2;
      if (x + w > vw - PAD && at.rect.left - w - 2 >= PAD) {
        x = at.rect.left - w - 2;
        right = true;
      }
      // Line the first item up with the parent item (the panel has 6px of padding).
      y = at.rect.top - 6;
      panel.style.setProperty("--asta-nx", right ? "4px" : "-4px");
      panel.style.setProperty("--asta-ny", "0px");
    } else if (at.rect) {
      x = at.align === "end" ? at.rect.right - w : at.rect.left;
      y = at.rect.bottom + 6;
      if (y + h > vh - PAD && at.rect.top - h - 6 >= PAD) {
        y = at.rect.top - h - 6;
        up = true;
      }
      right = at.align === "end";
      panel.style.setProperty("--asta-nx", "0px");
      panel.style.setProperty("--asta-ny", up ? "4px" : "-4px");
    } else {
      x = at.x;
      y = at.y;
      if (x + w > vw - PAD && x - w >= PAD) {
        x -= w;
        right = true;
      }
      if (y + h > vh - PAD && y - h >= PAD) {
        y -= h;
        up = true;
      }
      panel.style.setProperty("--asta-nx", "0px");
      panel.style.setProperty("--asta-ny", "0px");
    }
    x = Math.max(PAD, Math.min(x, vw - w - PAD));
    y = Math.max(PAD, Math.min(y, vh - h - PAD));
    panel.style.left = `${Math.round(x)}px`;
    panel.style.top = `${Math.round(y)}px`;
    panel.style.transformOrigin = `${right ? "100%" : "0"} ${up ? "100%" : "0"}`;
  }

  function openPanel(panel, at, focusFirst) {
    showPop(panel);
    placeMenu(panel, at);
    const first = focusFirst && itemsOf(panel)[0];
    (first || panel).focus({ preventScroll: true });
  }
  function closeSubs(panel) {
    for (const sub of panel.querySelectorAll("[data-asta-mpanel]")) {
      if (!isOpen(sub)) continue;
      hidePop(sub);
      sub.parentElement?.querySelector(':scope > [aria-haspopup="menu"]')?.setAttribute("aria-expanded", "false");
    }
  }
  function openSub(item, focusFirst) {
    const panel = item.closest('[role="menu"]');
    const sub = subOf(item);
    if (!sub) return;
    clearTimeout(panel._astaT);
    // One open submenu per level.
    for (const other of panel.querySelectorAll(":scope [data-asta-menu-sub] > [data-asta-mpanel]")) {
      if (other !== sub && other.closest('[role="menu"]:not([data-asta-menu-sub] > *)') !== null && other.parentElement.closest('[role="menu"]') === panel && isOpen(other)) {
        closeSubs(other);
        hidePop(other);
        other.parentElement.querySelector(':scope > [aria-haspopup="menu"]')?.setAttribute("aria-expanded", "false");
      }
    }
    item.setAttribute("aria-expanded", "true");
    if (isOpen(sub)) {
      if (focusFirst) itemsOf(sub)[0]?.focus({ preventScroll: true });
      return;
    }
    openPanel(sub, { rect: item.getBoundingClientRect(), sub: true }, focusFirst);
    // Keep the highlight on the parent item while the pointer is on its way.
    if (!focusFirst) item.focus({ preventScroll: true });
  }
  function closeSub(sub, refocus) {
    closeSubs(sub);
    hidePop(sub);
    const item = sub.parentElement?.querySelector(':scope > [aria-haspopup="menu"]');
    item?.setAttribute("aria-expanded", "false");
    if (refocus) item?.focus({ preventScroll: true });
  }

  function openRoot(root, at, focusFirst) {
    for (const other of openRoots()) if (other !== root) closeRoot(other, false);
    const panel = panelOf(root);
    if (!panel) return;
    if (!root.hasAttribute("data-open")) {
      const a = document.activeElement;
      root._astaRestore = a && root.contains(a) && !panel.contains(a) ? a : root;
    }
    closeSubs(panel);
    root.setAttribute("data-open", "");
    root.querySelector(":scope > [data-asta-dropdown-trigger]")?.setAttribute("aria-expanded", "true");
    root._astaAt = performance.now();
    if (root.hasAttribute("data-match")) {
      const t = root.querySelector(":scope > [data-asta-dropdown-trigger]");
      if (t) panel.style.minWidth = `${t.offsetWidth}px`;
    }
    // Re-opening a context menu at a new point: hide first, so it animates in again.
    if (isOpen(panel)) hidePop(panel);
    openPanel(panel, at, focusFirst);
  }
  function closeRoot(root, refocus) {
    if (!root.hasAttribute("data-open")) return;
    const panel = panelOf(root);
    if (panel) {
      clearTimeout(panel._astaT);
      closeSubs(panel);
      hidePop(panel);
    }
    root.removeAttribute("data-open");
    const trigger = root.querySelector(":scope > [data-asta-dropdown-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
    if (refocus) (trigger || root._astaRestore || root).focus({ preventScroll: true });
  }
  function toggleDropdown(root, focusFirst) {
    if (root.hasAttribute("data-open")) return closeRoot(root, false);
    const t = root.querySelector(":scope > [data-asta-dropdown-trigger]");
    openRoot(root, { rect: t.getBoundingClientRect(), align: root.getAttribute("data-align") === "end" ? "end" : "start" }, focusFirst);
  }

  // Checkbox and radio items keep their hidden inputs in step and announce the change.
  function check(item) {
    const role = item.getAttribute("role");
    if (role === "menuitemcheckbox") {
      const on = item.getAttribute("aria-checked") !== "true";
      item.setAttribute("aria-checked", String(on));
      const input = item.querySelector(':scope > input[type="hidden"]');
      if (input) input.disabled = !on;
      fire(item, "asta:change", { checked: on, value: item.dataset.value ?? "" });
    } else if (role === "menuitemradio") {
      if (item.getAttribute("aria-checked") === "true") return;
      const panel = item.closest('[role="menu"]');
      const group = item.dataset.group ?? "";
      for (const r of panel.querySelectorAll('[role="menuitemradio"]')) {
        if ((r.dataset.group ?? "") !== group || r.closest('[role="menu"]') !== panel) continue;
        const on = r === item;
        r.setAttribute("aria-checked", String(on));
        const input = r.querySelector('input[type="hidden"]');
        if (input) input.disabled = !on;
      }
      fire(item, "asta:change", { checked: true, value: item.dataset.value ?? "" });
    }
  }

  document.addEventListener("click", (e) => {
    const t = elOf(e.target);
    if (!t) return;
    const trigger = t.closest("[data-asta-dropdown-trigger]");
    if (trigger) {
      const root = trigger.closest("[data-asta-dropdown]");
      if (root) toggleDropdown(root, e.detail === 0);
      return;
    }
    const item = t.closest('[data-asta-mpanel] [role^="menuitem"]');
    const root = item?.closest(ROOTS);
    if (!item || !root || !enabled(item)) return;
    if (item.getAttribute("aria-haspopup") === "menu") {
      openSub(item, e.detail === 0);
      return;
    }
    check(item);
    if (!item.hasAttribute("data-keep-open")) closeRoot(root, true);
  });

  // A press outside every open panel closes its menu. A right-click inside a context area moves it instead.
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = elOf(e.target);
      for (const root of openRoots()) {
        if (t?.closest("[data-asta-mpanel]") && root.contains(t)) continue;
        if (root.querySelector(":scope > [data-asta-dropdown-trigger]")?.contains(t)) continue;
        if (e.button === 2 && root.matches("[data-asta-context-menu]") && root.contains(t)) continue;
        closeRoot(root, false);
      }
    },
    true,
  );
  addEventListener(
    "scroll",
    (e) => {
      const t = elOf(e.target);
      for (const root of openRoots()) if (!t?.closest?.("[data-asta-mpanel]")) closeRoot(root, false);
    },
    { capture: true, passive: true },
  );
  addEventListener("resize", () => openRoots().forEach((r) => closeRoot(r, false)));
  addEventListener("blur", () => openRoots().forEach((r) => closeRoot(r, false)));

  // Context menu: right-click, Shift+F10 / Menu key, long-press on touch.
  const ctxArea = (t) => {
    const root = t?.closest("[data-asta-context-menu]");
    if (!root || root.hasAttribute("data-disabled") || t.closest("[data-asta-mpanel]")) return null;
    return root;
  };
  function ctxFromKeyboard(root) {
    const a = document.activeElement;
    const r = (a instanceof HTMLElement && root.contains(a) ? a : root).getBoundingClientRect();
    openRoot(root, { x: r.left + Math.min(16, r.width / 2), y: r.top + Math.min(r.height / 2, 20) }, true);
  }
  document.addEventListener("contextmenu", (e) => {
    const t = elOf(e.target);
    if (t?.closest("[data-asta-mpanel]")) return e.preventDefault();
    const root = ctxArea(t);
    if (!root) return;
    e.preventDefault();
    clearTimeout(root._astaPress?.t);
    // Already opened by a long-press a moment ago.
    if (root.hasAttribute("data-open") && performance.now() - (root._astaAt || 0) < 700) return;
    if (e.clientX === 0 && e.clientY === 0) return ctxFromKeyboard(root);
    openRoot(root, { x: e.clientX, y: e.clientY }, false);
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const root = ctxArea(elOf(e.target));
    if (!root) return;
    clearTimeout(root._astaPress?.t);
    const { clientX: x, clientY: y } = e;
    root._astaPress = { x, y, t: setTimeout(() => openRoot(root, { x, y }, false), num(root.dataset.longPress, 500)) };
  });
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") return;
    const root = elOf(e.target)?.closest("[data-asta-context-menu]");
    const p = root?._astaPress;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) clearTimeout(p.t);
  });
  for (const type of ["pointerup", "pointercancel"]) {
    document.addEventListener(type, (e) => clearTimeout(elOf(e.target)?.closest("[data-asta-context-menu]")?._astaPress?.t));
  }

  // Hover: the item under the pointer takes focus; a submenu item opens after a beat, leaving it closes after a grace.
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = elOf(e.target);
    const panel = t?.closest("[data-asta-mpanel]");
    if (!panel || !isOpen(panel)) return;
    // Entering a submenu keeps it open.
    const parent = panel.parentElement?.closest("[data-asta-mpanel]");
    if (parent) clearTimeout(parent._astaT);
    const item = t.closest('[role^="menuitem"]');
    if (!item || item.closest('[role="menu"]') !== panel) return;
    clearTimeout(panel._astaT);
    if (!enabled(item)) return panel.focus({ preventScroll: true });
    if (document.activeElement !== item) item.focus({ preventScroll: true });
    const open = [...panel.querySelectorAll("[data-asta-menu-sub] > [data-asta-mpanel]")].find((s) => s.parentElement.closest('[role="menu"]') === panel && isOpen(s));
    if (item.getAttribute("aria-haspopup") === "menu") {
      if (open !== subOf(item)) panel._astaT = setTimeout(() => openSub(item, false), 100);
    } else if (open) {
      panel._astaT = setTimeout(() => closeSub(open, false), 260);
    }
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const panel = elOf(e.target)?.closest("[data-asta-mpanel]");
    if (!panel || !isOpen(panel) || panel.contains(elOf(e.relatedTarget))) return;
    const hasSub = [...panel.querySelectorAll("[data-asta-menu-sub] > [data-asta-mpanel]")].some(isOpen);
    if (!hasSub && panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  });

  document.addEventListener("keydown", (e) => {
    const t = elOf(e.target);
    if (!t) return;
    // Openers.
    if (t.matches("[data-asta-dropdown-trigger]") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const root = t.closest("[data-asta-dropdown]");
      if (root && !root.hasAttribute("data-open")) toggleDropdown(root, true);
      else if (root) itemsOf(panelOf(root))[0]?.focus();
      return;
    }
    if ((e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) && ctxArea(t)) {
      e.preventDefault();
      ctxFromKeyboard(ctxArea(t));
      return;
    }
    const panel = t.closest("[data-asta-mpanel]");
    if (!panel || !isOpen(panel)) return;
    const root = panel.closest(ROOTS);
    const list = itemsOf(panel);
    const i = list.indexOf(document.activeElement);
    const parentSub = panel.parentElement?.matches("[data-asta-menu-sub]") ? panel : null;
    const go = (n) => list[(n + list.length) % list.length]?.focus({ preventScroll: true });
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        return go(i < 0 ? 0 : i + 1);
      case "ArrowUp":
        e.preventDefault();
        return go(i < 0 ? list.length - 1 : i - 1);
      case "Home":
      case "PageUp":
        e.preventDefault();
        return go(0);
      case "End":
      case "PageDown":
        e.preventDefault();
        return go(list.length - 1);
      case "ArrowRight": {
        const it = list[i];
        if (it?.getAttribute("aria-haspopup") === "menu") {
          e.preventDefault();
          openSub(it, true);
        }
        return;
      }
      case "ArrowLeft":
        if (parentSub) {
          e.preventDefault();
          closeSub(parentSub, true);
        }
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        if (parentSub) return closeSub(parentSub, true);
        return root && closeRoot(root, true);
      case "Tab":
        if (root?.matches("[data-asta-context-menu]")) e.preventDefault();
        return root && closeRoot(root, true);
    }
    // Type-ahead: jump to the next item whose label starts with what was typed.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
      const now = e.timeStamp;
      panel._astaTyped = now - (panel._astaTypedAt || 0) > 600 ? e.key.toLowerCase() : (panel._astaTyped || "") + e.key.toLowerCase();
      panel._astaTypedAt = now;
      const q = panel._astaTyped;
      const start = Math.max(0, i + (q.length === 1 ? 1 : 0));
      const order = [...list.slice(start), ...list.slice(0, start)];
      order.find((it) => it.textContent.trim().toLowerCase().startsWith(q))?.focus({ preventScroll: true });
    }
  });

  /* ---------- Workspace switchers: the trigger follows the picked workspace ---------- */

  document.addEventListener("asta:change", (e) => {
    const item = elOf(e.target);
    const root = item?.closest("[data-asta-ws]");
    if (!root || !item.hasAttribute("data-ws-name")) return;
    const name = item.dataset.wsName;
    const plan = item.dataset.wsPlan || "";
    for (const n of root.querySelectorAll("[data-ws-name-out]")) if (!n.closest("[data-asta-mpanel]")) n.textContent = name;
    for (const n of root.querySelectorAll("[data-ws-plan-out]")) {
      if (n.closest("[data-asta-mpanel]")) continue;
      n.textContent = plan;
      n.hidden = !plan;
    }
    const box = item.querySelector("[data-ws-logo-box]");
    for (const n of root.querySelectorAll("[data-ws-logo-out]")) {
      if (n.closest("[data-asta-mpanel]")) continue;
      if (box) n.innerHTML = box.innerHTML;
      else n.textContent = [...name][0] || "";
    }
  });

  /* ---------- Drawer: drag a bottom sheet down to close ---------- */

  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    const handle = elOf(e.target)?.closest("[data-asta-drawer-handle]");
    const d = handle?.closest("dialog.asta-drawer");
    if (!d || !d.open || e.button !== 0) return;
    handle.setPointerCapture(e.pointerId);
    drag = { d, handle, y: e.clientY, t: e.timeStamp, dy: 0, v: 0 };
    d.style.transition = "none";
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const raw = e.clientY - drag.y;
    // Pulling up resists, pulling down follows 1:1.
    const dy = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
    drag.v = (dy - drag.dy) / Math.max(1, e.timeStamp - drag.t);
    drag.t = e.timeStamp;
    drag.dy = dy;
    drag.d.style.transform = `translateY(${dy}px)`;
    drag.d.style.setProperty("--asta-drawer-fade", String(Math.max(0, 1 - Math.max(0, dy) / drag.d.offsetHeight)));
  });
  const endDrag = () => {
    if (!drag) return;
    const { d, dy, v } = drag;
    drag = null;
    // Clear the inline styles in the same frame as the close, so the CSS transition runs from where it is.
    d.style.transition = "";
    d.style.transform = "";
    d.style.removeProperty("--asta-drawer-fade");
    if (dy > d.offsetHeight * 0.3 || v > 0.6) window.asta?.close(d.id);
  };
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  /* ---------- Command palette ---------- */

  // Fuzzy match: every query letter appears in order. Prefers consecutive letters and word starts.
  function fuzzy(text, query) {
    const t = text.toLowerCase();
    const q = query.toLowerCase().replace(/\s+/g, "");
    if (!q) return { score: 0, hits: [] };
    const hits = [];
    let score = 0;
    let from = 0;
    for (const ch of q) {
      const at = t.indexOf(ch, from);
      if (at < 0) return null;
      if (hits.length && at === hits[hits.length - 1] + 1) score += 3;
      if (at === 0 || t[at - 1] === " ") score += 2;
      score -= (at - from) * 0.1;
      hits.push(at);
      from = at + 1;
    }
    return { score, hits };
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const cmdOptions = (root) => [...root.querySelectorAll('[data-asta-command-list] [role="option"]')].filter((o) => !o.hidden);
  let cmdSeq = 0;

  function cmdFilter(root) {
    const input = root.querySelector("[data-asta-command-input]");
    const q = root.hasAttribute("data-server") ? "" : (input?.value ?? "");
    const all = [...root.querySelectorAll('[data-asta-command-list] [role="option"]')];
    all.forEach((o, i) => {
      if (o.dataset.i === undefined) o.dataset.i = String(i);
      const label = o.querySelector("[data-asta-command-label]");
      if (label && label.dataset.text === undefined) label.dataset.text = label.textContent;
      const text = label?.dataset.text ?? o.textContent;
      let m = fuzzy(text, q);
      const kw = (o.dataset.keywords || "").toLowerCase();
      if (!m && kw && q.trim() && kw.includes(q.trim().toLowerCase())) m = { score: -5, hits: [] };
      o.hidden = !m;
      o._astaScore = m ? m.score : -1e9;
      if (label) {
        const set = new Set(m?.hits ?? []);
        label.innerHTML = set.size ? [...text].map((c, k) => (set.has(k) ? `<mark class="bg-transparent font-semibold text-ink">${esc(c)}</mark>` : esc(c))).join("") : esc(text);
      }
    });
    for (const box of root.querySelectorAll("[data-asta-command-items]")) {
      const opts = [...box.querySelectorAll(':scope > [role="option"]')];
      opts.sort((a, b) => (q ? b._astaScore - a._astaScore : 0) || a.dataset.i - b.dataset.i);
      for (const o of opts) box.append(o);
      const group = box.closest("[data-asta-command-group]");
      if (group) group.hidden = !opts.some((o) => !o.hidden);
    }
    cmdRefresh(root, q);
  }
  function cmdRefresh(root, q) {
    const shown = cmdOptions(root);
    const empty = root.querySelector("[data-asta-command-empty]");
    if (empty) {
      empty.hidden = shown.length > 0;
      const qs = root.querySelector("[data-asta-command-q]");
      if (qs) qs.textContent = q ?? root.querySelector("[data-asta-command-input]")?.value ?? "";
    }
    const count = root.querySelector("[data-asta-command-count]");
    if (count) count.textContent = `${shown.length} ${shown.length === 1 ? "result" : "results"}`;
    cmdActive(root, 0);
  }
  function cmdActive(root, i) {
    const list = cmdOptions(root);
    const input = root.querySelector("[data-asta-command-input]");
    const at = list.length ? (i + list.length) % list.length : -1;
    root._astaAt = at;
    for (const o of root.querySelectorAll('[data-asta-command-list] [role="option"]')) o.setAttribute("aria-selected", "false");
    const on = list[at];
    if (on) {
      if (!on.id) on.id = `${root.id || "asta-cmd"}-opt-${++cmdSeq}`;
      on.setAttribute("aria-selected", "true");
      on.scrollIntoView({ block: "nearest" });
      input?.setAttribute("aria-activedescendant", on.id);
    } else input?.removeAttribute("aria-activedescendant");
  }
  function cmdRun(root, opt) {
    if (!opt) return;
    if (!opt.hasAttribute("data-keep-open")) window.asta?.close(root.id);
    opt.click();
  }

  document.addEventListener("keydown", (e) => {
    // ⌘K / Ctrl+K toggles the first palette that listens for that key.
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.length === 1) {
      const root = [...document.querySelectorAll("dialog[data-asta-command]")].find((d) => (d.dataset.hotkey || "k").toLowerCase() === e.key.toLowerCase());
      if (root) {
        e.preventDefault();
        if (root.open) window.asta?.close(root.id);
        else window.asta?.open(root.id);
        return;
      }
    }
    const input = elOf(e.target)?.closest("[data-asta-command-input]");
    const root = input?.closest("dialog[data-asta-command]");
    if (!root) return;
    const at = root._astaAt ?? 0;
    const n = cmdOptions(root).length;
    if (e.key === "ArrowDown") cmdActive(root, at + 1);
    else if (e.key === "ArrowUp") cmdActive(root, at - 1);
    else if (e.key === "Home" && !input.value) cmdActive(root, 0);
    else if (e.key === "End" && !input.value) cmdActive(root, n - 1);
    else if (e.key === "Enter") cmdRun(root, cmdOptions(root)[at]);
    else return;
    e.preventDefault();
  });
  document.addEventListener("input", (e) => {
    const input = elOf(e.target)?.closest("[data-asta-command-input]");
    const root = input?.closest("dialog[data-asta-command]");
    if (root && !root.hasAttribute("data-server")) cmdFilter(root);
  });
  document.addEventListener("pointermove", (e) => {
    const opt = elOf(e.target)?.closest('[data-asta-command-list] [role="option"]');
    const root = opt?.closest("dialog[data-asta-command]");
    if (!root || opt.getAttribute("aria-selected") === "true") return;
    cmdActive(root, cmdOptions(root).indexOf(opt));
  });
  document.addEventListener("click", (e) => {
    const opt = elOf(e.target)?.closest('[data-asta-command-list] [role="option"]');
    const root = opt?.closest("dialog[data-asta-command]");
    if (root && !opt.hasAttribute("data-keep-open")) window.asta?.close(root.id);
  });
  // Start fresh each time it closes.
  document.addEventListener(
    "close",
    (e) => {
      const root = e.target;
      if (!(root instanceof HTMLDialogElement) || !root.hasAttribute("data-asta-command")) return;
      const input = root.querySelector("[data-asta-command-input]");
      if (input && input.value) {
        input.value = "";
        if (root.hasAttribute("data-server")) input.dispatchEvent(new Event("search", { bubbles: true }));
      }
      if (!root.hasAttribute("data-server")) cmdFilter(root);
    },
    true,
  );

  /* ---------- Navbar ---------- */

  const navTriggers = (root) => [...root.querySelectorAll("[data-asta-nav-trigger]")];
  function navShow(root, i, focusPanel) {
    clearTimeout(root._astaT);
    const cur = root._astaOpen ?? null;
    if (i === null) {
      if (cur === null) return;
      root._astaOpen = null;
      root.removeAttribute("data-open");
      for (const t of navTriggers(root)) t.setAttribute("aria-expanded", "false");
      return;
    }
    const box = root.querySelector("[data-asta-nav-surface] > div");
    const bg = root.querySelector("[data-asta-nav-bg]");
    const panels = [...root.querySelectorAll("[data-asta-nav-panel]")];
    const next = root.querySelector(`[data-asta-nav-panel="${i}"]`);
    if (!next || !box) return;
    const was = cur !== null && root.hasAttribute("data-open");
    const old = was ? { w: bg.offsetWidth, h: bg.offsetHeight } : null;
    for (const p of panels) p.hidden = p !== next;
    root._astaOpen = i;
    root.setAttribute("data-open", "");
    for (const t of navTriggers(root)) t.setAttribute("aria-expanded", String(t.dataset.astaNavTrigger === String(i)));
    if (was && cur !== i && !reduce()) {
      // The surface takes the new size at once; its background scales from the old size (FLIP),
      // and the new content slides in from the side you moved toward.
      const w = bg.offsetWidth;
      const h = bg.offsetHeight;
      bg.style.transition = "none";
      bg.style.transform = `scale(${old.w / w}, ${old.h / h})`;
      void bg.offsetWidth;
      bg.style.transition = "";
      bg.style.transform = "";
      next.style.setProperty("--asta-dir", i > cur ? "1" : "-1");
      next.classList.remove("asta-nav-slide");
      void next.offsetWidth;
      next.classList.add("asta-nav-slide");
    } else next.classList.remove("asta-nav-slide");
    if (focusPanel) next.querySelector("[data-asta-nav-link]")?.focus();
  }
  const navZone = (root, el) => !!el && [...root.querySelectorAll("[data-asta-nav-zone]")].some((z) => z.contains(el));
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = elOf(e.target);
    const root = t?.closest("[data-asta-navbar]");
    if (!root) return;
    const trig = t.closest("[data-asta-nav-trigger]");
    if (trig) {
      const i = Number(trig.dataset.astaNavTrigger);
      clearTimeout(root._astaT);
      // Hover intent: a short wait before the first open, instant while moving between triggers.
      const hover = () => {
        root._astaHoverAt = performance.now();
        navShow(root, i);
      };
      if ((root._astaOpen ?? null) === null) root._astaT = setTimeout(hover, 110);
      else if (root._astaOpen !== i) hover();
    } else if (t.closest("[data-asta-nav-link]") && t.closest("nav") && (root._astaOpen ?? null) !== null) navShow(root, null);
    else if (navZone(root, t)) clearTimeout(root._astaT);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = elOf(e.target);
    const root = t?.closest("[data-asta-navbar]");
    if (!root || !navZone(root, t) || navZone(root, elOf(e.relatedTarget))) return;
    clearTimeout(root._astaT);
    root._astaT = setTimeout(() => navShow(root, null), 180);
  });
  document.addEventListener("click", (e) => {
    const t = elOf(e.target);
    const trig = t?.closest("[data-asta-nav-trigger]");
    if (trig) {
      const root = trig.closest("[data-asta-navbar]");
      const i = Number(trig.dataset.astaNavTrigger);
      // A click right after hover opened it keeps it open instead of toggling it shut.
      if (root._astaOpen === i && performance.now() - (root._astaHoverAt || 0) < 600) return;
      navShow(root, root._astaOpen === i ? null : i);
      return;
    }
    const burger = t?.closest("[data-asta-nav-burger]");
    if (burger) {
      const root = burger.closest("[data-asta-navbar]");
      navSheet(root, !root.hasAttribute("data-sheet"));
    }
  });
  function navSheet(root, on) {
    const sheet = root.querySelector("[data-asta-nav-sheet]");
    const burger = root.querySelector("[data-asta-nav-burger]");
    if (!sheet) return;
    sheet.hidden = !on;
    root.toggleAttribute("data-sheet", on);
    burger?.setAttribute("aria-expanded", String(on));
    burger?.setAttribute("aria-label", on ? "Close menu" : "Open menu");
  }
  document.addEventListener("pointerdown", (e) => {
    const t = elOf(e.target);
    for (const root of document.querySelectorAll("[data-asta-navbar]")) {
      if (root.contains(t)) continue;
      navShow(root, null);
      if (root.hasAttribute("data-sheet")) navSheet(root, false);
    }
  });
  document.addEventListener("keydown", (e) => {
    const t = elOf(e.target);
    if (e.key === "Escape") {
      for (const root of document.querySelectorAll("[data-asta-navbar][data-open],[data-asta-navbar][data-sheet]")) {
        const i = root._astaOpen ?? null;
        if (i !== null) {
          navShow(root, null);
          if (root.contains(t)) root.querySelector(`[data-asta-nav-trigger="${i}"]`)?.focus();
        }
        if (root.hasAttribute("data-sheet")) {
          navSheet(root, false);
          root.querySelector("[data-asta-nav-burger]")?.focus();
        }
      }
      return;
    }
    const trig = t?.closest("[data-asta-nav-trigger]");
    if (!trig) return;
    const root = trig.closest("[data-asta-navbar]");
    const i = Number(trig.dataset.astaNavTrigger);
    if (e.key === "ArrowDown" || ((e.key === "Enter" || e.key === " ") && root._astaOpen !== i)) {
      e.preventDefault();
      navShow(root, i, true);
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const all = [...root.querySelectorAll('nav[aria-label="Main"] li > *')];
      const at = all.indexOf(trig);
      const next = all[(at + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
      next?.focus();
      if ((root._astaOpen ?? null) !== null && next?.matches("[data-asta-nav-trigger]")) navShow(root, Number(next.dataset.astaNavTrigger));
    }
  });
  const navScrolled = () => {
    const on = scrollY > 40;
    for (const root of document.querySelectorAll("[data-asta-navbar]")) root.toggleAttribute("data-scrolled", on);
  };
  addEventListener("scroll", navScrolled, { passive: true });

  /* ---------- Sidebar ---------- */

  function sbPlace(root, animate) {
    const ind = root.querySelector("[data-asta-sidebar-indicator]");
    if (!ind) return;
    const el = root.querySelector('[data-asta-sidebar-item][aria-current="page"]');
    if (!el) {
      ind.style.opacity = "0";
      return;
    }
    const box = ind.parentElement.getBoundingClientRect();
    const y = el.getBoundingClientRect().top - box.top;
    if (!animate) ind.style.transition = "none";
    ind.style.transform = `translateY(${y}px)`;
    ind.style.opacity = "1";
    if (!animate) {
      void ind.offsetHeight;
      ind.style.transition = "";
    }
  }
  function sbCollapse(root, on) {
    root.toggleAttribute("data-collapsed", on);
    const btn = root.querySelector("[data-asta-sidebar-toggle]");
    btn?.setAttribute("aria-pressed", String(on));
    btn?.setAttribute("aria-label", on ? "Expand sidebar" : "Collapse sidebar");
    fire(root, "asta:collapse", { collapsed: on });
  }
  document.addEventListener("click", (e) => {
    const t = elOf(e.target);
    const toggle = t?.closest("[data-asta-sidebar-toggle]");
    if (toggle) {
      const root = toggle.closest("[data-asta-sidebar]");
      return sbCollapse(root, !root.hasAttribute("data-collapsed"));
    }
    const item = t?.closest("[data-asta-sidebar-item]");
    const root = item?.closest("[data-asta-sidebar]");
    if (!root) return;
    for (const it of root.querySelectorAll("[data-asta-sidebar-item]")) {
      if (it === item) it.setAttribute("aria-current", "page");
      else it.removeAttribute("aria-current");
    }
    sbPlace(root, true);
  });
  document.addEventListener("keydown", (e) => {
    const t = elOf(e.target);
    const item = t?.closest("[data-asta-sidebar-nav] [data-asta-sidebar-item]");
    if (!item) return;
    const els = [...item.closest("[data-asta-sidebar-nav]").querySelectorAll("[data-asta-sidebar-item]")];
    const i = els.indexOf(item);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: els.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    els[(next + els.length) % els.length]?.focus();
  });

  /* ---------- Tool dock ---------- */

  function dockPlace(root, animate) {
    const pill = root.querySelector("[data-asta-tooldock-pill]");
    const on = root.querySelector('[data-tool][aria-pressed="true"]');
    if (!pill) return;
    if (!on) {
      pill.style.opacity = "0";
      return;
    }
    // The button sits in a positioned wrapper (for its tooltip), so measure the wrapper against the bar.
    const wrap = on.parentElement;
    if (!animate) pill.style.transition = "none";
    pill.style.width = `${wrap.offsetWidth}px`;
    pill.style.transform = `translateX(${wrap.offsetLeft}px)`;
    pill.style.opacity = "1";
    if (!animate) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
  }
  function dockPick(root, btn) {
    if (!btn || btn.disabled) return;
    for (const b of root.querySelectorAll("[data-tool]")) {
      const on = b === btn;
      b.setAttribute("aria-pressed", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    const input = root.querySelector(':scope > input[type="hidden"]');
    if (input) input.value = btn.dataset.tool;
    dockPlace(root, true);
    fire(root, "asta:change", { value: btn.dataset.tool });
  }
  document.addEventListener("click", (e) => {
    const btn = elOf(e.target)?.closest("[data-asta-tooldock] [data-tool]");
    if (btn) dockPick(btn.closest("[data-asta-tooldock]"), btn);
  });
  document.addEventListener("keydown", (e) => {
    const t = elOf(e.target);
    const btn = t?.closest("[data-asta-tooldock] [data-tool]");
    if (btn) {
      const root = btn.closest("[data-asta-tooldock]");
      const list = [...root.querySelectorAll("[data-tool]:not([disabled])")];
      const i = list.indexOf(btn);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
      if (next !== undefined) {
        e.preventDefault();
        list[(next + list.length) % list.length]?.focus();
        return;
      }
    }
    // Single-key shortcuts from anywhere, unless typing or a modifier is held.
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || e.key.length !== 1 || e.defaultPrevented) return;
    if (t?.closest("[data-asta-mpanel],dialog[open]")) return;
    const k = e.key.toLowerCase();
    for (const root of document.querySelectorAll("[data-asta-tooldock][data-hotkeys]")) {
      const hit = [...root.querySelectorAll("[data-tool][data-shortcut]:not([disabled])")].find((b) => b.dataset.shortcut.toLowerCase() === k);
      if (hit) dockPick(root, hit);
    }
  });

  /* ---------- Stepper ---------- */

  function stepGo(root, n) {
    const count = num(root.dataset.count, 0);
    const cur = num(root.dataset.step, 0);
    const next = Math.max(0, Math.min(count, n));
    if (next === cur && root.hasAttribute("data-ready")) return;
    root.dataset.step = String(next);
    root.toggleAttribute("data-first", next === 0);
    root.toggleAttribute("data-last", next === count - 1);
    root.toggleAttribute("data-complete", next >= count);
    const noBack = root.hasAttribute("data-no-back");
    for (const li of root.querySelectorAll("[data-asta-step]")) {
      const i = Number(li.dataset.astaStep);
      const state = i < next ? "done" : i === next ? "current" : "todo";
      li.dataset.state = state;
      if (state === "current") li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
      const b = li.querySelector("[data-asta-step-goto]");
      if (b) b.disabled = noBack || state !== "done" || next >= count;
    }
    for (const b of root.querySelectorAll("[data-asta-step-back]")) b.disabled = next === 0;
    if (next === cur) return;
    for (const p of root.querySelectorAll("[data-asta-step-panel]")) {
      const on = Number(p.dataset.astaStepPanel) === next;
      p.hidden = !on;
      p.classList.remove("asta-step-next", "asta-step-back");
      if (on && !reduce()) {
        void p.offsetWidth;
        p.classList.add(next > cur ? "asta-step-next" : "asta-step-back");
      }
    }
    fire(root, "asta:step", { step: next });
  }
  document.addEventListener("click", (e) => {
    const t = elOf(e.target);
    const b = t?.closest("[data-asta-step-next],[data-asta-step-back],[data-asta-step-goto]");
    const root = b?.closest("[data-asta-stepper]");
    if (!root || b.disabled) return;
    const cur = num(root.dataset.step, 0);
    if (b.hasAttribute("data-asta-step-next")) stepGo(root, cur + 1);
    else if (b.hasAttribute("data-asta-step-back")) stepGo(root, cur - 1);
    else stepGo(root, num(b.getAttribute("data-asta-step-goto"), cur));
  });

  /* ---------- Announcement bar ---------- */

  const storage = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };
  function announceTick(root) {
    if (!root.isConnected) return clearInterval(root._astaTimer);
    if (root._astaPaused || document.hidden || reduce() || root.dataset.state === "closed") return;
    const msgs = [...root.querySelectorAll("[data-asta-announce-msg]")];
    const cur = msgs.findIndex((m) => m.dataset.state === "cur" || m.dataset.state === "in");
    const next = (cur + 1) % msgs.length;
    msgs.forEach((m, i) => {
      if (i === next) {
        m.dataset.state = "in";
        m.removeAttribute("aria-hidden");
      } else if (i === cur) {
        m.dataset.state = "out";
        m.setAttribute("aria-hidden", "true");
      } else {
        delete m.dataset.state;
        m.setAttribute("aria-hidden", "true");
      }
    });
  }
  function announceInit(root) {
    if (root._astaInit) return;
    root._astaInit = true;
    const key = root.dataset.storageKey;
    if (key && storage.get(key) === "1") return root.remove();
    if (root.querySelectorAll("[data-asta-announce-msg]").length > 1) {
      root._astaTimer = setInterval(() => announceTick(root), num(root.dataset.interval, 5000));
    }
  }
  const announcePause = (root, on) => {
    root._astaPaused = on;
    // Live only while still, so a rotating bar doesn't talk over the page.
    root.querySelector("[data-asta-announce-track]")?.setAttribute("aria-live", on || reduce() ? "polite" : "off");
  };
  document.addEventListener("pointerover", (e) => {
    const root = e.pointerType === "mouse" && elOf(e.target)?.closest("[data-asta-announce]");
    if (root) announcePause(root, true);
  });
  document.addEventListener("pointerout", (e) => {
    const root = e.pointerType === "mouse" && elOf(e.target)?.closest("[data-asta-announce]");
    if (root && !root.contains(elOf(e.relatedTarget)) && !root.contains(document.activeElement)) announcePause(root, false);
  });
  document.addEventListener("focusin", (e) => {
    const root = elOf(e.target)?.closest("[data-asta-announce]");
    if (root) announcePause(root, true);
  });
  document.addEventListener("focusout", (e) => {
    const root = elOf(e.target)?.closest("[data-asta-announce]");
    if (root && !root.contains(elOf(e.relatedTarget))) announcePause(root, false);
  });
  document.addEventListener("click", (e) => {
    const btn = elOf(e.target)?.closest("[data-asta-announce-close]");
    const root = btn?.closest("[data-asta-announce]");
    if (!root || root.dataset.state === "closed") return;
    // Focus would be lost with the bar: hand it to the page.
    if (root.contains(document.activeElement)) document.activeElement.blur();
    clearInterval(root._astaTimer);
    root.dataset.state = "closed";
    const done = () => {
      // Remember it once the exit has played.
      if (root.dataset.storageKey) storage.set(root.dataset.storageKey, "1");
      root.remove();
      fire(document.body, "asta:dismiss", { id: root.id });
    };
    if (reduce()) return done();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done();
    };
    root.addEventListener("animationend", (ev) => ev.target === root && finish());
    setTimeout(finish, 450);
  });

  /* ---------- Newsletter ---------- */

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nlState = (root, s) => {
    root.dataset.state = s;
    root.querySelector("form")?.toggleAttribute("inert", s === "done");
    root.querySelector("[data-asta-newsletter-done]")?.setAttribute("aria-hidden", String(s !== "done"));
  };
  document.addEventListener(
    "submit",
    (e) => {
      const form = elOf(e.target);
      const root = form?.closest("[data-asta-newsletter]");
      if (!root) return;
      const input = form.querySelector('input[type="email"]');
      if (!EMAIL.test(input?.value.trim() ?? "")) {
        // Stop htmx from posting a bad address.
        e.preventDefault();
        e.stopImmediatePropagation();
        nlState(root, "error");
        input?.setAttribute("aria-invalid", "true");
        return;
      }
      input?.removeAttribute("aria-invalid");
      if (form.hasAttribute("hx-post")) return nlState(root, "busy");
      // No endpoint: a demo, so fake a short request.
      e.preventDefault();
      nlState(root, "busy");
      const btn = form.querySelector('button[type="submit"]');
      btn?.classList.add("htmx-request");
      setTimeout(() => {
        btn?.classList.remove("htmx-request");
        nlState(root, "done");
      }, 900);
    },
    true,
  );
  document.addEventListener("htmx:afterRequest", (e) => {
    const root = elOf(e.target)?.closest("[data-asta-newsletter]");
    if (root) nlState(root, e.detail?.successful ? "done" : "error");
  });
  document.addEventListener("input", (e) => {
    const root = elOf(e.target)?.closest("[data-asta-newsletter]");
    if (root?.dataset.state === "error") {
      nlState(root, "idle");
      e.target.removeAttribute("aria-invalid");
    }
  });

  /* ---------- Wordmark: letters near the pointer lift ---------- */

  document.addEventListener("pointermove", (e) => {
    const box = elOf(e.target)?.closest("[data-asta-wordmark]");
    if (box) wordmark(box, e.clientX);
  });
  document.addEventListener("pointerout", (e) => {
    const box = elOf(e.target)?.closest("[data-asta-wordmark]");
    if (box && !box.contains(elOf(e.relatedTarget))) wordmark(box, null);
  });
  function wordmark(box, x) {
    if (reduce()) return;
    for (const s of box.querySelectorAll("span[data-l]")) {
      if (x === null) {
        s.style.transform = "";
        continue;
      }
      // Measure without the current lift, so letters don't chase their own offset.
      const r = s.offsetLeft + s.offsetWidth / 2 + box.getBoundingClientRect().left;
      const k = Math.max(0, 1 - Math.abs(x - r) / (s.offsetWidth * 2.5));
      s.style.transform = `translateY(${-k * 14}%)`;
    }
  }

  /* ---------- Boot and htmx ---------- */

  const narrow = () => matchMedia("(max-width: 639px)").matches;
  function scan(el) {
    for (const root of el.querySelectorAll("[data-asta-sidebar]")) {
      if (!root._astaInit) {
        root._astaInit = true;
        if (root.hasAttribute("data-auto-rail") && narrow() && !root.hasAttribute("data-collapsed")) sbCollapse(root, true);
      }
      sbPlace(root, false);
    }
    for (const root of el.querySelectorAll("[data-asta-tooldock]")) dockPlace(root, false);
    for (const root of el.querySelectorAll("[data-asta-announce]")) announceInit(root);
    for (const root of el.querySelectorAll("[data-asta-stepper]:not([data-ready])")) {
      stepGo(root, num(root.dataset.step, 0));
      root.setAttribute("data-ready", "");
    }
    for (const root of el.querySelectorAll("dialog[data-asta-command]")) {
      if (root.hasAttribute("data-server")) cmdRefresh(root);
      else cmdFilter(root);
    }
  }
  const boot = () => {
    scan(document);
    navScrolled();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("htmx:afterSettle", (e) => {
    const t = elOf(e.detail?.elt) || document.body;
    // A server search answered: refresh its palette.
    const cmd = t.closest?.("dialog[data-asta-command]");
    if (cmd) return cmdRefresh(cmd);
    scan(t.parentElement || document);
  });
  // Re-measure the sliding highlights when the layout changes (fonts, resize, a sidebar folding).
  const resized = new ResizeObserver((entries) => {
    for (const en of entries) {
      const t = en.target;
      if (t.matches("[data-asta-sidebar]")) sbPlace(t, false);
      else if (t.matches("[data-asta-tooldock]")) dockPlace(t, false);
    }
  });
  const watch = () => {
    for (const el of document.querySelectorAll("[data-asta-sidebar],[data-asta-tooldock]")) {
      if (el._astaWatched) continue;
      el._astaWatched = true;
      resized.observe(el);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();
  document.addEventListener("htmx:afterSettle", watch);
})();
