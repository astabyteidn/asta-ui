/* Assist: model picker, citations, trace waterfall, prompt composer.
 * Event delegation on document, so markup swapped in by htmx works without re-init.
 *   Model     [data-asta-model]: the trigger opens a listbox, [data-asta-model-search] filters it, arrows/Home/End move,
 *             Enter picks, Esc closes, typing on the closed trigger searches. Picking updates
 *             [data-asta-model-value], the trigger label/tag and fires "asta:model-change" with detail.value
 *   Citations [data-asta-cite]: a pill shows its card on hover, focus or tap. Hovering a source lights its pills
 *             (data-lit) and the other way round. [data-asta-cite-toggle] expands the source list (data-expanded)
 *   Trace     [data-asta-trace]: [data-asta-trace-toggle] or ←/→ folds a span, ↑/↓/Home/End move, a click or
 *             Enter selects it and copies <template data-asta-trace-for="id"> into [data-asta-trace-detail].
 *             Fires "asta:trace-select" with detail.id
 *   Prompt    [data-asta-prompt]: @ and / open [data-asta-prompt-menu], a pick becomes an atomic chip that one
 *             Backspace removes. Enter sends, Shift+Enter adds a line. Fills [data-asta-prompt-value] and
 *             [data-asta-prompt-refs], lists attached files, sets data-running during an htmx request.
 *             Fires "asta:prompt-send" (detail { text, refs, files }) and "asta:prompt-stop"
 */
(() => {
  if (window.astaAssist) return;
  window.astaAssist = true;
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const fire = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const shown = (n) => !n.hidden && !n.closest("[hidden]");
  let uid = 0;
  const idOf = (n, p) => n.id || (n.id = `${p}-${++uid}`);

  /* Loops (composer orbit, running spans) rest off screen and while the tab is hidden. */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)))
      : null;
  const watched = new Set();
  function watch(root) {
    if (!io || watched.has(root)) return;
    watched.add(root);
    io.observe(root);
  }
  function scan(scope = document) {
    scope.querySelectorAll?.("[data-asta-prompt], [data-asta-trace]").forEach(watch);
    scope.querySelectorAll?.(".asta-trace-bar:not([data-seen])").forEach((b) => {
      b.setAttribute("data-seen", "");
      const x = parseFloat(b.style.getPropertyValue("--x")) || 0;
      if (!b.style.animationDelay) b.style.animationDelay = `${Math.round(x * 5)}ms`;
    });
    scope.querySelectorAll?.("[data-asta-prompt]").forEach(syncPrompt);
    watched.forEach((r) => {
      if (r.isConnected) return;
      io?.unobserve(r);
      watched.delete(r);
    });
  }
  document.addEventListener("visibilitychange", () => watched.forEach((r) => r.toggleAttribute("data-paused", document.hidden)));
  window.addEventListener("pagehide", () => io?.disconnect(), { once: true });

  /* ---------- Model picker ---------- */

  const mpOptions = (mp) => [...mp.querySelectorAll('[role="option"]')].filter(shown);
  const mpUsable = (mp) => mpOptions(mp).filter((o) => o.getAttribute("aria-disabled") !== "true");
  function mpPlace(mp, animate) {
    const list = mp.querySelector('[role="listbox"]');
    const act = mp.querySelector('[role="option"][data-active]');
    const sel = mp.querySelector('[role="option"][aria-selected="true"]');
    const ease = animate ? "transform .32s cubic-bezier(.16,1,.3,1), opacity .2s" : "none";
    const mark = mp.querySelector(".asta-model-picker-mark");
    const bar = mp.querySelector(".asta-model-picker-bar");
    if (mark) {
      mark.style.transition = ease;
      mark.style.opacity = act && shown(act) ? "1" : "0";
      if (act) mark.style.transform = `translateY(${act.offsetTop}px)`;
    }
    if (bar) {
      bar.style.transition = ease;
      bar.style.opacity = sel && shown(sel) ? "1" : "0";
      if (sel) bar.style.transform = `translateY(${sel.offsetTop + (sel.offsetHeight - bar.offsetHeight) / 2}px)`;
    }
    if (act && list && animate !== null) {
      const top = act.offsetTop;
      if (top < list.scrollTop) list.scrollTop = top - 32;
      else if (top + act.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + act.offsetHeight - list.clientHeight + 6;
    }
  }
  function mpActivate(mp, opt, animate = true) {
    mp.querySelectorAll('[role="option"][data-active]').forEach((o) => o.removeAttribute("data-active"));
    const owner = mp.querySelector("[data-asta-model-search]") || mp.querySelector('[role="listbox"]');
    if (opt) {
      opt.setAttribute("data-active", "");
      owner?.setAttribute("aria-activedescendant", idOf(opt, "asta-mp"));
    } else owner?.removeAttribute("aria-activedescendant");
    mpPlace(mp, animate);
  }
  function mpFilter(mp, q) {
    q = q.trim().toLowerCase();
    mp.querySelectorAll('[role="option"]').forEach((o) => {
      const hay = `${o.dataset.label || o.textContent} ${o.closest('[role="group"]')?.querySelector(".asta-model-picker-group")?.textContent || ""}`.toLowerCase();
      o.hidden = !!q && !hay.includes(q);
    });
    mp.querySelectorAll('[role="listbox"] [role="group"]').forEach((g) => (g.hidden = !g.querySelector('[role="option"]:not([hidden])')));
    const empty = mp.querySelector("[data-asta-model-empty]");
    if (empty) {
      empty.hidden = mpOptions(mp).length > 0;
      const echo = empty.querySelector("[data-asta-model-query]");
      if (echo) echo.textContent = q;
    }
    mpActivate(mp, mpUsable(mp)[0] || null, false);
  }
  function mpOpen(mp, seed) {
    const trigger = mp.querySelector("[data-asta-model-trigger]");
    const panel = mp.querySelector(".asta-model-picker-panel");
    if (!panel || trigger?.disabled) return;
    document.querySelectorAll('[data-asta-model] [aria-expanded="true"][data-asta-model-trigger]').forEach((t) => t !== trigger && mpClose(t.closest("[data-asta-model]")));
    panel.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
    // Keep the popup inside the viewport with a 16px gutter.
    panel.style.translate = "";
    const r = panel.getBoundingClientRect();
    const dx = r.left < 16 ? 16 - r.left : r.right > innerWidth - 16 ? innerWidth - 16 - r.right : 0;
    if (dx) panel.style.translate = `${Math.round(dx)}px 0`;
    const search = mp.querySelector("[data-asta-model-search]");
    if (search) {
      search.value = seed || "";
      mpFilter(mp, search.value);
      search.focus();
    } else mp.querySelector('[role="listbox"]')?.focus();
    if (!seed) mpActivate(mp, mp.querySelector('[role="option"][aria-selected="true"]:not([aria-disabled="true"])') || mpUsable(mp)[0] || null, false);
  }
  function mpClose(mp, refocus) {
    if (!mp) return;
    const panel = mp.querySelector(".asta-model-picker-panel");
    const trigger = mp.querySelector("[data-asta-model-trigger]");
    if (panel) panel.hidden = true;
    trigger?.setAttribute("aria-expanded", "false");
    if (refocus) trigger?.focus();
  }
  function mpPick(mp, opt) {
    if (!opt || opt.getAttribute("aria-disabled") === "true") return;
    mp.querySelectorAll('[role="option"]').forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
    const value = opt.dataset.value || "";
    const input = mp.querySelector("[data-asta-model-value]");
    if (input) input.value = value;
    const label = mp.querySelector("[data-asta-model-label]");
    if (label) label.textContent = opt.dataset.label || value;
    const tag = mp.querySelector("[data-asta-model-tag]");
    if (tag) {
      tag.textContent = opt.dataset.tag || "";
      tag.hidden = !opt.dataset.tag;
    }
    mpPlace(mp, true);
    setTimeout(() => mpClose(mp, true), 120);
    fire(mp, "asta:model-change", { value });
  }
  document.addEventListener("click", (e) => {
    const t = el(e);
    const mp = t?.closest("[data-asta-model]");
    if (!mp) return;
    if (t.closest("[data-asta-model-trigger]")) {
      const open = mp.querySelector("[data-asta-model-trigger]").getAttribute("aria-expanded") === "true";
      if (open) mpClose(mp);
      else mpOpen(mp);
      return;
    }
    const opt = t.closest('[role="option"]');
    if (opt && mp.contains(opt)) mpPick(mp, opt);
  });
  document.addEventListener("pointermove", (e) => {
    const opt = el(e)?.closest('[data-asta-model] [role="option"]');
    if (!opt || opt.hasAttribute("data-active") || opt.getAttribute("aria-disabled") === "true") return;
    mpActivate(opt.closest("[data-asta-model]"), opt, null);
  });
  document.addEventListener("input", (e) => {
    const s = el(e)?.closest("[data-asta-model-search]");
    if (s) mpFilter(s.closest("[data-asta-model]"), s.value);
  });
  let mpBuf = "";
  let mpBufT = 0;
  document.addEventListener("keydown", (e) => {
    const t = el(e);
    const mp = t?.closest("[data-asta-model]");
    if (!mp) return;
    const trigger = t.closest("[data-asta-model-trigger]");
    const open = mp.querySelector("[data-asta-model-trigger]")?.getAttribute("aria-expanded") === "true";
    if (trigger && !open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        mpOpen(mp);
      } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (mp.querySelector("[data-asta-model-search]")) mpOpen(mp, e.key);
        else {
          clearTimeout(mpBufT);
          mpBuf += e.key.toLowerCase();
          mpBufT = setTimeout(() => (mpBuf = ""), 700);
          mpOpen(mp);
          mpActivate(mp, mpUsable(mp).find((o) => (o.dataset.label || "").toLowerCase().startsWith(mpBuf)) || null);
        }
      }
      return;
    }
    if (!open) return;
    const items = mpUsable(mp);
    const cur = items.indexOf(mp.querySelector('[role="option"][data-active]'));
    const inSearch = !!t.closest("[data-asta-model-search]");
    const go = (i) => {
      e.preventDefault();
      if (items.length) mpActivate(mp, items[(i + items.length) % items.length]);
    };
    if (e.key === "ArrowDown") go(cur + 1);
    else if (e.key === "ArrowUp") go(cur < 0 ? items.length - 1 : cur - 1);
    else if (e.key === "Home" && !inSearch) go(0);
    else if (e.key === "End" && !inSearch) go(items.length - 1);
    else if (e.key === "Enter") {
      e.preventDefault();
      mpPick(mp, items[cur]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      mpClose(mp, true);
    } else if (e.key === "Tab") mpClose(mp);
  });
  document.addEventListener("pointerdown", (e) => {
    const t = el(e);
    document.querySelectorAll('[data-asta-model-trigger][aria-expanded="true"]').forEach((tr) => {
      const mp = tr.closest("[data-asta-model]");
      if (!mp.contains(t)) mpClose(mp);
    });
    hideCards(t);
  });

  /* ---------- Citations ---------- */

  let cardT = 0;
  const cardOf = (pill) => pill.parentElement?.querySelector(".asta-citations-card");
  function showCard(pill) {
    const card = cardOf(pill);
    if (!card) return;
    pill.closest("[data-asta-cite]")?.querySelectorAll(".asta-citations-pill[aria-expanded='true']").forEach((p) => p !== pill && hideCard(p));
    const r = pill.getBoundingClientRect();
    card.toggleAttribute("data-below", r.top < 220);
    card.style.left = "";
    card.hidden = false;
    pill.setAttribute("aria-expanded", "true");
    pill.setAttribute("aria-describedby", idOf(card, "asta-cite"));
    // Keep the card inside the viewport with a 16px gutter.
    const c = card.getBoundingClientRect();
    const shift = c.left < 16 ? 16 - c.left : c.right > innerWidth - 16 ? innerWidth - 16 - c.right : 0;
    if (shift) card.style.left = `calc(50% + ${Math.round(shift)}px)`;
  }
  function hideCard(pill) {
    const card = cardOf(pill);
    if (card) card.hidden = true;
    pill.setAttribute("aria-expanded", "false");
    pill.removeAttribute("data-pinned");
  }
  function hideCards(except) {
    document.querySelectorAll(".asta-citations-pill[aria-expanded='true']").forEach((p) => !p.parentElement.contains(except) && hideCard(p));
  }
  function light(root, src, on) {
    root.querySelectorAll(`[data-src]`).forEach((n) => {
      const ids = (n.dataset.src || "").split(/\s*,\s*/);
      n.toggleAttribute("data-lit", on && ids.includes(src));
    });
  }
  document.addEventListener("pointerover", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-cite]");
    if (!root) return;
    const pill = t.closest(".asta-citations-pill");
    const cite = t.closest(".asta-citations-cite");
    const source = t.closest(".asta-citations-source[data-src]");
    if (cite) clearTimeout(cardT);
    if (pill && e.pointerType === "mouse" && pill.getAttribute("aria-expanded") !== "true") {
      cardT = setTimeout(() => showCard(pill), 90);
    }
    if (pill) light(root, pill.dataset.src, true);
    else if (source) light(root, source.dataset.src, true);
  });
  document.addEventListener("pointerout", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-cite]");
    if (!root) return;
    const to = e.relatedTarget instanceof Element ? e.relatedTarget : null;
    const cite = t.closest(".asta-citations-cite");
    if (cite && !cite.contains(to)) {
      clearTimeout(cardT);
      const pill = cite.querySelector(".asta-citations-pill");
      if (pill && !pill.hasAttribute("data-pinned") && e.pointerType === "mouse") cardT = setTimeout(() => hideCard(pill), 140);
    }
    if ((t.closest(".asta-citations-pill") || t.closest(".asta-citations-source")) && !to?.closest(".asta-citations-pill, .asta-citations-source")) light(root, "", false);
  });
  document.addEventListener("focusin", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-cite]");
    if (!root) return;
    const pill = t.closest(".asta-citations-pill");
    const source = t.closest(".asta-citations-source[data-src]");
    if (pill && pill.matches(":focus-visible")) showCard(pill);
    if (pill || source) light(root, (pill || source).dataset.src, true);
  });
  document.addEventListener("focusout", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-cite]");
    if (!root) return;
    const to = e.relatedTarget instanceof Element ? e.relatedTarget : null;
    const pill = t.closest(".asta-citations-pill");
    if (pill && !pill.hasAttribute("data-pinned") && !pill.parentElement.contains(to)) hideCard(pill);
    if (!to?.closest(".asta-citations-pill, .asta-citations-source")) light(root, "", false);
  });
  document.addEventListener("click", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-cite]");
    if (!root) return;
    const pill = t.closest(".asta-citations-pill");
    if (pill) {
      // Tap or click pins the card (touch has no hover); a second click closes it.
      if (pill.hasAttribute("data-pinned")) hideCard(pill);
      else {
        showCard(pill);
        pill.setAttribute("data-pinned", "");
      }
      return;
    }
    const toggle = t.closest("[data-asta-cite-toggle]");
    if (!toggle) return;
    const open = !root.hasAttribute("data-expanded");
    root.toggleAttribute("data-expanded", open);
    root.querySelectorAll("[data-extra]").forEach((n) => (n.hidden = !open));
    root.querySelectorAll("[data-asta-cite-toggle]").forEach((b) => {
      b.setAttribute("aria-expanded", String(open));
      const label = b.querySelector("[data-label]");
      const text = open ? b.dataset.less : b.dataset.more;
      if (label && text) label.textContent = text;
    });
    if (toggle.closest(".asta-citations-more")) root.querySelector(".asta-citations-toggle")?.focus();
  });

  /* ---------- Trace waterfall ---------- */

  const rowsOf = (tr) => [...tr.querySelectorAll('[role="row"][data-id]')];
  function descendants(tr, id) {
    const out = [];
    const walk = (pid) =>
      rowsOf(tr).forEach((r) => {
        if (r.dataset.parent !== pid) return;
        out.push(r);
        walk(r.dataset.id);
      });
    walk(id);
    return out;
  }
  function fold(tr, row, open) {
    if (!row.hasAttribute("aria-expanded")) return;
    row.setAttribute("aria-expanded", String(open));
    descendants(tr, row.dataset.id).forEach((r) => {
      // A row shows when every ancestor is expanded.
      let p = tr.querySelector(`[role="row"][data-id="${CSS.escape(r.dataset.parent || "")}"]`);
      let vis = true;
      while (p) {
        if (p.getAttribute("aria-expanded") === "false") vis = false;
        p = p.dataset.parent ? tr.querySelector(`[role="row"][data-id="${CSS.escape(p.dataset.parent)}"]`) : null;
      }
      r.hidden = !vis;
    });
  }
  function focusRow(tr, row) {
    if (!row) return;
    rowsOf(tr).forEach((r) => (r.tabIndex = r === row ? 0 : -1));
    row.focus({ preventScroll: false });
  }
  function select(tr, row) {
    rowsOf(tr).forEach((r) => r.setAttribute("aria-selected", String(r === row)));
    const detail = tr.querySelector("[data-asta-trace-detail]");
    const tpl = row && tr.querySelector(`template[data-asta-trace-for="${CSS.escape(row.dataset.id)}"]`);
    if (detail) {
      if (tpl) detail.replaceChildren(tpl.content.cloneNode(true));
      detail.hidden = !row || !tpl;
      if (!detail.hidden) {
        detail.removeAttribute("data-fresh");
        void detail.offsetWidth;
        detail.setAttribute("data-fresh", "");
      }
    }
    if (row) fire(tr, "asta:trace-select", { id: row.dataset.id });
  }
  document.addEventListener("click", (e) => {
    const t = el(e);
    const tr = t?.closest("[data-asta-trace]");
    if (!tr) return;
    if (t.closest("[data-asta-trace-close]")) {
      const sel = tr.querySelector('[role="row"][aria-selected="true"]');
      select(tr, null);
      focusRow(tr, sel);
      return;
    }
    const row = t.closest('[role="row"][data-id]');
    if (!row) return;
    if (t.closest("[data-asta-trace-toggle]")) {
      fold(tr, row, row.getAttribute("aria-expanded") === "false");
      focusRow(tr, row);
      return;
    }
    focusRow(tr, row);
    select(tr, row);
  });
  document.addEventListener("keydown", (e) => {
    const t = el(e);
    const tr = t?.closest("[data-asta-trace]");
    if (!tr) return;
    if (e.key === "Escape" && tr.querySelector("[data-asta-trace-detail]:not([hidden])")) {
      const sel = tr.querySelector('[role="row"][aria-selected="true"]');
      select(tr, null);
      focusRow(tr, sel);
      return;
    }
    const row = t.closest('[role="row"][data-id]');
    if (!row || t !== row) return;
    const vis = rowsOf(tr).filter((r) => !r.hidden);
    const i = vis.indexOf(row);
    const parent = row.dataset.parent && tr.querySelector(`[role="row"][data-id="${CSS.escape(row.dataset.parent)}"]`);
    const keys = {
      ArrowDown: () => focusRow(tr, vis[i + 1]),
      ArrowUp: () => focusRow(tr, vis[i - 1]),
      Home: () => focusRow(tr, vis[0]),
      End: () => focusRow(tr, vis[vis.length - 1]),
      ArrowRight: () => (row.getAttribute("aria-expanded") === "false" ? fold(tr, row, true) : row.hasAttribute("aria-expanded") && focusRow(tr, vis[i + 1])),
      ArrowLeft: () => (row.getAttribute("aria-expanded") === "true" ? fold(tr, row, false) : focusRow(tr, parent)),
      Enter: () => select(tr, row),
      " ": () => select(tr, row),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  });

  /* ---------- Prompt composer ---------- */

  const PERSON =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5"/></svg>';
  const TRIG = /(?:^|\s)([@/])([^\s@/]{0,30})$/;
  const trig = new WeakMap();
  const dismissed = new WeakMap();
  const parts = (pc) => pc.querySelector("[data-asta-prompt-field]");
  const openMenu = (pc) => pc.querySelector("[data-asta-prompt-menu]:not([hidden])");
  const caretNode = () => {
    const sel = getSelection();
    return sel && sel.rangeCount && sel.isCollapsed ? sel.getRangeAt(0) : null;
  };
  function read(field) {
    let text = "";
    const refs = [];
    const walk = (n) =>
      n.childNodes.forEach((c) => {
        if (c.nodeType === 3) text += c.nodeValue;
        else if (c.nodeType === 1 && c.dataset.token) {
          text += `${c.dataset.token}${c.dataset.label}`;
          refs.push({ type: c.dataset.token === "/" ? "command" : "mention", id: c.dataset.id, label: c.dataset.label });
        } else if (c.nodeName === "BR") text += "\n";
        else if (c.nodeType === 1) {
          if (c.nodeName === "DIV" && text && !text.endsWith("\n")) text += "\n";
          walk(c);
        }
      });
    walk(field);
    return { text: text.replace(/ /g, " "), refs };
  }
  function syncPrompt(pc) {
    const field = parts(pc);
    if (!field) return;
    const { text, refs } = read(field);
    const value = pc.querySelector("[data-asta-prompt-value]");
    if (value) value.value = text.trim();
    const refInput = pc.querySelector("[data-asta-prompt-refs]");
    if (refInput) refInput.value = JSON.stringify(refs);
    const files = pc.querySelector("[data-asta-prompt-input]")?.files?.length || 0;
    const filled = !!text.trim() || refs.length > 0;
    pc.toggleAttribute("data-filled", filled || field.textContent.length > 0 || refs.length > 0);
    const send = pc.querySelector(".asta-prompt-send");
    if (send) send.disabled = (!filled && !files) || pc.querySelector("[data-asta-prompt-field]").getAttribute("aria-disabled") === "true";
  }
  function closeMenu(pc) {
    pc.querySelectorAll("[data-asta-prompt-menu]").forEach((m) => (m.hidden = true));
    const field = parts(pc);
    field?.setAttribute("aria-expanded", "false");
    field?.removeAttribute("aria-activedescendant");
    trig.delete(pc);
  }
  function menuItems(menu) {
    return [...menu.querySelectorAll('[role="option"]')].filter((o) => !o.hidden);
  }
  function setActive(pc, menu, opt) {
    menu.querySelectorAll('[role="option"]').forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
    const field = parts(pc);
    if (opt) {
      field.setAttribute("aria-activedescendant", idOf(opt, "asta-pc"));
      opt.scrollIntoView({ block: "nearest" });
    } else field.removeAttribute("aria-activedescendant");
  }
  function detect(pc) {
    const r = caretNode();
    const field = parts(pc);
    if (!r || !field.contains(r.startContainer) || r.startContainer.nodeType !== 3) return closeMenu(pc);
    const before = r.startContainer.nodeValue.slice(0, r.startOffset);
    const m = TRIG.exec(before);
    const menu = m && pc.querySelector(`[data-asta-prompt-menu="${m[1]}"]`);
    if (!m || !menu) return closeMenu(pc);
    const start = r.startOffset - m[2].length - 1;
    const key = `${m[1]}@${start}`;
    if (dismissed.get(pc) === key) return;
    trig.set(pc, { node: r.startContainer, start, end: r.startOffset });
    pc.querySelectorAll("[data-asta-prompt-menu]").forEach((x) => x !== menu && (x.hidden = true));
    const q = m[2].toLowerCase();
    menu.querySelectorAll('[role="option"]').forEach((o) => (o.hidden = !(o.dataset.label || "").toLowerCase().includes(q)));
    // A group label shows only while one of its options does.
    menu.querySelectorAll(".asta-prompt-group").forEach((g) => {
      let n = g.nextElementSibling;
      let any = false;
      while (n && !n.classList.contains("asta-prompt-group")) {
        if (n.getAttribute("role") === "option" && !n.hidden) any = true;
        n = n.nextElementSibling;
      }
      g.hidden = !any;
    });
    const empty = menu.querySelector(".asta-prompt-empty");
    if (empty) empty.hidden = menuItems(menu).length > 0;
    const wasHidden = menu.hidden;
    menu.hidden = false;
    // Sit the menu near the trigger, inside the composer.
    const rr = document.createRange();
    rr.setStart(r.startContainer, start);
    rr.setEnd(r.startContainer, start + 1);
    const box = pc.getBoundingClientRect();
    const x = Math.max(0, Math.min(rr.getBoundingClientRect().left - box.left - 12, box.width - menu.offsetWidth));
    menu.style.left = `${Math.round(x)}px`;
    field.setAttribute("aria-expanded", "true");
    field.setAttribute("aria-controls", idOf(menu, "asta-pc-menu"));
    const cur = menu.querySelector('[role="option"][aria-selected="true"]:not([hidden])');
    setActive(pc, menu, wasHidden || !cur ? menuItems(menu)[0] || null : cur);
  }
  function insert(pc, opt) {
    const at = trig.get(pc);
    const field = parts(pc);
    const menu = opt.closest("[data-asta-prompt-menu]");
    if (!at || !field.contains(at.node)) return;
    const range = document.createRange();
    range.setStart(at.node, at.start);
    range.setEnd(at.node, Math.min(at.end, at.node.nodeValue.length));
    range.deleteContents();
    const token = menu.getAttribute("data-asta-prompt-menu");
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.className = `asta-prompt-chip${token === "/" ? " asta-prompt-chip-command" : ""}`;
    chip.dataset.token = token;
    chip.dataset.id = opt.dataset.id || opt.dataset.label;
    chip.dataset.label = opt.dataset.label || "";
    chip.textContent = chip.dataset.label;
    const glyph = opt.querySelector(".asta-prompt-option-icon svg");
    if (glyph) chip.prepend(glyph.cloneNode(true));
    else if (opt.dataset.type === "person") chip.insertAdjacentHTML("afterbegin", PERSON);
    const space = document.createTextNode(" ");
    range.insertNode(space);
    range.insertNode(chip);
    const sel = getSelection();
    const after = document.createRange();
    after.setStart(space, 1);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    closeMenu(pc);
    syncPrompt(pc);
    field.focus();
  }
  function nextToken(dir) {
    const r = caretNode();
    if (!r) return null;
    const { startContainer: n, startOffset: o } = r;
    if (n.nodeType === 3) {
      if (dir < 0 && o === 0) return n.previousSibling?.dataset?.token ? n.previousSibling : null;
      if (dir > 0 && o === n.nodeValue.length) return n.nextSibling?.dataset?.token ? n.nextSibling : null;
      return null;
    }
    const c = n.childNodes[dir < 0 ? o - 1 : o];
    return c?.dataset?.token ? c : null;
  }
  function fmt(b) {
    return b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  }
  function note(pc, msg, error) {
    const n = pc.querySelector("[data-asta-prompt-note]");
    if (!n) return;
    if (!n.dataset.idle) n.dataset.idle = n.innerHTML;
    n.toggleAttribute("data-error", !!error);
    n.setAttribute("role", error ? "alert" : "status");
    if (msg) n.textContent = msg;
    else n.innerHTML = n.dataset.idle;
  }
  function renderFiles(pc) {
    const input = pc.querySelector("[data-asta-prompt-input]");
    const list = pc.querySelector("[data-asta-prompt-files]");
    if (!input || !list) return;
    list.replaceChildren(
      ...[...input.files].map((f, i) => {
        const li = document.createElement("li");
        li.className = "asta-prompt-file";
        li.innerHTML =
          '<span class="asta-prompt-file-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 1.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5L9 1.5Z"/><path d="M9 1.5V5h3.5"/></svg></span><span class="asta-prompt-file-name"></span><span class="asta-prompt-file-size"></span><button type="button" class="asta-prompt-file-remove"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>';
        li.querySelector(".asta-prompt-file-name").textContent = f.name;
        li.querySelector(".asta-prompt-file-size").textContent = fmt(f.size);
        const rm = li.querySelector("button");
        rm.setAttribute("aria-label", `Remove ${f.name}`);
        rm.dataset.astaPromptRemove = String(i);
        return li;
      }),
    );
    list.hidden = !input.files.length;
    syncPrompt(pc);
  }
  function addFiles(pc, files) {
    const input = pc.querySelector("[data-asta-prompt-input]");
    if (!input || !files.length || typeof DataTransfer === "undefined") return;
    const max = Number(pc.getAttribute("data-max-size")) || 20 * 1048576;
    const dt = new DataTransfer();
    [...input.files].forEach((f) => dt.items.add(f));
    let err = "";
    [...files].forEach((f) => (f.size > max ? (err = `${f.name} is ${fmt(f.size)}. Attach files under ${fmt(max)}.`) : dt.items.add(f)));
    input.files = dt.files;
    note(pc, err, !!err);
    renderFiles(pc);
  }
  function running(pc, on) {
    pc.toggleAttribute("data-running", on);
    const field = parts(pc);
    if (on) note(pc, pc.getAttribute("data-running-text") || "Astabyte is working. Press Esc or Stop to end the run.");
    else note(pc, "");
    field?.setAttribute("aria-busy", String(on));
  }
  function clear(pc) {
    const field = parts(pc);
    if (field) field.replaceChildren();
    const input = pc.querySelector("[data-asta-prompt-input]");
    if (input) input.value = "";
    renderFiles(pc);
    syncPrompt(pc);
  }
  function stop(pc) {
    const form = pc.querySelector("form");
    if (window.htmx && form) window.htmx.trigger(form, "htmx:abort");
    running(pc, false);
    fire(pc, "asta:prompt-stop", {});
    parts(pc)?.focus();
  }

  document.addEventListener("input", (e) => {
    const t = el(e);
    const pc = t?.closest("[data-asta-prompt]");
    if (!pc) return;
    if (t.closest("[data-asta-prompt-field]")) {
      dismissed.delete(pc);
      syncPrompt(pc);
      detect(pc);
    }
  });
  document.addEventListener("change", (e) => {
    const t = el(e);
    const pc = t?.closest("[data-asta-prompt]");
    if (pc && t.matches("[data-asta-prompt-input]")) {
      note(pc, "");
      renderFiles(pc);
    }
  });
  document.addEventListener("keydown", (e) => {
    const t = el(e);
    const pc = t?.closest("[data-asta-prompt]");
    if (!pc) return;
    if (e.key === "Escape" && pc.hasAttribute("data-running") && !openMenu(pc)) {
      e.preventDefault();
      stop(pc);
      return;
    }
    if (!t.closest("[data-asta-prompt-field]")) return;
    const menu = openMenu(pc);
    if (menu) {
      const items = menuItems(menu);
      const i = items.findIndex((o) => o.getAttribute("aria-selected") === "true");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length) setActive(pc, menu, items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && !e.isComposing) {
        if (items[i]) {
          e.preventDefault();
          insert(pc, items[i]);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        const at = trig.get(pc);
        if (at) dismissed.set(pc, `${menu.getAttribute("data-asta-prompt-menu")}@${at.start}`);
        closeMenu(pc);
        return;
      }
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      const tok = nextToken(e.key === "Backspace" ? -1 : 1);
      if (tok) {
        e.preventDefault();
        tok.remove();
        syncPrompt(pc);
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (!pc.hasAttribute("data-running")) pc.querySelector("form")?.requestSubmit();
    }
  });
  document.addEventListener("pointerdown", (e) => {
    const opt = el(e)?.closest("[data-asta-prompt-menu] [role='option']");
    if (opt) e.preventDefault(); // keep the caret in the field
  });
  document.addEventListener("click", (e) => {
    const t = el(e);
    const pc = t?.closest("[data-asta-prompt]");
    if (!pc) {
      document.querySelectorAll("[data-asta-prompt]").forEach((p) => openMenu(p) && closeMenu(p));
      return;
    }
    const opt = t.closest("[data-asta-prompt-menu] [role='option']");
    if (opt) return insert(pc, opt);
    const rm = t.closest("[data-asta-prompt-remove]");
    if (rm) {
      const input = pc.querySelector("[data-asta-prompt-input]");
      const dt = new DataTransfer();
      [...input.files].forEach((f, i) => i !== Number(rm.dataset.astaPromptRemove) && dt.items.add(f));
      input.files = dt.files;
      renderFiles(pc);
      parts(pc)?.focus();
      return;
    }
    if (t.closest("[data-asta-prompt-stop]")) return stop(pc);
    if (!t.closest("[data-asta-prompt-menu]") && !t.closest("[data-asta-prompt-field]")) closeMenu(pc);
  });
  document.addEventListener("paste", (e) => {
    const field = el(e)?.closest("[data-asta-prompt-field]");
    if (!field) return;
    const pc = field.closest("[data-asta-prompt]");
    const files = e.clipboardData?.files;
    e.preventDefault();
    if (files?.length) return addFiles(pc, files);
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!document.execCommand("insertText", false, text)) {
      const r = caretNode();
      r?.insertNode(document.createTextNode(text));
      syncPrompt(pc);
    }
  });
  ["dragover", "dragleave", "drop"].forEach((type) =>
    document.addEventListener(type, (e) => {
      const box = el(e)?.closest("[data-asta-prompt] .asta-prompt-box");
      if (!box || !e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      box.toggleAttribute("data-drag", type === "dragover");
      if (type === "drop") addFiles(box.closest("[data-asta-prompt]"), e.dataTransfer.files);
    }),
  );
  document.addEventListener("submit", (e) => {
    const pc = el(e)?.closest("[data-asta-prompt]");
    if (!pc) return;
    syncPrompt(pc);
    const send = pc.querySelector(".asta-prompt-send");
    if (send?.disabled || pc.hasAttribute("data-running")) {
      e.preventDefault();
      return;
    }
    const form = e.target;
    const { text, refs } = read(parts(pc));
    const files = [...(pc.querySelector("[data-asta-prompt-input]")?.files || [])];
    fire(pc, "asta:prompt-send", { text: text.trim(), refs, files });
    // Without an action or hx-* attribute there is nowhere to post: the event is the whole contract.
    const htmxForm = [...form.attributes].some((a) => /^(hx|data-hx)-(post|get|put|patch)$/.test(a.name));
    if (!form.getAttribute("action") && !htmxForm) {
      e.preventDefault();
      clear(pc);
    }
  });
  document.addEventListener("htmx:beforeSend", (e) => {
    const pc = el(e)?.closest("[data-asta-prompt]");
    if (!pc) return;
    running(pc, true);
    queueMicrotask(() => clear(pc));
  });
  document.addEventListener("htmx:afterRequest", (e) => {
    const pc = el(e)?.closest("[data-asta-prompt]");
    if (pc) running(pc, false);
  });

  /* ---------- Boot ---------- */

  const boot = () => scan();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("htmx:afterSettle", (e) => scan(e.target instanceof Element ? e.target : document));
})();
