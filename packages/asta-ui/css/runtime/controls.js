/* Controls: scrub input, API keys.
 * Event delegation on document, so markup swapped in by htmx works without re-init.
 *   Scrub     [data-asta-scrub] (data-min, data-max, data-step, data-precision, data-unit): drag the
 *             [data-asta-scrub-handle] to scrub (Shift ×10, Alt ×0.1), or type numbers, units and sums
 *             ("1.5rem", "24*2", "+8") and press Enter. Arrows step. Sets data-scrubbing, data-mod, data-limit and
 *             aria-invalid, keeps a hidden input in sync and fires "asta:scrub" with detail.value on every change
 *             and "change" on the hidden input when a drag or edit ends
 *   API keys  [data-asta-keys] (data-undo-ms): [data-asta-keys-create|cancel] open and close the form, which is
 *             checked on submit (a name, one scope at least). Without hx-post or action it makes a demo key and
 *             fires "asta:key-create". [data-asta-keys-dismiss] closes the one-time secret (warns once if it wasn't
 *             copied). [data-asta-keys-revoke|keep|confirm|undo] ask, revoke with an undo window, then fire
 *             "asta:key-revoke" with detail.id and remove the row
 */
(() => {
  if (window.astaControls) return;
  window.astaControls = true;
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const near = (e, sel) => el(e)?.closest(sel) ?? null;
  const fire = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  /* ---------- Scrub input: the parser ---------- */

  const UNITS = { px: ["len", 1], rem: ["len", 16], em: ["len", 16], pt: ["len", 4 / 3], deg: ["ang", 1], "°": ["ang", 1], rad: ["ang", 180 / Math.PI], turn: ["ang", 360], "%": ["pct", 1], ms: ["time", 1], s: ["time", 1000] };

  function tokenize(src, unit) {
    const out = [];
    const base = unit ? UNITS[unit] : undefined;
    const re = /\s*(?:(\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-z%°]*)|([-+*/×÷()]))\s*/giy;
    let i = 0;
    while (i < src.length) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (!m) return null;
      i = re.lastIndex;
      if (m[3]) {
        out.push({ op: m[3] === "×" ? "*" : m[3] === "÷" ? "/" : m[3] });
        continue;
      }
      let v = Number(m[1]);
      const u = m[2].toLowerCase();
      if (u && u !== unit) {
        const typed = UNITS[u];
        if (!typed || !base || typed[0] !== base[0]) return null;
        v = (v * typed[1]) / base[1];
      }
      out.push({ num: v });
    }
    return out;
  }

  // Numbers with units, + − × ÷ and brackets, without eval. A leading +, * or / works on the current value.
  function parse(text, current, unit) {
    let src = text.trim().replace(/,/g, ".").replace(/−/g, "-");
    if (!src || src.length > 64) return null;
    let rel = null;
    if (/^[+*/×÷]/.test(src)) {
      rel = src[0] === "×" ? "*" : src[0] === "÷" ? "/" : src[0];
      src = src.slice(1);
    }
    const tk = tokenize(src, unit);
    if (!tk?.length) return null;
    let p = 0;
    const isOp = (...ops) => tk[p] && ops.includes(tk[p].op);
    const factor = () => {
      const t = tk[p++];
      if (!t) return NaN;
      if (t.num !== undefined) return t.num;
      if (t.op === "-") return -factor();
      if (t.op === "+") return factor();
      if (t.op === "(") {
        const v = expr();
        return tk[p++]?.op === ")" ? v : NaN;
      }
      return NaN;
    };
    const term = () => {
      let v = factor();
      while (isOp("*", "/")) v = tk[p++].op === "*" ? v * factor() : v / factor();
      return v;
    };
    const expr = () => {
      let v = term();
      while (isOp("+", "-")) v = tk[p++].op === "+" ? v + term() : v - term();
      return v;
    };
    let v = expr();
    if (p !== tk.length || !Number.isFinite(v)) return null;
    if (rel === "+") v = current + v;
    else if (rel === "*") v = current * v;
    else if (rel === "/") v = v === 0 ? NaN : current / v;
    return Number.isFinite(v) ? v : null;
  }
  window.astaParseScrub = parse;

  /* ---------- Scrub input: the field ---------- */

  const num = (s, d) => (s == null || s === "" || Number.isNaN(Number(s)) ? d : Number(s));
  function cfg(root) {
    const d = root.dataset;
    return { min: num(d.min, -Infinity), max: num(d.max, Infinity), step: num(d.step, 1), precision: num(d.precision, 2), unit: d.unit || undefined };
  }
  const round = (v, p) => Math.round(v * 10 ** p) / 10 ** p;
  const fmt = (v, p) => String(round(v, p)).replace(/^-0$/, "0");
  const field = (root) => root.querySelector("input:not([type=hidden])");
  function valueOf(root) {
    if (typeof root._v !== "number") {
      const c = cfg(root);
      root._v = parse(field(root)?.value ?? "0", 0, c.unit) ?? 0;
    }
    return root._v;
  }

  function flagLimit(root, which) {
    const c = cfg(root);
    root.setAttribute("data-limit", which);
    clearTimeout(root._lt);
    root._lt = setTimeout(() => root.removeAttribute("data-limit"), 420);
    const status = root.querySelector("[data-asta-scrub-status]");
    if (status) status.textContent = `${which === "max" ? "Maximum" : "Minimum"} is ${fmt(which === "max" ? c.max : c.min, c.precision)}${c.unit || ""}`;
  }

  // Clamps, writes the field and the hidden input, and flags the edge when a value had to be held back.
  function set(root, want) {
    const c = cfg(root);
    const input = field(root);
    let v = round(want, c.precision);
    if (v > c.max) {
      v = c.max;
      flagLimit(root, "max");
    } else if (v < c.min) {
      v = c.min;
      flagLimit(root, "min");
    }
    const changed = v !== root._v;
    root._v = v;
    if (input) {
      input.value = fmt(v, c.precision);
      input.setAttribute("aria-valuenow", String(v));
      input.setAttribute("aria-valuetext", `${fmt(v, c.precision)}${c.unit ? ` ${c.unit}` : ""}`);
      input.removeAttribute("aria-invalid");
    }
    const hidden = root.querySelector("input[type=hidden]");
    if (hidden) hidden.value = String(v);
    if (changed) fire(root, "asta:scrub", { value: v });
    return v;
  }
  const settle = (root) => root.querySelector("input[type=hidden]")?.dispatchEvent(new Event("change", { bubbles: true }));

  function commit(root, keepFocus) {
    const input = field(root);
    if (!input) return;
    const c = cfg(root);
    const cur = valueOf(root);
    const v = parse(input.value, cur, c.unit);
    if (v === null) {
      if (keepFocus) {
        input.setAttribute("aria-invalid", "true");
        // Keep the tip inside the panel: align it right when it would run past the edge.
        const box = root.closest("[role=group],section,form") ?? document.body;
        root.toggleAttribute("data-tip-end", root.getBoundingClientRect().left + 220 > box.getBoundingClientRect().right);
        return;
      }
      input.value = fmt(cur, c.precision);
      input.removeAttribute("aria-invalid");
      const status = root.querySelector("[data-asta-scrub-status]");
      if (status) status.textContent = `Kept ${fmt(cur, c.precision)}${c.unit || ""}`;
      return;
    }
    set(root, v);
    settle(root);
    if (keepFocus) input.select();
  }

  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    const handle = near(e, "[data-asta-scrub-handle]");
    const root = handle?.closest("[data-asta-scrub]");
    if (!root || field(root)?.disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {}
    drag = { root, handle, id: e.pointerId, x0: e.clientX, x: e.clientX, raw: valueOf(root), moved: false };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { root } = drag;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.x0) < 3) return;
      drag.moved = true;
      root.setAttribute("data-scrubbing", "");
      document.documentElement.style.cursor = "ew-resize";
    }
    const c = cfg(root);
    const f = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const badge = root.querySelector(".asta-scrub-badge");
    if (f === 1) root.removeAttribute("data-mod");
    else {
      root.setAttribute("data-mod", String(f));
      if (badge) badge.textContent = `×${f}`;
    }
    // Half a step per pixel, snapped to the step so a drag never leaves 540.5 behind.
    const grid = c.step * f;
    const want = drag.raw + ((e.clientX - drag.x) / 2) * grid;
    drag.x = e.clientX;
    drag.raw = Math.min(c.max, Math.max(c.min, want));
    if (want > c.max) flagLimit(root, "max");
    else if (want < c.min) flagLimit(root, "min");
    set(root, Math.round(drag.raw / grid) * grid);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { root, moved } = drag;
    drag = null;
    root.removeAttribute("data-scrubbing");
    root.removeAttribute("data-mod");
    document.documentElement.style.cursor = "";
    if (moved) settle(root);
    else {
      const input = field(root);
      input?.focus();
      input?.select();
    }
  }
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLInputElement && e.target.matches(".asta-api-keys-secret > input")) return e.target.select();
    const root = near(e, "[data-asta-scrub]");
    if (root && e.target === field(root)) {
      valueOf(root);
      e.target.select();
    }
  });
  document.addEventListener("focusout", (e) => {
    const root = near(e, "[data-asta-scrub]");
    if (root && e.target === field(root)) commit(root, false);
  });
  document.addEventListener("input", (e) => {
    const root = near(e, "[data-asta-scrub]");
    if (root && e.target === field(root)) e.target.removeAttribute("aria-invalid");
  });

  /* ---------- API keys ---------- */

  const keysRoot = (e) => near(e, "[data-asta-keys]");
  const focusSoon = (node) => node && requestAnimationFrame(() => node.focus());
  const formOf = (root) => root.querySelector("[data-asta-keys-form]");
  const createBtn = (root) => root.querySelector("[data-asta-keys-create]");

  function openForm(root) {
    const form = formOf(root);
    if (!form) return;
    form.hidden = false;
    createBtn(root)?.setAttribute("aria-expanded", "true");
    focusSoon(form.querySelector("input[name=name]"));
  }
  function closeForm(root, focus = true) {
    const form = formOf(root);
    if (!form) return;
    form.hidden = true;
    form.reset();
    form.querySelectorAll("[aria-invalid]").forEach((n) => n.removeAttribute("aria-invalid"));
    form.querySelectorAll(".asta-api-keys-msg").forEach((m) => showMsg(m, null));
    form.querySelector("[data-asta-keys-alert]")?.setAttribute("hidden", "");
    createBtn(root)?.setAttribute("aria-expanded", "false");
    if (focus) focusSoon(createBtn(root));
  }
  // A hint line keeps its hint in data-hint and its error in data-error-text.
  function showMsg(msg, on) {
    const text = msg.querySelector("span:last-child") ?? msg;
    msg.toggleAttribute("data-error", !!on);
    text.textContent = on ? msg.dataset.errorText : msg.dataset.hint;
  }
  function check(form) {
    const name = form.querySelector("input[name=name]");
    const scopes = [...form.querySelectorAll("input[name=scopes]")];
    const noName = !name?.value.trim();
    const noScope = scopes.length > 0 && !scopes.some((s) => s.checked);
    if (name && noName) name.setAttribute("aria-invalid", "true");
    else name?.removeAttribute("aria-invalid");
    const nameMsg = name && document.getElementById(name.getAttribute("aria-describedby"));
    if (nameMsg) showMsg(nameMsg, noName);
    const fs = form.querySelector(".asta-api-keys-scopes");
    const scopeMsg = fs && document.getElementById(fs.getAttribute("aria-describedby"));
    if (scopeMsg) showMsg(scopeMsg, noScope);
    if (noName) name.focus();
    else if (noScope) scopes[0].focus();
    return !noName && !noScope;
  }

  const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
  const tail = () => Array.from({ length: 24 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

  // Demo create: fill the reveal row with a key that is clearly marked demo and put it on top.
  function demoCreate(root, form) {
    const list = root.querySelector(".asta-api-keys-list");
    const tpl = root.querySelector("template[data-asta-keys-reveal]");
    if (!list || !tpl) return;
    const name = form.querySelector("input[name=name]").value.trim();
    const scopes = [...form.querySelectorAll("input[name=scopes]:checked")].map((s) => s.value);
    const secret = `ak_live_demo_${tail()}`;
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.name = name;
    li.dataset.scopes = scopes.join(",");
    li.dataset.secret = secret;
    li.querySelectorAll("[data-slot=name]").forEach((n) => (n.textContent = name));
    const input = li.querySelector("input[readonly]");
    if (input) {
      input.value = secret;
      input.setAttribute("aria-label", `Secret for ${name}`);
    }
    li.querySelector("[data-asta-copy]")?.setAttribute("data-asta-copy", secret);
    list.prepend(li);
    closeForm(root, false);
    fire(root, "asta:key-create", { name, scopes, expires: form.querySelector("select")?.value ?? null });
    focusSoon(li.querySelector("[data-asta-copy]"));
  }

  // After the secret is dismissed, the key joins the list masked, built from the row template.
  function rowFromReveal(root, reveal) {
    const tpl = root.querySelector("template[data-asta-keys-row]");
    if (!tpl || !reveal.dataset.secret) return null;
    const li = tpl.content.firstElementChild.cloneNode(true);
    const name = reveal.dataset.name;
    const masked = `ak_live_…${reveal.dataset.secret.slice(-4)}`;
    const scopes = (reveal.dataset.scopes || "").split(",").filter(Boolean);
    li.dataset.id = `k${Date.now().toString(36)}`;
    li.dataset.name = name;
    li.dataset.key = masked;
    li.querySelectorAll("[data-slot=name]").forEach((n) => (n.textContent = name));
    li.querySelectorAll("[data-slot=key]").forEach((n) => (n.textContent = masked));
    li.querySelectorAll("[data-slot=created]").forEach((n) => (n.textContent = `Created ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`));
    const chips = li.querySelector("[data-slot=scopes]");
    if (chips) {
      chips.textContent = "";
      const code = document.createElement("code");
      code.textContent = scopes[0] ?? "";
      chips.append(code);
      if (scopes.length > 1) {
        const more = document.createElement("span");
        more.title = scopes.slice(1).join(", ");
        more.textContent = `+${scopes.length - 1}`;
        chips.append(more);
      }
    }
    li.querySelector("[data-asta-keys-revoke]")?.setAttribute("aria-label", `Revoke ${name}`);
    return li;
  }

  function dismiss(root, reveal) {
    const note = reveal.querySelector(".asta-api-keys-note");
    if (!reveal.hasAttribute("data-copied") && note && !note.hasAttribute("data-warn")) {
      note.setAttribute("data-warn", "");
      return;
    }
    const row = rowFromReveal(root, reveal);
    if (row) reveal.replaceWith(row);
    else reveal.remove();
    fire(root, "asta:key-dismiss");
    focusSoon(root.querySelector("[data-asta-keys-heading]") ?? createBtn(root));
  }

  const timers = new WeakMap();
  function askRevoke(row, open) {
    const confirm = row.querySelector(".asta-api-keys-confirm");
    if (!confirm) return;
    confirm.hidden = !open;
    const btn = row.querySelector("[data-asta-keys-revoke]");
    btn?.setAttribute("aria-expanded", String(open));
    focusSoon(open ? confirm.querySelector("[data-asta-keys-keep]") : btn);
  }
  function revoke(root, row) {
    const ms = Number(root.dataset.undoMs) || 8000;
    row.querySelector(".asta-api-keys-confirm")?.setAttribute("hidden", "");
    row.querySelector("[data-asta-keys-revoke]")?.setAttribute("aria-expanded", "false");
    row.style.setProperty("--asta-undo", `${ms}ms`);
    row.setAttribute("data-revoked", "");
    focusSoon(row.querySelector("[data-asta-keys-undo]"));
    timers.set(
      row,
      setTimeout(() => {
        timers.delete(row);
        const hadFocus = row.contains(document.activeElement);
        const next = row.nextElementSibling ?? row.previousElementSibling;
        fire(row, "asta:key-revoke", { id: row.dataset.id });
        row.remove();
        if (hadFocus) focusSoon(next?.querySelector("[data-asta-keys-revoke],[data-asta-copy]") ?? createBtn(root));
      }, ms),
    );
  }
  function undo(row) {
    clearTimeout(timers.get(row));
    timers.delete(row);
    row.removeAttribute("data-revoked");
    fire(row, "asta:key-restore", { id: row.dataset.id });
    focusSoon(row.querySelector("[data-asta-keys-revoke]"));
  }

  document.addEventListener("click", (e) => {
    const root = keysRoot(e);
    if (!root) return;
    const row = near(e, ".asta-api-keys-row");
    if (near(e, "[data-asta-keys-create]")) {
      const form = formOf(root);
      if (form && !form.hidden) form.querySelector("input[name=name]")?.focus();
      else openForm(root);
    } else if (near(e, "[data-asta-keys-cancel]")) closeForm(root);
    else if (near(e, "[data-asta-keys-dismiss]")) dismiss(root, near(e, ".asta-api-keys-reveal"));
    else if (row && near(e, "[data-asta-keys-revoke]")) askRevoke(row, row.querySelector(".asta-api-keys-confirm")?.hidden ?? false);
    else if (row && near(e, "[data-asta-keys-keep]")) askRevoke(row, false);
    else if (row && near(e, "[data-asta-keys-confirm]")) revoke(root, row);
    else if (row && near(e, "[data-asta-keys-undo]")) undo(row);
  });

  // A copy inside the reveal row counts as saved.
  document.addEventListener("asta:copy", (e) => {
    const reveal = near(e, ".asta-api-keys-reveal");
    if (!reveal) return;
    reveal.setAttribute("data-copied", "");
    reveal.querySelector(".asta-api-keys-note")?.removeAttribute("data-warn");
  });

  // Capture phase, so an invalid form never reaches htmx or the browser.
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target instanceof HTMLFormElement && e.target.matches("[data-asta-keys-form]") ? e.target : null;
      const root = form?.closest("[data-asta-keys]");
      if (!root) return;
      if (!check(form)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const remote = form.hasAttribute("action") || [...form.attributes].some((a) => /^(hx|data-hx)-(post|put)$/.test(a.name));
      if (!remote) {
        e.preventDefault();
        demoCreate(root, form);
      }
    },
    true,
  );

  document.addEventListener("keydown", (e) => {
    const root = keysRoot(e);
    if (root) {
      if (e.key !== "Escape") return;
      if (near(e, "[data-asta-keys-form]")) {
        e.preventDefault();
        closeForm(root);
      } else if (near(e, ".asta-api-keys-confirm")) {
        e.preventDefault();
        askRevoke(near(e, ".asta-api-keys-row"), false);
      }
      return;
    }
    const sroot = near(e, "[data-asta-scrub]");
    if (!sroot || e.target !== field(sroot)) return;
    const c = cfg(sroot);
    const input = e.target;
    if (e.key === "Enter") {
      e.preventDefault();
      commit(sroot, true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      input.value = fmt(valueOf(sroot), c.precision);
      input.removeAttribute("aria-invalid");
      input.select();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const page = e.key.startsWith("Page");
      const f = page ? 10 : e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const dir = e.key === "ArrowUp" || e.key === "PageUp" ? 1 : -1;
      const typed = parse(input.value, valueOf(sroot), c.unit);
      set(sroot, (typed ?? valueOf(sroot)) + dir * c.step * f);
      settle(sroot);
      input.select();
    }
  });
})();
