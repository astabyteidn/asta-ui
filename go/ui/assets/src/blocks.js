/* Blocks: sign-in, onboarding, AI chat, checkout, properties and settings panels, team members.
 * Event delegation on document, so blocks swapped in by htmx work without re-init.
 *   Sign-in     [data-asta-reveal] shows and hides the password next to it
 *   Onboarding  [data-asta-onboarding-toggle] opens one step, [data-asta-onboarding-review] shows the list again
 *   AI chat     [data-asta-chat]: Enter sends, Shift+Enter adds a line, the person's message shows at once,
 *               the list follows new messages, [data-asta-chat-copy], [data-asta-chat-stream="url"] (SSE)
 *   Checkout    [data-asta-checkout-format], [data-asta-checkout-step], "asta:recalc" on the summary, rolling amounts
 *   Properties  [data-asta-prop-scrub] drag to scrub (Shift ×10, Alt ×0.1), [data-asta-prop-color] swatch + hex
 *   Settings    [data-asta-settings]: data-dirty while fields differ from the loaded values, data-saved after a save
 *   Team        Undo rows ([data-asta-team-removed]) fade out when their countdown ends
 */
(() => {
  if (window.astaBlocks) return;
  window.astaBlocks = true;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.16,1,.3,1)";
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const shake = (node) => {
    if (!node || reduce()) return;
    node.animate(
      [{ transform: "none" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 450, easing: EASE },
    );
  };

  /* ---------- Sign-in: reveal password ---------- */

  document.addEventListener("click", (e) => {
    const btn = el(e)?.closest("[data-asta-reveal]");
    if (!btn) return;
    const input = btn.closest("label")?.querySelector("input");
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  /* ---------- Onboarding ---------- */

  document.addEventListener("click", (e) => {
    const t = el(e);
    const toggle = t?.closest("[data-asta-onboarding-toggle]");
    if (toggle) {
      const root = toggle.closest("[data-asta-onboarding]");
      const open = toggle.getAttribute("aria-expanded") !== "true";
      for (const b of root.querySelectorAll("[data-asta-onboarding-toggle]")) {
        const on = open && b === toggle;
        b.setAttribute("aria-expanded", String(on));
        const panel = document.getElementById(b.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
        b.closest("[data-asta-onboarding-step]")?.classList.toggle("bg-paper-2", on);
      }
      return;
    }
    const review = t?.closest("[data-asta-onboarding-review]");
    if (review) {
      const root = review.closest("[data-asta-onboarding]");
      const done = root.querySelector("[data-asta-onboarding-done]");
      if (done) done.hidden = true;
      const list = root.querySelector("[data-asta-onboarding-list]");
      if (list) {
        list.hidden = false;
        list.querySelector("[data-asta-onboarding-toggle]")?.focus();
      }
    }
  });

  /* ---------- AI chat ---------- */

  const chatOf = (n) => n?.closest?.("[data-asta-chat]");
  const chatStatus = (chat, text) => {
    const s = chat?.querySelector("[data-asta-chat-status]");
    if (s) s.textContent = text;
  };
  // The list follows new content unless the reader scrolled up.
  const unpinned = new WeakSet();
  const follow = (chat, force) => {
    const log = chat?.querySelector("[data-asta-chat-log]");
    if (!log) return;
    if (force) unpinned.delete(log);
    if (!unpinned.has(log)) log.scrollTop = log.scrollHeight;
  };
  addEventListener(
    "scroll",
    (e) => {
      const log = e.target instanceof Element && e.target.matches("[data-asta-chat-log]") ? e.target : null;
      if (!log) return;
      if (log.scrollHeight - log.scrollTop - log.clientHeight < 40) unpinned.delete(log);
      else unpinned.add(log);
    },
    { capture: true, passive: true },
  );
  const sendState = (chat) => {
    const input = chat?.querySelector("[data-asta-chat-input]");
    const send = chat?.querySelector("[data-asta-chat-send]");
    if (input && send) send.disabled = !input.value.trim() || !!chat.querySelector("[data-asta-chat-placeholder]");
  };

  document.addEventListener("input", (e) => {
    if (el(e)?.matches("[data-asta-chat-input]")) sendState(chatOf(e.target));
  });
  document.addEventListener("keydown", (e) => {
    const input = el(e)?.closest("[data-asta-chat-input]");
    if (!input || e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    if (input.value.trim()) input.form?.requestSubmit();
  });
  document.addEventListener("click", (e) => {
    const t = el(e);
    const chip = t?.closest("[data-asta-chat-suggest]");
    if (chip) {
      const chat = chatOf(chip);
      const input = chat?.querySelector("[data-asta-chat-input]");
      if (!input) return;
      input.value = chip.getAttribute("data-asta-chat-suggest");
      input.form?.requestSubmit();
      return;
    }
    const copy = t?.closest("[data-asta-chat-copy]");
    if (copy) {
      const text = copy.closest("li")?.querySelector("[data-asta-chat-text]")?.textContent ?? "";
      const chat = chatOf(copy);
      navigator.clipboard?.writeText(text).then(
        () => {
          copy.setAttribute("data-copied", "");
          copy.setAttribute("aria-label", "Copied");
          chatStatus(chat, "Copied.");
          clearTimeout(copy._astaT);
          copy._astaT = setTimeout(() => {
            copy.removeAttribute("data-copied");
            copy.setAttribute("aria-label", "Copy");
          }, 1600);
        },
        () => chatStatus(chat, "Couldn't copy."),
      );
    }
  });

  // Draw the person's message and a thinking row right away. The server answers with the reply only.
  document.addEventListener("htmx:configRequest", (e) => {
    const form = e.detail?.elt;
    if (!(form instanceof Element) || !form.matches("[data-asta-chat-form]")) return;
    const chat = chatOf(form);
    const input = form.querySelector("[data-asta-chat-input]");
    const text = input?.value.trim() ?? "";
    if (!text || chat.querySelector("[data-asta-chat-placeholder]")) {
      e.preventDefault();
      return;
    }
    const list = chat.querySelector("[data-asta-chat-list]");
    const tpl = chat.querySelector("template[data-asta-chat-pending]");
    if (list && tpl) {
      const frag = tpl.content.cloneNode(true);
      const [user, reply] = frag.querySelectorAll("li");
      user.querySelector("p").textContent = text;
      reply.removeAttribute("data-asta-chat-stream");
      reply.setAttribute("data-asta-chat-placeholder", "");
      list.append(frag);
    }
    input.value = "";
    sendState(chat);
    chatStatus(chat, "Assistant is replying.");
    follow(chat, true);
  });
  document.addEventListener("htmx:beforeSwap", (e) => {
    const target = e.detail?.target;
    if (target instanceof Element && target.matches("[data-asta-chat-list]") && e.detail.xhr?.status < 400) {
      target.querySelector("[data-asta-chat-placeholder]")?.remove();
    }
  });
  document.addEventListener("htmx:afterRequest", (e) => {
    const form = e.detail?.elt;
    if (!(form instanceof Element) || !form.matches("[data-asta-chat-form]")) return;
    const chat = chatOf(form);
    const pending = chat.querySelector("[data-asta-chat-placeholder]");
    if (pending) {
      // The request failed: keep the row and say so.
      pending.removeAttribute("data-asta-chat-placeholder");
      pending.removeAttribute("aria-busy");
      pending.querySelector("[data-asta-chat-dots]")?.replaceWith(
        Object.assign(document.createElement("p"), { className: "text-[12.5px] text-mute", textContent: "Something went wrong. Try again." }),
      );
      chatStatus(chat, "The reply failed.");
    } else chatStatus(chat, "Reply received.");
    sendState(chat);
    follow(chat);
  });

  // Server-Sent Events: each message's data is appended to the reply; an event named "done" ends it.
  function stream(li) {
    const url = li.getAttribute("data-asta-chat-stream");
    li.removeAttribute("data-asta-chat-stream");
    const chat = chatOf(li);
    const text = li.querySelector("[data-asta-chat-text]");
    const es = new EventSource(url);
    const end = (failed) => {
      es.close();
      li.removeAttribute("aria-busy");
      li.querySelector("[data-asta-chat-dots]")?.remove();
      if (failed && !text.textContent) {
        text.classList.remove("hidden");
        text.classList.add("text-mute");
        text.textContent = "Something went wrong. Try again.";
      }
      chatStatus(chat, failed ? "The reply failed." : "Reply finished.");
      follow(chat);
    };
    es.onmessage = (m) => {
      li.querySelector("[data-asta-chat-dots]")?.remove();
      text.classList.remove("hidden");
      const span = document.createElement("span");
      span.textContent = m.data;
      if (!reduce()) span.style.animation = `asta-blk-tok .5s ${EASE}`;
      text.append(span);
      follow(chat);
    };
    es.addEventListener("done", () => end(false));
    es.onerror = () => end(true);
  }

  /* ---------- Checkout ---------- */

  const digits = (s) => s.replace(/\D/g, "");
  const FORMAT = {
    card: (d) => {
      if (/^3[47]/.test(d)) {
        const v = d.slice(0, 15);
        return [v.slice(0, 4), v.slice(4, 10), v.slice(10)].filter(Boolean).join(" ");
      }
      return d.slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
    },
    expiry: (d) => {
      const v = d.slice(0, 4);
      return v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v;
    },
    cvc: (d) => d.slice(0, 4),
  };
  // Formatted fields keep the caret after the same number of digits.
  document.addEventListener("input", (e) => {
    const input = el(e)?.closest("[data-asta-checkout-format]");
    const fmt = input && FORMAT[input.getAttribute("data-asta-checkout-format")];
    if (!fmt) return;
    const before = digits(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    const out = fmt(digits(input.value));
    input.value = out;
    let pos = 0;
    for (let seen = 0; pos < out.length && seen < before; pos++) if (/\d/.test(out[pos])) seen++;
    if (document.activeElement === input) input.setSelectionRange(pos, pos);
  });

  const recalc = (from) => {
    const summary = from.closest("[data-asta-checkout]")?.querySelector("[data-asta-checkout-summary]");
    if (!summary) return;
    // Batch quick clicks into one request.
    clearTimeout(summary._astaT);
    summary._astaT = setTimeout(() => summary.dispatchEvent(new CustomEvent("asta:recalc", { bubbles: false })), 220);
  };
  document.addEventListener("click", (e) => {
    const t = el(e);
    const step = t?.closest("[data-asta-checkout-step]");
    if (step) {
      const box = step.closest("[data-asta-checkout-qty]");
      const input = box.querySelector("input");
      const q = Math.min(99, Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(step.getAttribute("data-asta-checkout-step"), 10)));
      input.value = String(q);
      box.querySelector("[data-asta-checkout-qty-text]").textContent = String(q);
      const [less, more] = box.querySelectorAll("[data-asta-checkout-step]");
      less.disabled = q <= 1;
      more.disabled = q >= 99;
      recalc(step);
      return;
    }
    if (t?.closest("[data-asta-checkout-apply]")) return recalc(t);
    const remove = t?.closest("[data-asta-checkout-promo-remove]");
    if (remove) {
      const hidden = remove.closest("[data-asta-checkout-summary]").querySelector("input[data-asta-checkout-promo]");
      if (hidden) hidden.value = "";
      recalc(remove);
    }
  });
  document.addEventListener("change", (e) => {
    if (el(e)?.matches("[data-asta-checkout-recalc]")) recalc(e.target);
  });
  // Enter in the promo field applies the code instead of paying.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && el(e)?.matches("input[data-asta-checkout-promo]")) {
      e.preventDefault();
      recalc(e.target);
    }
  });

  // Amounts whose text changed roll in from the direction the value moved.
  const amounts = new Map();
  const amount = (s) => parseFloat(s.replace(/[^\d.-]/g, "")) || 0;
  document.addEventListener("htmx:beforeSwap", (e) => {
    const t = e.detail?.target;
    if (!(t instanceof Element) || !t.matches("[data-asta-checkout-summary]")) return;
    const m = {};
    for (const a of t.querySelectorAll("[data-asta-money]")) m[a.getAttribute("data-asta-money")] = a.textContent.trim();
    amounts.set(t.id, m);
  });
  function roll(root) {
    for (const [id, old] of amounts) {
      const s = document.getElementById(id);
      if (!s || !root.contains(s)) continue;
      amounts.delete(id);
      if (reduce()) continue;
      for (const a of s.querySelectorAll("[data-asta-money]")) {
        const prev = old[a.getAttribute("data-asta-money")];
        const now = a.textContent.trim();
        if (prev === undefined || prev === now) continue;
        const up = amount(now) >= amount(prev);
        a.firstElementChild?.animate([{ opacity: 0, transform: `translateY(${up ? 70 : -70}%)` }, { opacity: 1, transform: "none" }], { duration: 500, easing: EASE });
      }
    }
  }

  /* ---------- Properties panel ---------- */

  const num = (input) => {
    const d = input.dataset;
    return { step: parseFloat(d.step) || 1, prec: parseInt(d.precision, 10) || 0, min: d.min === undefined ? -Infinity : +d.min, max: d.max === undefined ? Infinity : +d.max };
  };
  const setNum = (input, v) => {
    const o = num(input);
    const f = 10 ** o.prec;
    input.value = (Math.min(o.max, Math.max(o.min, Math.round(v * f) / f))).toFixed(o.prec);
  };
  const factor = (e) => (e.shiftKey ? 10 : e.altKey ? 0.1 : 1);
  const fire = (input, type) => input.dispatchEvent(new Event(type, { bubbles: true }));
  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    const handle = el(e)?.closest("[data-asta-prop-handle]");
    if (!handle || e.button !== 0) return;
    const box = handle.closest("[data-asta-prop-scrub]");
    const input = box.querySelector("input");
    if (input.disabled) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    drag = { handle, box, input, x: e.clientX, v: parseFloat(input.value) || 0, moved: false, start: input.value };
    box.setAttribute("data-scrubbing", "");
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 2) drag.moved = true;
    if (!drag.moved) return;
    setNum(drag.input, drag.v + Math.round(dx / 2) * num(drag.input).step * factor(e));
    fire(drag.input, "input");
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.box.removeAttribute("data-scrubbing");
    if (!d.moved) {
      d.input.focus();
      d.input.select();
    } else if (d.input.value !== d.start) fire(d.input, "change");
  };
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  document.addEventListener("focusin", (e) => {
    const input = el(e)?.matches("[data-asta-prop-scrub] input, input[data-asta-prop-hex]") ? e.target : null;
    if (!input) return;
    input.dataset.prev = input.value;
    input.select();
  });
  document.addEventListener("keydown", (e) => {
    const input = el(e)?.matches("[data-asta-prop-scrub] input, input[data-asta-prop-hex]") ? e.target : null;
    if (!input) return;
    if (e.key === "Enter") {
      // Commit with a change event; don't submit the panel's form.
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      input.value = input.dataset.prev ?? input.value;
      input.blur();
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && input.closest("[data-asta-prop-scrub]")) {
      e.preventDefault();
      setNum(input, (parseFloat(input.value) || 0) + (e.key === "ArrowUp" ? 1 : -1) * num(input).step * factor(e));
      input.dataset.prev = input.value;
      fire(input, "input");
      fire(input, "change");
    }
  });

  const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const normHex = (v) => {
    const m = v.trim().match(HEX);
    if (!m) return null;
    return `#${(m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]).toLowerCase()}`;
  };
  const paint = (box, hex) => {
    const sw = box.querySelector("[data-asta-prop-swatch]");
    if (sw) sw.style.background = hex;
    const picker = box.querySelector('input[type="color"]');
    if (picker) picker.value = hex;
    const text = box.querySelector("input[data-asta-prop-hex]");
    if (text) text.value = hex;
  };
  document.addEventListener("input", (e) => {
    const picker = el(e)?.matches('[data-asta-prop-color] input[type="color"]') ? e.target : null;
    if (picker) paint(picker.closest("[data-asta-prop-color]"), picker.value);
  });
  // Capture runs before htmx's listener on the form, so the server gets the cleaned value.
  document.addEventListener(
    "change",
    (e) => {
      const t = el(e);
      if (t?.matches("[data-asta-prop-scrub] input")) {
        const v = parseFloat(t.value.replace(",", "."));
        if (Number.isFinite(v)) setNum(t, v);
        else t.value = t.dataset.prev ?? "0";
      } else if (t?.matches("input[data-asta-prop-hex]")) {
        const box = t.closest("[data-asta-prop-color]");
        paint(box, normHex(t.value) ?? normHex(t.dataset.prev ?? "") ?? box.querySelector('input[type="color"]').value);
      }
    },
    true,
  );

  /* ---------- Settings panel ---------- */

  const baseline = new WeakMap();
  const serial = (form) => new URLSearchParams(new FormData(form)).toString();
  const barButtons = (form, on) => {
    for (const b of form.querySelectorAll("[data-asta-settings-bar] button")) b.tabIndex = on ? 0 : -1;
  };
  function dirty(form) {
    if (!baseline.has(form)) return;
    const on = serial(form) !== baseline.get(form);
    form.toggleAttribute("data-dirty", on);
    if (on) {
      form.removeAttribute("data-saved");
      clearTimeout(form._astaT);
    }
    barButtons(form, on);
  }
  const settingsForm = (t) => t?.closest("[data-asta-settings]:not([data-autosave])");
  document.addEventListener("input", (e) => {
    const f = settingsForm(el(e));
    if (f) dirty(f);
  });
  document.addEventListener("change", (e) => {
    const f = settingsForm(el(e));
    if (f) dirty(f);
  });
  // "reset" fires before the fields change back.
  document.addEventListener("reset", (e) => {
    const f = settingsForm(el(e));
    if (f) setTimeout(() => dirty(f));
  });
  document.addEventListener("htmx:afterRequest", (e) => {
    const f = e.detail?.elt instanceof Element && e.detail.elt.matches("[data-asta-settings]:not([data-autosave])") ? e.detail.elt : null;
    if (!f || !f.isConnected) return;
    if (!e.detail.successful) {
      shake(f.querySelector("[data-asta-settings-bar] > *"));
      return;
    }
    // The saved values become what Reset goes back to.
    for (const i of f.elements) {
      if (i.type === "checkbox" || i.type === "radio") i.defaultChecked = i.checked;
      else if (i.tagName === "SELECT") for (const o of i.options) o.defaultSelected = o.selected;
      else if ("defaultValue" in i) i.defaultValue = i.value;
    }
    baseline.set(f, serial(f));
    f.removeAttribute("data-dirty");
    f.setAttribute("data-saved", "");
    barButtons(f, false);
    clearTimeout(f._astaT);
    f._astaT = setTimeout(() => f.removeAttribute("data-saved"), 1400);
  });
  addEventListener("beforeunload", (e) => {
    const f = document.querySelector("[data-asta-settings][data-dirty]");
    if (f) {
      shake(f.querySelector("[data-asta-settings-bar] > *"));
      e.preventDefault();
    }
  });

  /* ---------- Boot and htmx ---------- */

  function scan(root) {
    for (const chat of root.querySelectorAll("[data-asta-chat]")) {
      sendState(chat);
      follow(chat, !chat.dataset.astaSeen);
      chat.dataset.astaSeen = "";
    }
    if (root.closest?.("[data-asta-chat]")) follow(chatOf(root));
    for (const li of root.querySelectorAll("li[data-asta-chat-stream]")) stream(li);
    for (const f of root.querySelectorAll("[data-asta-settings]:not([data-autosave])")) {
      if (!baseline.has(f)) baseline.set(f, serial(f));
    }
    for (const row of root.querySelectorAll("[data-asta-team-removed]:not([data-timed])")) {
      row.setAttribute("data-timed", "");
      const secs = parseFloat(row.querySelector("[data-asta-team-countdown]")?.style.animationDuration) || 5;
      setTimeout(() => {
        row.setAttribute("data-gone", "");
        setTimeout(() => row.closest("li")?.remove(), reduce() ? 0 : 300);
      }, secs * 1000);
    }
    roll(root);
  }
  const boot = () => scan(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("htmx:afterSettle", (e) => scan(e.detail?.elt?.parentElement || document));
})();
