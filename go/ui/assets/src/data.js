/* Data components for Astabyte UI for Go. Event delegation on document, so htmx swaps need no re-init.
 *   DataTable          [data-asta-dt] with [data-asta-dt-all], [data-asta-dt-row], [data-asta-dt-clear]
 *   TreeView           [data-asta-tree] with [role=treeitem] and [data-asta-tree-row]; fires asta:select, asta:expand
 *   Timeline           [data-asta-timeline][data-inview]
 *   Kanban             [data-asta-kanban] with [data-asta-kanban-list] and [data-asta-kanban-card]; fires asta:move
 *   EventCalendar      [data-asta-cal] with [data-day] cells and [data-asta-cal-panel]; fires asta:select
 *   FileCard           [data-asta-file-star]; fires asta:star
 *   ImageCompare       [data-asta-compare] with [data-asta-compare-handle]; fires asta:change
 *   Carousel           [data-asta-carousel] with [data-asta-carousel-track|dot|step]; fires asta:slide
 *   NotificationCenter [data-asta-nc] with [data-asta-nc-trigger|panel|tab|item|dot|all]
 *   Comments           [data-asta-comments] with [data-asta-comment-form|reply|like|cancel]; fires asta:like
 *   MotionButton       [data-asta-mb="fill|shine|beam|copy|confirm"]; confirm fires asta:confirm
 */
(() => {
  if (window.__astaData) return;
  window.__astaData = true;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CURVE = "cubic-bezier(.16,1,.3,1)";
  const all = (el, s) => [...el.querySelectorAll(s)];
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const fire = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  // Restart a CSS animation that hangs off an attribute.
  const replay = (node, attr) => {
    node.removeAttribute(attr);
    void node.offsetWidth;
    node.setAttribute(attr, "");
  };
  // Cards glide from where they were to where they are now (FLIP, transform only).
  function flip(nodes, mutate) {
    const before = new Map(nodes.map((n) => [n, n.getBoundingClientRect()]));
    mutate();
    if (reduce()) return;
    for (const [n, r] of before) {
      if (!n.isConnected) continue;
      const now = n.getBoundingClientRect();
      const dx = r.left - now.left;
      const dy = r.top - now.top;
      if (dx || dy) n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 340, easing: CURVE });
    }
  }
  // The scan runs on load and after every htmx settle, for the bits that need a first look.
  const scans = [];
  const scan = (root) => scans.forEach((f) => f(root));
  document.addEventListener("htmx:afterSettle", (e) => {
    const t = e.detail?.elt;
    scan(t && t.isConnected ? t.parentElement || document : document);
  });
  const within = (root, sel) => [...(root.matches?.(sel) ? [root] : []), ...all(root, sel)];

  /* ---------- DataTable ---------- */

  function dtSync(root) {
    const rows = all(root, "[data-asta-dt-row]");
    const head = root.querySelector("[data-asta-dt-all]");
    const n = rows.filter((r) => r.checked).length;
    if (head) {
      const mixed = n > 0 && n < rows.length;
      head.checked = n > 0 && n === rows.length;
      head.indeterminate = mixed;
      head.toggleAttribute("data-indeterminate", mixed);
      head.disabled = rows.length === 0;
      head.setAttribute("aria-label", head.checked ? "Deselect all rows on this page" : "Select all rows on this page");
    }
    const picked = root.querySelector("[data-asta-dt-picked]");
    const range = root.querySelector("[data-asta-dt-range]");
    if (picked && range) {
      picked.hidden = n === 0;
      range.hidden = n > 0;
      const c = picked.querySelector("[data-asta-dt-count]");
      if (c) c.textContent = String(n);
    }
  }
  scans.push((root) => within(root, "[data-asta-dt]").forEach(dtSync));
  document.addEventListener("change", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-dt]");
    if (!root) return;
    if (t.matches("[data-asta-dt-all]")) for (const r of all(root, "[data-asta-dt-row]")) r.checked = t.checked;
    if (t.matches("[data-asta-dt-all], [data-asta-dt-row]")) dtSync(root);
  });

  /* ---------- TreeView ---------- */

  const treeOf = (li) => li.closest("[data-asta-tree]");
  const rowOf = (li) => li.querySelector(":scope > [data-asta-tree-row]");
  const isFolder = (li) => li.hasAttribute("aria-expanded");
  const isOpen = (li) => li.getAttribute("aria-expanded") === "true";
  const off = (li) => li.getAttribute("aria-disabled") === "true";
  function treeVisible(tree) {
    return all(tree, '[role="treeitem"]').filter((li) => {
      for (let g = li.parentElement; g && g !== tree; g = g.parentElement) if (g.hidden) return false;
      return true;
    });
  }
  function treeFocus(li) {
    if (!li) return;
    for (const x of all(treeOf(li), '[role="treeitem"][tabindex="0"]')) x.tabIndex = -1;
    li.tabIndex = 0;
    li.focus();
  }
  function treeOpen(li, open, animate = true) {
    if (!isFolder(li) || off(li) || isOpen(li) === open) return;
    li.setAttribute("aria-expanded", String(open));
    rowOf(li)?.toggleAttribute("data-open", open);
    const g = li.querySelector(':scope > [role="group"]');
    if (g) {
      g.hidden = !open;
      if (open) {
        if (animate && !reduce()) replay(g, "data-opened");
        fire(g, "asta:expand");
      }
    }
    // Closing a folder that hides the focused row moves focus up to the folder.
    if (!open && li.contains(document.activeElement) && document.activeElement !== li) treeFocus(li);
  }
  function treeSelect(li) {
    if (off(li)) return;
    const tree = treeOf(li);
    for (const x of all(tree, '[role="treeitem"][aria-selected="true"]')) {
      x.setAttribute("aria-selected", "false");
      rowOf(x)?.removeAttribute("data-selected");
    }
    li.setAttribute("aria-selected", "true");
    rowOf(li)?.setAttribute("data-selected", "");
    const input = tree.querySelector(":scope > [data-asta-tree-value]");
    if (input) {
      input.value = li.dataset.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    fire(li, "asta:select", { id: li.dataset.id });
  }
  scans.push((root) => {
    for (const g of within(root, "[data-asta-tree-lazy]")) if (!g.hidden) fire(g, "asta:expand");
  });
  document.addEventListener("click", (e) => {
    const row = el(e)?.closest("[data-asta-tree-row]");
    if (!row) return;
    const li = row.parentElement;
    if (off(li)) return;
    treeFocus(li);
    // The chevron toggles without selecting.
    if (el(e).closest("[data-asta-tree-chevron]") && isFolder(li)) return treeOpen(li, !isOpen(li));
    treeSelect(li);
    if (isFolder(li)) treeOpen(li, !isOpen(li));
  });
  let typed = { text: "", at: 0 };
  document.addEventListener("keydown", (e) => {
    const li = el(e);
    if (!li?.matches('[data-asta-tree] [role="treeitem"]')) return;
    const tree = treeOf(li);
    const rows = treeVisible(tree);
    const i = rows.indexOf(li);
    const parent = li.parentElement.closest('[role="treeitem"]');
    let handled = true;
    switch (e.key) {
      case "ArrowDown":
        treeFocus(rows[i + 1]);
        break;
      case "ArrowUp":
        treeFocus(rows[i - 1]);
        break;
      case "Home":
        treeFocus(rows[0]);
        break;
      case "End":
        treeFocus(rows[rows.length - 1]);
        break;
      case "ArrowRight":
        if (isFolder(li) && !off(li)) {
          if (!isOpen(li)) treeOpen(li, true);
          else treeFocus(li.querySelector(':scope > [role="group"] > [role="treeitem"]'));
        }
        break;
      case "ArrowLeft":
        if (isFolder(li) && isOpen(li)) treeOpen(li, false);
        else if (parent && tree.contains(parent)) treeFocus(parent);
        break;
      case "Enter":
        rowOf(li)?.click();
        break;
      case " ":
        treeSelect(li);
        break;
      case "*": {
        const group = li.parentElement;
        for (const s of all(group, ':scope > [role="treeitem"]')) treeOpen(s, true);
        break;
      }
      default:
        handled = false;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          typed = { text: e.timeStamp - typed.at > 600 ? k : typed.text + k, at: e.timeStamp };
          const start = typed.text.length === 1 ? i + 1 : i;
          const order = [...rows.slice(start), ...rows.slice(0, start)];
          const hit = order.find((r) => (rowOf(r)?.textContent || "").trim().toLowerCase().startsWith(typed.text));
          if (hit) {
            treeFocus(hit);
            handled = true;
          }
        }
    }
    if (handled) e.preventDefault();
  });

  /* ---------- Timeline ---------- */

  const seen = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.dataset.inview = "true";
        seen.unobserve(en.target);
      }
    },
    { threshold: 0.2 },
  );
  scans.push((root) => within(root, '[data-asta-timeline][data-inview="false"]').forEach((t) => seen.observe(t)));

  /* ---------- Kanban ---------- */

  const kbCards = (root) => all(root, "[data-asta-kanban-card]");
  const kbListOf = (root, col) => root.querySelector(`[data-asta-kanban-col="${CSS.escape(col)}"] [data-asta-kanban-list]`);
  function kbWhere(card) {
    const col = card.closest("[data-asta-kanban-col]");
    const list = all(col, "[data-asta-kanban-card]");
    return `${col.getAttribute("aria-label")}, position ${list.indexOf(card) + 1} of ${list.length}`;
  }
  function kbSay(root, msg) {
    const s = root.querySelector("[data-asta-kanban-status]");
    if (s) s.textContent = msg;
  }
  function kbCounts(root) {
    for (const col of all(root, "[data-asta-kanban-col]")) {
      const c = col.querySelector("[data-asta-kanban-count]");
      const n = String(col.querySelectorAll("[data-asta-kanban-card]").length);
      if (c && c.textContent !== n) {
        c.textContent = n;
        if (!reduce()) replay(c, "data-bump");
      }
    }
  }
  // Save a move: fill the hidden fields and fire asta:move, which the board's hx-post listens for.
  function kbCommit(root, card) {
    const col = card.closest("[data-asta-kanban-col]");
    const detail = {
      card: card.dataset.astaKanbanCard,
      column: col.dataset.astaKanbanCol,
      position: all(col, "[data-asta-kanban-card]").indexOf(card),
    };
    for (const [k, v] of Object.entries(detail)) {
      const f = root.querySelector(`[data-asta-kanban-field="${k}"]`);
      if (f) f.value = String(v);
    }
    kbCounts(root);
    kbSay(root, `Dropped ${card.dataset.title} in ${kbWhere(card)}.`);
    fire(root, "asta:move", detail);
  }

  let drag = null;
  const gap = document.createElement("li");
  gap.setAttribute("data-asta-kanban-gap", "");
  gap.setAttribute("aria-hidden", "true");
  document.addEventListener("dragstart", (e) => {
    const card = el(e)?.closest("[data-asta-kanban-card]");
    if (!card) return;
    const root = card.closest("[data-asta-kanban]");
    drag = { card, root, h: card.offsetHeight, dropped: false };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.astaKanbanCard);
    gap.style.height = `${drag.h}px`;
    // Let the browser take its drag picture first, then fade the original.
    requestAnimationFrame(() => card.setAttribute("data-dragging", ""));
  });
  document.addEventListener("dragover", (e) => {
    if (!drag) return;
    const col = el(e)?.closest("[data-asta-kanban-col]");
    if (!col || !drag.root.contains(col)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const list = col.querySelector("[data-asta-kanban-list]");
    const cards = all(list, "[data-asta-kanban-card]").filter((c) => c !== drag.card);
    // The first card whose middle is below the pointer.
    const before = cards.find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    if (gap.parentElement === list && gap.nextElementSibling === (before ?? null)) return;
    if (!before && gap.parentElement === list && !gap.nextElementSibling) return;
    const moving = [...new Set([...kbCards(drag.root)].filter((c) => c !== drag.card))];
    flip(moving, () => {
      if (drag.card.parentElement) drag.card.hidden = true;
      list.insertBefore(gap, before ?? null);
    });
  });
  document.addEventListener("drop", (e) => {
    if (!drag || !gap.parentElement) return;
    e.preventDefault();
    const { card, root } = drag;
    gap.replaceWith(card);
    card.hidden = false;
    drag.dropped = true;
    kbCommit(root, card);
  });
  document.addEventListener("dragend", () => {
    if (!drag) return;
    const { card, root, dropped } = drag;
    if (!dropped) {
      const moving = kbCards(root).filter((c) => c !== card);
      flip(moving, () => {
        gap.remove();
        card.hidden = false;
      });
    }
    gap.remove();
    card.hidden = false;
    card.removeAttribute("data-dragging");
    drag = null;
  });

  // Keyboard: Space picks up, arrows move, Space drops, Escape cancels.
  let held = null;
  let moving = false;
  function kbDrop(cancel, focus) {
    if (!held) return;
    const { card, root, from, next } = held;
    held = null;
    card.removeAttribute("data-picked");
    if (cancel) {
      moving = true;
      flip(kbCards(root), () => from.insertBefore(card, next && next.parentElement === from ? next : null));
      moving = false;
      kbCounts(root);
      if (focus) card.focus();
      kbSay(root, `Cancelled. ${card.dataset.title} is back in ${kbWhere(card)}.`);
    } else kbCommit(root, card);
  }
  document.addEventListener("keydown", (e) => {
    const card = el(e);
    if (!card?.matches("[data-asta-kanban-card]")) return;
    const root = card.closest("[data-asta-kanban]");
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (held?.card === card) kbDrop(false);
      else if (!held) {
        held = { card, root, from: card.parentElement, next: card.nextElementSibling };
        card.setAttribute("data-picked", "");
        kbSay(root, `Picked up ${card.dataset.title}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (held?.card !== card) return;
    if (e.key === "Escape") {
      e.preventDefault();
      return kbDrop(true, true);
    }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir) return;
    e.preventDefault();
    const cols = all(root, "[data-asta-kanban-col]");
    const col = card.closest("[data-asta-kanban-col]");
    const ci = cols.indexOf(col);
    const target = cols[Math.min(cols.length - 1, Math.max(0, ci + dir[0]))];
    const here = all(col, "[data-asta-kanban-card]").indexOf(card);
    const list = target.querySelector("[data-asta-kanban-list]");
    const others = all(list, "[data-asta-kanban-card]").filter((c) => c !== card);
    const index = dir[0] ? Math.min(here, others.length) : Math.min(others.length, Math.max(0, here + dir[1]));
    if (target === col && index === here) return;
    moving = true;
    flip(kbCards(root), () => list.insertBefore(card, others[index] ?? null));
    card.focus();
    moving = false;
    kbCounts(root);
    kbSay(root, `${card.dataset.title}: ${kbWhere(card)}.`);
  });
  // Focus leaving the held card cancels the pick-up.
  document.addEventListener("focusout", (e) => {
    if (!held || moving || el(e) !== held.card) return;
    const card = held.card;
    setTimeout(() => {
      if (held?.card === card && document.activeElement !== card) kbDrop(true, false);
    });
  });

  /* ---------- EventCalendar ---------- */

  const parseDay = (k) => new Date(`${k}T00:00:00Z`);
  const dayKey = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
  const addMonths = (d, n) => {
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n + 1, 0)).getUTCDate();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, Math.min(d.getUTCDate(), last)));
  };
  let calPending = null;
  function calSelect(root, cell) {
    for (const c of all(root, '[role="gridcell"][aria-selected="true"]')) c.setAttribute("aria-selected", "false");
    cell.setAttribute("aria-selected", "true");
    calFocus(root, cell, false);
    const k = cell.dataset.day;
    for (const p of all(root, "[data-asta-cal-panel]")) p.hidden = p.dataset.astaCalPanel !== k;
    const input = root.querySelector("[data-asta-cal-value]");
    if (input) {
      input.value = k;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    fire(root, "asta:select", { day: k });
  }
  function calFocus(root, cell, focus = true) {
    for (const c of all(root, '[role="gridcell"][tabindex="0"]')) c.tabIndex = -1;
    cell.tabIndex = 0;
    if (focus) cell.focus();
  }
  // Load another month with htmx, then put focus on the day.
  function calGo(root, k, focus) {
    const url = root.dataset.tpl.replace("__M__", k.slice(0, 7)).replace("__D__", k);
    calPending = { id: root.id, key: k, focus, dir: k.slice(0, 7) > root.dataset.month ? "next" : "prev" };
    if (!window.htmx) return void (location.href = url);
    const push = root.getAttribute("hx-push-url") !== "false";
    htmx.ajax("GET", url, { source: root, target: `#${root.id}`, select: `#${root.id}`, swap: "outerHTML show:none" }).then(() => {
      if (push) history.pushState({ htmx: true }, "", url);
    });
  }
  document.addEventListener("click", (e) => {
    const t = el(e);
    const nav = t?.closest("[data-asta-cal-nav]");
    if (nav) {
      const root = nav.closest("[data-asta-cal]");
      const kind = nav.dataset.astaCalNav;
      const dir = kind === "today" ? (root.dataset.today.slice(0, 7) > root.dataset.month ? "next" : root.dataset.today.slice(0, 7) < root.dataset.month ? "prev" : "") : kind;
      calPending = { id: root.id, dir, focus: false };
      return;
    }
    const cell = t?.closest('[data-asta-cal] [role="gridcell"]');
    if (!cell) return;
    const root = cell.closest("[data-asta-cal]");
    if (cell.hasAttribute("data-out")) calGo(root, cell.dataset.day, true);
    else calSelect(root, cell);
  });
  document.addEventListener("keydown", (e) => {
    const cell = el(e);
    if (!cell?.matches('[data-asta-cal] [role="gridcell"]')) return;
    const root = cell.closest("[data-asta-cal]");
    const d = parseDay(cell.dataset.day);
    const week = Number(root.dataset.week || 1);
    const offset = (d.getUTCDay() - week + 7) % 7;
    const to = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -offset),
      End: () => addDays(d, 6 - offset),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
    }[e.key];
    if (to) {
      e.preventDefault();
      const k = dayKey(to());
      const next = root.querySelector(`[role="gridcell"][data-day="${k}"]:not([data-out])`);
      if (next) calFocus(root, next);
      else calGo(root, k, true);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cell.click();
    }
  });
  scans.push(() => {
    if (!calPending) return;
    const root = document.getElementById(calPending.id);
    if (!root?.matches("[data-asta-cal]")) return;
    const { dir, key, focus } = calPending;
    calPending = null;
    const grid = root.querySelector("[data-asta-cal-grid]");
    if (grid && dir && !reduce()) grid.dataset.dir = dir;
    const cell = key && root.querySelector(`[role="gridcell"][data-day="${key}"]`);
    if (cell && focus) calFocus(root, cell);
  });

  /* ---------- FileCard ---------- */

  document.addEventListener("click", (e) => {
    const b = el(e)?.closest("[data-asta-file-star]");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    const title = (b.getAttribute("aria-label") || "").replace(/^(Un)?star /, "");
    b.setAttribute("aria-pressed", String(on));
    b.value = String(on);
    b.setAttribute("aria-label", `${on ? "Unstar" : "Star"} ${title}`);
    if (on) replay(b, "data-popped");
    fire(b, "asta:star", { starred: on });
  });
  scans.push((root) => {
    for (const b of within(root, "[data-asta-file-star]")) {
      const on = b.getAttribute("aria-pressed") === "true";
      if (on && b.getAttribute("aria-label")?.startsWith("Star ")) b.setAttribute("aria-label", `Un${b.getAttribute("aria-label").slice(0, 1).toLowerCase()}${b.getAttribute("aria-label").slice(1)}`);
    }
  });

  /* ---------- ImageCompare ---------- */

  const clamp = (n) => Math.min(100, Math.max(0, n));
  function cmpSet(root, n) {
    const v = Math.round(clamp(n) * 10) / 10;
    root.style.setProperty("--pos", String(v));
    root.toggleAttribute("data-hide-before", v < 18);
    root.toggleAttribute("data-hide-after", v > 82);
    const h = root.querySelector("[data-asta-compare-handle]");
    if (h) {
      h.setAttribute("aria-valuenow", String(Math.round(v)));
      h.setAttribute("aria-valuetext", `${Math.round(v)}% ${root.dataset.before}, ${Math.round(100 - v)}% ${root.dataset.after}`);
    }
    fire(root, "asta:change", { value: v });
  }
  const cmpPos = (root) => parseFloat(root.style.getPropertyValue("--pos")) || 50;
  const cmpAt = (root, x) => {
    const r = root.getBoundingClientRect();
    return r.width ? ((x - r.left) / r.width) * 100 : cmpPos(root);
  };
  let press = null;
  const cmpHandle = (root) => root.querySelector("[data-asta-compare-handle]");
  document.addEventListener("pointerdown", (e) => {
    const root = el(e)?.closest("[data-asta-compare]");
    if (!root || e.button !== 0) return;
    const touch = e.pointerType === "touch";
    press = { root, id: e.pointerId, x: e.clientX, y: e.clientY, touch, moved: false };
    if (touch) return;
    root.setPointerCapture(e.pointerId);
    cmpSet(root, cmpAt(root, e.clientX));
    cmpHandle(root)?.focus({ preventScroll: true });
  });
  // Keeps focus on the handle (a press on the frame would blur it) and stops text selection.
  document.addEventListener("mousedown", (e) => {
    if (el(e)?.closest("[data-asta-compare]")) e.preventDefault();
  });
  document.addEventListener("pointermove", (e) => {
    const p = press;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved) {
      const dx = Math.abs(e.clientX - p.x);
      const dy = Math.abs(e.clientY - p.y);
      // Touch waits for a horizontal move, so a vertical swipe scrolls the page.
      if (p.touch ? dx < 6 || dx <= dy : dx < 2) return;
      p.moved = true;
      if (p.touch) {
        p.root.setPointerCapture(e.pointerId);
        cmpHandle(p.root)?.focus({ preventScroll: true });
      }
      p.root.setAttribute("data-dragging", "");
    }
    cmpSet(p.root, cmpAt(p.root, e.clientX));
  });
  const cmpUp = (e) => {
    const p = press;
    if (!p || p.id !== e.pointerId) return;
    press = null;
    if (p.touch && !p.moved && e.type === "pointerup") {
      cmpSet(p.root, cmpAt(p.root, e.clientX));
      cmpHandle(p.root)?.focus({ preventScroll: true });
    }
    p.root.removeAttribute("data-dragging");
  };
  document.addEventListener("pointerup", cmpUp);
  document.addEventListener("pointercancel", cmpUp);
  document.addEventListener("keydown", (e) => {
    const h = el(e);
    if (!h?.matches("[data-asta-compare-handle]")) return;
    const root = h.closest("[data-asta-compare]");
    const pos = cmpPos(root);
    const step = parseFloat(root.dataset.step) || 2;
    const to = { ArrowLeft: pos - step, ArrowDown: pos - step, ArrowRight: pos + step, ArrowUp: pos + step, PageDown: pos - step * 10, PageUp: pos + step * 10, Home: 0, End: 100 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    cmpSet(root, to);
  });

  /* ---------- Carousel ---------- */

  const carTrack = (root) => root.querySelector("[data-asta-carousel-track]");
  const carSlides = (root) => all(root, "[data-asta-carousel-slide]");
  const carStep = (root) => {
    const s = carSlides(root);
    return s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft : carTrack(root).clientWidth || 1;
  };
  function carShow(root, i) {
    const slides = carSlides(root);
    const n = slides.length;
    if (String(i) === root.dataset.index) return;
    root.dataset.index = String(i);
    slides.forEach((s, k) => {
      s.toggleAttribute("inert", k !== i);
      if (k === i) s.removeAttribute("aria-hidden");
      else s.setAttribute("aria-hidden", "true");
    });
    for (const d of all(root, "[data-asta-carousel-dot]")) {
      const k = Number(d.dataset.astaCarouselDot);
      const on = k === i;
      if (on) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
      d.style.width = `${on ? 30 : 14}px`;
      d.style.transform = `translateX(${k * 14 + (k > i ? 16 : 0)}px)`;
    }
    const loop = root.hasAttribute("data-loop");
    const [prev, next] = all(root, "[data-asta-carousel-step]");
    if (prev) prev.disabled = !loop && i === 0;
    if (next) next.disabled = !loop && i === n - 1;
    fire(root, "asta:slide", { index: i });
  }
  function carGo(root, i, wrap) {
    const n = carSlides(root).length;
    if (!n) return;
    const to = wrap || root.hasAttribute("data-loop") ? (i + n) % n : Math.max(0, Math.min(n - 1, i));
    root._target = to;
    carShow(root, to);
    carTrack(root).scrollTo({ left: to * carStep(root), behavior: reduce() ? "auto" : "smooth" });
  }
  function carPlay(root) {
    const on = root.hasAttribute("data-autoplay") && !reduce() && root._visible && !root._hover && !root._focus;
    root.toggleAttribute("data-playing", !!on);
    const t = carTrack(root);
    if (t) t.setAttribute("aria-live", on ? "off" : "polite");
  }
  const carSeen = new IntersectionObserver((entries) => {
    for (const en of entries) {
      en.target._visible = en.isIntersecting;
      carPlay(en.target);
    }
  });
  scans.push((root) => {
    for (const c of within(root, "[data-asta-carousel]")) {
      if (c._init) continue;
      c._init = true;
      if (c.dataset.autoplay) c.style.setProperty("--asta-autoplay", `${c.dataset.autoplay}ms`);
      carSeen.observe(c);
    }
  });
  document.addEventListener(
    "scroll",
    (e) => {
      const t = el(e);
      if (!t?.matches?.("[data-asta-carousel-track]") || t._raf) return;
      t._raf = requestAnimationFrame(() => {
        t._raf = 0;
        const root = t.closest("[data-asta-carousel]");
        const i = Math.round(t.scrollLeft / carStep(root));
        if (root._target !== undefined) {
          if (i !== root._target) return;
          root._target = undefined;
        }
        carShow(root, i);
      });
    },
    true,
  );
  document.addEventListener(
    "scrollend",
    (e) => {
      const t = el(e);
      if (!t?.matches?.("[data-asta-carousel-track]")) return;
      const root = t.closest("[data-asta-carousel]");
      root._target = undefined;
      carShow(root, Math.round(t.scrollLeft / carStep(root)));
    },
    true,
  );
  document.addEventListener("click", (e) => {
    const t = el(e);
    const dot = t?.closest("[data-asta-carousel-dot]");
    const step = t?.closest("[data-asta-carousel-step]");
    if (!dot && !step) return;
    const root = (dot || step).closest("[data-asta-carousel]");
    if (dot) carGo(root, Number(dot.dataset.astaCarouselDot));
    else carGo(root, Number(root.dataset.index) + Number(step.dataset.astaCarouselStep));
  });
  document.addEventListener("keydown", (e) => {
    const root = el(e);
    if (!root?.matches("[data-asta-carousel]")) return;
    const i = Number(root.dataset.index);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: carSlides(root).length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    carGo(root, to);
  });
  document.addEventListener("animationend", (e) => {
    if (e.animationName !== "asta-carousel-fill") return;
    const root = el(e).closest("[data-asta-carousel]");
    if (root) carGo(root, Number(root.dataset.index) + 1, true);
  });
  for (const [type, on] of [
    ["pointerover", true],
    ["pointerout", false],
  ])
    document.addEventListener(type, (e) => {
      const root = el(e)?.closest("[data-asta-carousel]");
      if (!root || root.contains(e.relatedTarget)) return;
      root._hover = on;
      carPlay(root);
    });
  document.addEventListener("focusin", (e) => {
    const root = el(e)?.closest("[data-asta-carousel]");
    if (!root) return;
    // Only keyboard focus pauses autoplay. Clicking an arrow or a dot shouldn't stop it.
    let visible = true;
    try {
      visible = el(e).matches(":focus-visible");
    } catch {}
    if (visible) {
      root._focus = true;
      carPlay(root);
    }
  });
  document.addEventListener("focusout", (e) => {
    const root = el(e)?.closest("[data-asta-carousel]");
    if (!root || root.contains(e.relatedTarget)) return;
    root._focus = false;
    carPlay(root);
  });

  /* ---------- NotificationCenter ---------- */

  const ncParts = (root) => ({
    trigger: root.querySelector("[data-asta-nc-trigger]"),
    panel: root.querySelector("[data-asta-nc-panel]"),
  });
  function ncOpen(root, on) {
    const { trigger, panel } = ncParts(root);
    if (!trigger || !panel) return;
    if (on) {
      for (const o of document.querySelectorAll("[data-asta-nc][data-open]")) if (o !== root) ncOpen(o, false);
      root.setAttribute("data-open", "");
      trigger.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      panel.style.left = panel.style.right = "";
      // Keep the panel on screen on narrow viewports. Measure the anchor, not the panel: the panel is mid-scale.
      const box = root.getBoundingClientRect();
      const w = panel.offsetWidth;
      if (root.dataset.align === "start") {
        if (box.left + w > innerWidth - 8) panel.style.left = `${innerWidth - 8 - w - box.left}px`;
      } else if (box.right - w < 8) panel.style.right = `${box.right - w - 8}px`;
      replay(root.querySelector("[data-asta-nc-list]"), "data-fresh");
    } else if (root.hasAttribute("data-open")) {
      root.removeAttribute("data-open");
      trigger.setAttribute("aria-expanded", "false");
      setTimeout(() => {
        if (!root.hasAttribute("data-open")) panel.hidden = true;
      }, reduce() ? 0 : 170);
    }
  }
  function ncSync(root) {
    const { trigger, panel } = ncParts(root);
    const entries = all(root, "[data-asta-nc-entry]");
    const n = entries.filter((x) => !x.hasAttribute("data-read")).length;
    const label = root.dataset.label;
    trigger.setAttribute("aria-label", n ? `${label}, ${n} unread` : label);
    const badge = root.querySelector("[data-asta-nc-badge]");
    const count = root.querySelector("[data-asta-nc-count]");
    const text = n > 99 ? "99+" : String(n);
    if (badge) badge.hidden = n === 0;
    if (count && count.textContent !== text) {
      count.textContent = text;
      if (!reduce()) replay(count, "data-bump");
    }
    const tc = root.querySelector("[data-asta-nc-tabcount]");
    if (tc) {
      tc.textContent = String(n);
      tc.hidden = n === 0;
    }
    root.querySelector("[data-asta-nc-all]")?.toggleAttribute("aria-disabled", n === 0);
    // The empty state follows what the current tab shows.
    const unreadTab = panel.dataset.tab === "unread";
    const shown = unreadTab ? entries.filter((x) => !x.hasAttribute("data-read") || x.hasAttribute("data-keep")).length : entries.length;
    const empty = root.querySelector("[data-asta-nc-empty]");
    if (empty) {
      empty.hidden = shown > 0;
      for (const p of all(empty, "[data-unread]")) {
        p.dataset.all ??= p.textContent;
        p.textContent = unreadTab ? p.dataset.unread : p.dataset.all;
      }
    }
  }
  function ncRead(root, entries, say) {
    let changed = false;
    for (const x of entries) {
      if (x.hasAttribute("data-read")) continue;
      changed = true;
      x.setAttribute("data-read", "");
      const dot = x.querySelector("[data-asta-nc-dot]");
      if (dot) {
        dot.tabIndex = -1;
        dot.setAttribute("aria-hidden", "true");
      }
    }
    if (changed) ncSync(root);
    if (say) {
      const s = root.querySelector("[data-asta-nc-status]");
      if (s) s.textContent = say;
    }
    return changed;
  }
  function ncTab(root, tab) {
    const { panel } = ncParts(root);
    for (const t of all(root, "[data-asta-nc-tab]")) {
      const on = t.dataset.astaNcTab === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    // What was unread when the Unread tab opened stays listed, so rows don't vanish as you read them.
    for (const x of all(root, "[data-asta-nc-entry]")) x.toggleAttribute("data-keep", tab === "unread" && !x.hasAttribute("data-read"));
    panel.dataset.tab = tab;
    const list = root.querySelector("[data-asta-nc-list]");
    list?.setAttribute("aria-label", tab === "unread" ? "Unread notifications" : "All notifications");
    if (list) replay(list, "data-fresh");
    ncSync(root);
  }
  document.addEventListener("click", (e) => {
    const t = el(e);
    const trigger = t?.closest("[data-asta-nc-trigger]");
    if (trigger) {
      const root = trigger.closest("[data-asta-nc]");
      ncOpen(root, !root.hasAttribute("data-open"));
    }
    for (const root of document.querySelectorAll("[data-asta-nc][data-open]")) if (!root.contains(t)) ncOpen(root, false);
    const root = t?.closest("[data-asta-nc]");
    if (!root || trigger) return;
    const tab = t.closest("[data-asta-nc-tab]");
    if (tab) return ncTab(root, tab.dataset.astaNcTab);
    if (t.closest("[data-asta-nc-all]")) return void ncRead(root, all(root, "[data-asta-nc-entry]"), "All notifications marked as read.");
    const dot = t.closest("[data-asta-nc-dot]");
    const entry = t.closest("[data-asta-nc-entry]");
    if (dot) {
      ncRead(root, [entry], "Marked as read.");
      entry.querySelector("[data-asta-nc-item]")?.focus();
      return;
    }
    if (t.closest("[data-asta-nc-item]") && entry && ncRead(root, [entry]) && root.dataset.url) {
      // The row may be a link that navigates away, so this post must outlive the page.
      fetch(root.dataset.url, {
        method: "POST",
        keepalive: true,
        headers: { "HX-Request": "true" },
        body: new URLSearchParams({ id: entry.dataset.astaNcEntry }),
      }).catch(() => {});
    }
  });
  document.addEventListener("keydown", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-nc]");
    if (!root?.hasAttribute("data-open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      ncOpen(root, false);
      ncParts(root).trigger.focus();
      return;
    }
    const tab = t.closest("[data-asta-nc-tab]");
    if (tab && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const other = tab.dataset.astaNcTab === "all" ? "unread" : "all";
      ncTab(root, other);
      root.querySelector(`[data-asta-nc-tab="${other}"]`)?.focus();
      return;
    }
    if (!t.closest("[data-asta-nc-list]") || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = all(root, "[data-asta-nc-item]").filter((r) => r.offsetParent);
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(document.activeElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : Math.min(rows.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
    rows[next]?.focus();
  });

  /* ---------- Comments ---------- */

  const cmSubmit = (form) => form.querySelector('button[type="submit"]');
  function cmCheck(form) {
    const b = cmSubmit(form);
    if (b) b.disabled = !form.querySelector("textarea")?.value.trim();
  }
  function cmClose(box, focus) {
    const opener = box._opener;
    box.remove();
    if (focus && opener?.isConnected) opener.focus();
  }
  function cmTotal(root) {
    const t = root.querySelector("[data-asta-comments-total]");
    if (t) t.textContent = String(root.querySelectorAll("[data-asta-comment]").length);
  }
  scans.push((root) => {
    for (const r of within(root, "[data-asta-comments]")) cmTotal(r);
    if (root !== document) root.closest?.("[data-asta-comments]") && cmTotal(root.closest("[data-asta-comments]"));
  });
  document.addEventListener("input", (e) => {
    const form = el(e)?.closest("[data-asta-comment-form]");
    if (form) cmCheck(form);
  });
  document.addEventListener("keydown", (e) => {
    const area = el(e);
    const form = area?.closest("[data-asta-comment-form]");
    if (!form || area.tagName !== "TEXTAREA") return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (area.value.trim()) form.requestSubmit();
    } else if (e.key === "Escape" && form.hasAttribute("data-reply")) {
      e.preventDefault();
      cmClose(form.closest("[data-asta-comment-replybox]"), true);
    }
  });
  document.addEventListener("click", (e) => {
    const t = el(e);
    const cancel = t?.closest("[data-asta-comment-cancel]");
    if (cancel) return cmClose(cancel.closest("[data-asta-comment-replybox]"), true);
    const reply = t?.closest("[data-asta-comment-reply]");
    if (reply) {
      const root = reply.closest("[data-asta-comments]");
      const thread = root.querySelector(`[data-asta-comment-thread="${CSS.escape(reply.dataset.astaCommentReply)}"]`);
      const replies = thread?.querySelector("[data-asta-comment-replies]");
      const tpl = root.querySelector("template[data-asta-comments-replybox]");
      if (!replies || !tpl) return;
      let box = replies.querySelector(":scope > [data-asta-comment-replybox]");
      if (!box) {
        box = tpl.content.firstElementChild.cloneNode(true);
        replies.append(box);
        window.htmx?.process(box);
      }
      box._opener = thread.querySelector("[data-asta-comment-reply]");
      const name = box._opener?.dataset.name || "";
      box.querySelector('input[name="parent"]').value = reply.dataset.astaCommentReply;
      const area = box.querySelector("textarea");
      area.placeholder = `Reply to ${name}…`;
      if (reply.dataset.mention) area.value = `@${reply.dataset.mention} `;
      cmCheck(box.querySelector("form"));
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
      return;
    }
    const like = t?.closest("[data-asta-comment-like]");
    if (like) {
      const on = like.getAttribute("aria-pressed") !== "true";
      const c = like.querySelector("[data-asta-comment-likes]");
      const n = Math.max(0, Number(c?.textContent || 0) + (on ? 1 : -1));
      like.setAttribute("aria-pressed", String(on));
      like.value = String(on);
      like.setAttribute("aria-label", `Like, ${n}`);
      if (c) c.textContent = String(n);
      if (!reduce()) replay(like, "data-popped");
      fire(like, "asta:like", { liked: on });
    }
  });
  document.addEventListener("htmx:afterRequest", (e) => {
    const form = e.detail?.elt;
    if (!form?.matches?.("[data-asta-comment-form]") || !e.detail.successful) return;
    const area = form.querySelector("textarea");
    if (area) area.value = "";
    cmCheck(form);
    if (form.hasAttribute("data-reply")) cmClose(form.closest("[data-asta-comment-replybox]"), true);
  });

  /* ---------- MotionButton ---------- */

  const mbSeen = new IntersectionObserver((entries) => {
    for (const en of entries) en.target.toggleAttribute("data-offscreen", !en.isIntersecting);
  });
  scans.push((root) => {
    for (const b of within(root, '[data-asta-mb="beam"]')) mbSeen.observe(b);
  });
  for (const type of ["pointerover", "pointerout"])
    document.addEventListener(type, (e) => {
      const b = el(e)?.closest('[data-asta-mb="fill"], [data-asta-mb="shine"]');
      if (!b || b.contains(e.relatedTarget)) return;
      if (b.dataset.astaMb === "fill") {
        // The circle grows from where the pointer came in and shrinks toward where it leaves.
        const r = b.getBoundingClientRect();
        b.style.setProperty("--fx", `${e.clientX - r.left}px`);
        b.style.setProperty("--fy", `${e.clientY - r.top}px`);
      } else if (type === "pointerover") b.toggleAttribute("data-shine");
    });
  document.addEventListener("focusin", (e) => {
    const b = el(e)?.closest('[data-asta-mb="shine"]');
    if (b) b.toggleAttribute("data-shine");
  });
  document.addEventListener("click", (e) => {
    const b = el(e)?.closest('[data-asta-mb="copy"], [data-asta-mb="confirm"]');
    if (!b) return;
    clearTimeout(b._t);
    if (b.dataset.astaMb === "copy") {
      navigator.clipboard?.writeText(b.dataset.value || "").catch(() => {});
      b.setAttribute("data-done", "");
      const s = b.querySelector("[data-asta-mb-status]");
      if (s) s.textContent = "Copied to clipboard";
      b._t = setTimeout(() => {
        b.removeAttribute("data-done");
        if (s) s.textContent = "";
      }, 1600);
      return;
    }
    const ms = Number(b.dataset.timeout) || 3000;
    if (b.dataset.stage === "idle") {
      b.style.setProperty("--asta-timeout", `${ms}ms`);
      b.dataset.stage = "ask";
      b._t = setTimeout(() => (b.dataset.stage = "idle"), ms);
    } else if (b.dataset.stage === "ask") {
      b.dataset.stage = "done";
      fire(b, "asta:confirm");
      b._t = setTimeout(() => (b.dataset.stage = "idle"), 1800);
    }
  });
  document.addEventListener("focusout", (e) => {
    const b = el(e)?.closest('[data-asta-mb="confirm"][data-stage="ask"]');
    if (b) {
      clearTimeout(b._t);
      b.dataset.stage = "idle";
    }
  });

  // First look, once every section above has added its scan.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan(document));
  else scan(document);
})();
