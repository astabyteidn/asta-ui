/* Forms group: the behaviour behind the form controls. Event delegation on document, so markup swapped in by
 * htmx works without re-init. Every control keeps a real form field (native input or hidden input) up to date.
 *   CopyButton        [data-asta-copy]
 *   SegmentedControl  [data-asta-segmented]   ToggleGroup [data-asta-toggle]
 *   NumberInput       [data-asta-number]      OtpInput    [data-asta-otp]
 *   PasswordInput     [data-asta-password]    TagInput    [data-asta-tags]
 *   RangeSlider       [data-asta-range]       Rating      [data-asta-rating]
 *   ColorPicker       [data-asta-color]       Combobox    [data-asta-combo]
 *   DatePicker        [data-asta-date]        FileUpload  [data-asta-upload]
 *   InlineEdit        [data-asta-inline]
 */
(() => {
  if (window.__astaForms) return;
  window.__astaForms = true;
  const EASE = "cubic-bezier(.16,1,.3,1)";
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (e) => (e.target instanceof Element ? e.target : null);
  const near = (e, sel) => el(e)?.closest(sel) || null;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const emit = (node, type, detail) =>
    node.dispatchEvent(detail === undefined ? new Event(type, { bubbles: true }) : new CustomEvent(type, { bubbles: true, detail }));
  // Restart a CSS animation on a class without remounting the element.
  const replay = (node, cls) => {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };
  const on = (type, fn, capture) => document.addEventListener(type, fn, capture);

  /* ---------- Slider ---------- */

  // Chrome and Safari can't fill a range track up to the thumb, so the wrapper carries --asta-fill.
  const sliderFill = (i) => {
    const lo = +i.min || 0, hi = i.max === "" ? 100 : +i.max;
    const f = hi > lo ? ((+i.value - lo) / (hi - lo)) * 100 : 0;
    i.parentElement?.style.setProperty("--asta-fill", `${Math.min(100, Math.max(0, f))}%`);
  };
  on("input", (e) => e.target instanceof HTMLInputElement && e.target.matches("[data-asta-slider]") && sliderFill(e.target));
  on("reset", (e) => {
    if (!(e.target instanceof HTMLFormElement)) return;
    const f = e.target;
    requestAnimationFrame(() => f.querySelectorAll("input[data-asta-slider]").forEach(sliderFill));
  });

  /* ---------- CopyButton ---------- */

  async function writeText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Older browsers and non-secure pages: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {}
      ta.remove();
      return ok;
    }
  }

  on("click", async (e) => {
    const b = near(e, "[data-asta-copy]");
    if (!b || b.disabled) return;
    let text = b.getAttribute("data-asta-copy") || "";
    const from = b.getAttribute("data-asta-copy-from");
    const src = from ? document.querySelector(from) : null;
    if (src) text = src instanceof HTMLInputElement || src instanceof HTMLTextAreaElement ? src.value : src.textContent.trim();
    const ok = await writeText(text);
    b.dataset.state = ok ? "copied" : "failed";
    const status = b.nextElementSibling?.matches("[data-asta-copy-status]") ? b.nextElementSibling : null;
    if (status) status.textContent = ok ? b.dataset.copied || "Copied" : "Couldn't copy";
    if (ok) emit(b, "asta:copy", { text });
    clearTimeout(b._astaTimer);
    b._astaTimer = setTimeout(() => {
      b.dataset.state = "idle";
      if (status) status.textContent = "";
    }, Number(b.dataset.timeout) || 1600);
  });

  /* ---------- Radio-like groups: SegmentedControl, ToggleGroup (single), Rating ---------- */

  // What was checked just before a pointer or key press, so a change can slide from it (or a click can clear it).
  const before = new WeakMap();
  const GROUPS = "[data-asta-segmented],[data-asta-toggle='single'],[data-asta-rating]";
  const remember = (e) => {
    const root = near(e, GROUPS);
    if (root) before.set(root, { input: root.querySelector("input:checked"), pointer: e.type === "pointerdown" });
  };
  on("pointerdown", remember, true);
  on("keydown", remember, true);

  // FLIP the new background from the old one's box, so it slides with transform only.
  function slidePill(root, from, to) {
    const ind = to.parentElement.querySelector("[data-asta-ind]");
    if (!ind || reduce() || from === to) return;
    const next = to.parentElement;
    const prev = from?.parentElement;
    const squash = root.hasAttribute("data-asta-segmented");
    ind.style.transition = "none";
    ind.style.transformOrigin = "left";
    if (prev && prev.offsetWidth) {
      const dx = prev.offsetLeft - next.offsetLeft;
      ind.style.transform = `translateX(${dx}px) scaleX(${prev.offsetWidth / next.offsetWidth})${squash ? " scaleY(.86)" : ""}`;
    } else {
      ind.style.opacity = "0";
      ind.style.transform = "scale(.94)";
    }
    void ind.offsetWidth;
    ind.style.transition = `transform ${squash ? 0.5 : 0.44}s ${EASE}, opacity .25s ${EASE}`;
    ind.style.transform = "";
    ind.style.opacity = "";
  }

  on("change", (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    const pill = input.closest("[data-asta-segmented],[data-asta-toggle='single']");
    if (pill && input.checked) {
      slidePill(pill, before.get(pill)?.input, input);
      before.delete(pill);
    }
    const rating = input.closest("[data-asta-rating]");
    if (rating && input.checked) rate(rating, Number(input.value), true);
  });

  // A click on the pressed option of a ToggleGroup with AllowEmpty, or on the current star, clears it.
  on("click", (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "radio") return;
    const root = input.closest("[data-asta-toggle][data-allow-empty],[data-asta-rating][data-clear]");
    if (!root) return;
    const was = before.get(root);
    before.delete(root);
    if (!was || was.input !== input) return;
    if (root.hasAttribute("data-asta-rating")) {
      if (!was.pointer || Number(input.value) <= 0) return;
      const zero = root.querySelector('input[value="0"]');
      if (zero) {
        zero.checked = true;
        emit(zero, "change");
      }
    } else {
      input.checked = false;
      emit(input, "change");
    }
  });

  /* ---------- Rating ---------- */

  function paintStars(root, v, preview) {
    root.querySelectorAll("[data-asta-star]").forEach((s, i) => {
      s.dataset.fill = v >= i + 1 ? "full" : v >= i + 0.5 ? "half" : "none";
      s.toggleAttribute("data-preview", preview);
    });
  }
  function rate(root, v, pop) {
    root.dataset.value = String(v);
    paintStars(root, v, false);
    if (!pop || reduce()) return;
    root.querySelectorAll("[data-asta-star-pop]").forEach((p, i) => {
      if (i < Math.ceil(v)) replay(p, "asta-rating-pop");
      else p.classList.remove("asta-rating-pop");
    });
  }
  on("pointermove", (e) => {
    const label = near(e, "[data-asta-rating] label");
    if (!label) return;
    const root = label.closest("[data-asta-rating]");
    const v = Number(label.querySelector("input")?.value);
    const cur = Number(root.dataset.value) || 0;
    paintStars(root, v, v !== cur);
  });
  on(
    "pointerleave",
    (e) => {
      if (e.target instanceof Element && e.target.matches("[data-asta-rating]")) paintStars(e.target, Number(e.target.dataset.value) || 0, false);
    },
    true,
  );

  /* ---------- NumberInput ---------- */

  const DIGIT =
    '<span class="relative inline-block h-[1.25em] w-[0.62em] overflow-hidden" data-asta-digit><span class="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none">' +
    Array.from({ length: 10 }, (_, i) => `<span class="flex h-[1.25em] items-center justify-center">${i}</span>`).join("") +
    "</span></span>";

  function numberSet(root, v) {
    const min = Number(root.dataset.min);
    const max = Number(root.dataset.max);
    const input = root.querySelector("[data-asta-number-input]");
    const view = root.querySelector("[data-asta-number-view]");
    const cur = Number(input.value);
    const next = Math.min(max, Math.max(min, v));
    if (next === cur) {
      // Already at a limit: nudge to say so.
      if (v !== cur) {
        view.dataset.bump = v < min ? "min" : "max";
        clearTimeout(view._astaBump);
        view._astaBump = setTimeout(() => delete view.dataset.bump, 260);
      }
      return false;
    }
    input.value = String(next);
    view.setAttribute("aria-valuenow", String(next));
    // Reuse strips from the right, so 9 → 10 rolls the last digit and adds one on the left.
    const wrap = root.querySelector("[data-asta-number-digits]");
    const digits = String(Math.abs(next)).split("").map(Number);
    let strips = [...wrap.querySelectorAll("[data-asta-digit]")];
    while (strips.length < digits.length) {
      const t = document.createElement("template");
      t.innerHTML = DIGIT;
      const s = t.content.firstElementChild;
      s.firstElementChild.style.transform = `translateY(${-digits[digits.length - strips.length - 1] * 1.25}em)`;
      wrap.insertBefore(s, strips[0] || null);
      strips = [s, ...strips];
    }
    while (strips.length > digits.length) strips.shift().remove();
    let minus = wrap.querySelector("[data-minus]");
    if (next < 0 && !minus) {
      minus = document.createElement("span");
      minus.dataset.minus = "";
      minus.textContent = "−";
      wrap.prepend(minus);
    } else if (next >= 0) minus?.remove();
    strips.forEach((s, i) => (s.firstElementChild.style.transform = `translateY(${-digits[i] * 1.25}em)`));
    root.querySelector('[data-asta-number-step="-1"]').disabled = next <= min;
    root.querySelector('[data-asta-number-step="1"]').disabled = next >= max;
    emit(input, "input");
    emit(input, "change");
    return true;
  }
  const numberValue = (root) => Number(root.querySelector("[data-asta-number-input]").value);

  let holdTimer = null;
  const holdStop = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
  };
  on("pointerdown", (e) => {
    const b = near(e, "[data-asta-number-step]");
    if (!b || e.button !== 0 || b.disabled) return;
    const root = b.closest("[data-asta-number]");
    const dir = Number(b.dataset.astaNumberStep) * Number(root.dataset.step || 1);
    try {
      b.setPointerCapture(e.pointerId);
    } catch {}
    holdStop();
    numberSet(root, numberValue(root) + dir);
    // Repeat while held, faster the longer it's held.
    let delay = 380;
    const tick = () => {
      if (!numberSet(root, numberValue(root) + dir)) return holdStop();
      delay = Math.max(40, delay * 0.82);
      holdTimer = setTimeout(tick, delay);
    };
    holdTimer = setTimeout(tick, delay);
  });
  // Screen readers click without a pointer press.
  on("click", (e) => {
    const b = near(e, "[data-asta-number-step]");
    if (!b || e.detail !== 0 || b.disabled) return;
    const root = b.closest("[data-asta-number]");
    numberSet(root, numberValue(root) + Number(b.dataset.astaNumberStep) * Number(root.dataset.step || 1));
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => on(t, (e) => near(e, "[data-asta-number-step]") && holdStop()));
  on("contextmenu", (e) => near(e, "[data-asta-number-step]") && e.preventDefault());
  on("keydown", (e) => {
    const view = near(e, "[data-asta-number-view]");
    if (!view) return;
    const root = view.closest("[data-asta-number]");
    const step = Number(root.dataset.step || 1);
    const cur = numberValue(root);
    const k = e.key;
    if (k === "ArrowUp" || k === "ArrowRight") numberSet(root, cur + step);
    else if (k === "ArrowDown" || k === "ArrowLeft") numberSet(root, cur - step);
    else if (k === "PageUp") numberSet(root, cur + step * 10);
    else if (k === "PageDown") numberSet(root, cur - step * 10);
    else if (k === "Home") numberSet(root, Number(root.dataset.min));
    else if (k === "End") numberSet(root, Number(root.dataset.max));
    else if (/^[0-9]$/.test(k)) {
      const typed = e.timeStamp - (view._astaAt || 0) > 900 ? k : (view._astaTyped || "") + k;
      view._astaTyped = typed;
      view._astaAt = e.timeStamp;
      numberSet(root, Number(typed));
    } else return;
    e.preventDefault();
  });

  /* ---------- OtpInput ---------- */

  function otpPaint(root) {
    const input = root.querySelector("input");
    const boxes = [...root.querySelectorAll("[data-asta-otp-box]")];
    const code = input.value;
    const n = boxes.length;
    const err = input.getAttribute("aria-invalid") === "true";
    const active = document.activeElement === input && !input.disabled ? Math.min(code.length, n - 1) : -1;
    boxes.forEach((b, i) => {
      const ch = code[i] || "";
      b.dataset.state = err ? "error" : i === active ? "active" : code.length === n ? "full" : ch ? "filled" : "";
      const had = b.dataset.ch ?? b.textContent.trim();
      if (had !== ch || (!ch && b.querySelector(".asta-otp-caret"))) {
        b.innerHTML = ch ? `<span class="asta-otp-ch">${esc(ch)}</span>` : "";
      }
      b.dataset.ch = ch;
      if (!ch && i === active && !err && !b.firstChild) b.innerHTML = '<span class="asta-otp-caret"></span>';
    });
  }
  function otpSet(input, raw) {
    const root = input.closest("[data-asta-otp]");
    const n = root.querySelectorAll("[data-asta-otp-box]").length;
    const prev = input._astaPrev ?? input.defaultValue;
    const next = (input.hasAttribute("data-letters") ? raw.replace(/[^a-z0-9]/gi, "").toUpperCase() : raw.replace(/\D/g, "")).slice(0, n);
    input.value = next;
    input._astaPrev = next;
    if (next !== prev) {
      // Typing again clears an error the server rendered.
      input.removeAttribute("aria-invalid");
      root.querySelector("[data-asta-otp-boxes]").classList.remove("asta-otp-shake");
    }
    otpPaint(root);
    if (next.length === n && prev.length < n) {
      const boxes = root.querySelector("[data-asta-otp-boxes]");
      boxes.removeAttribute("data-wave");
      void boxes.offsetWidth;
      boxes.setAttribute("data-wave", "");
      emit(input, "asta:complete", { code: next });
    }
  }
  const otpEnd = (input) => {
    const n = input.value.length;
    if (input.selectionStart !== n || input.selectionEnd !== n) input.setSelectionRange(n, n);
  };
  const otpInput = (e) => (e.target instanceof HTMLInputElement && e.target.parentElement?.matches("[data-asta-otp]") ? e.target : null);
  on("input", (e) => {
    const i = otpInput(e);
    if (i) otpSet(i, i.value);
  });
  on("paste", (e) => {
    const i = otpInput(e);
    if (!i) return;
    // Paste replaces the whole code, wherever the caret was.
    e.preventDefault();
    otpSet(i, e.clipboardData?.getData("text") || "");
  });
  ["focusin", "focusout"].forEach((t) =>
    on(t, (e) => {
      const i = otpInput(e);
      if (!i) return;
      if (t === "focusin") otpEnd(i);
      otpPaint(i.parentElement);
    }),
  );
  ["select", "click", "keyup"].forEach((t) =>
    on(
      t,
      (e) => {
        const i = otpInput(e);
        if (i) otpEnd(i);
      },
      true,
    ),
  );

  /* ---------- PasswordInput ---------- */

  const WORDS = ["Weak", "Weak", "Fair", "Good", "Strong"];
  function passwordCheck(root) {
    const input = root.querySelector("[data-asta-password-input]");
    const v = input.value;
    const rules = [...root.querySelectorAll("[data-asta-password-rule]")];
    let score = 0;
    rules.forEach((r) => {
      let ok = false;
      try {
        ok = new RegExp(r.getAttribute("data-asta-password-rule")).test(v);
      } catch {}
      if (ok) score++;
      r.toggleAttribute("data-on", ok);
      const said = r.querySelector("[data-asta-password-said]");
      if (said) said.textContent = ok ? ", done" : ", not yet";
    });
    root.querySelectorAll("[data-asta-password-seg]").forEach((s, i) => s.toggleAttribute("data-on", i < score));
    root.toggleAttribute("data-strong", rules.length > 0 && score === rules.length);
    const word = root.querySelector("[data-asta-password-word]");
    if (word) {
      const w = !v || !rules.length ? "" : WORDS[Math.round((score / rules.length) * 4)];
      word.innerHTML = w ? `<span class="sr-only">Strength: </span>${w}` : "";
    }
  }
  on("input", (e) => {
    const root = near(e, "[data-asta-password]");
    if (root && e.target.matches("[data-asta-password-input]")) passwordCheck(root);
  });
  on("pointerdown", (e) => near(e, "[data-asta-password-toggle]") && e.preventDefault());
  on("click", (e) => {
    const b = near(e, "[data-asta-password-toggle]");
    if (!b) return;
    const input = b.closest("[data-asta-password]").querySelector("[data-asta-password-input]");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", String(show));
    b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  /* ---------- TagInput ---------- */

  const tagsOf = (root) => [...root.querySelectorAll("[data-asta-tag]")];
  function tagsSync(root) {
    const input = root.querySelector("[data-asta-tags-input]");
    const max = Number(root.dataset.max) || 8;
    const n = tagsOf(root).length;
    const full = n >= max;
    const count = root.querySelector("[data-asta-tags-count]");
    count.textContent = `${n}/${max}`;
    count.classList.toggle("text-[#e5484d]", full);
    count.classList.toggle("text-mute", !full);
    input.disabled = full && !input.value;
    input.placeholder = full ? "Limit reached" : n ? "" : root.dataset.placeholder || "";
  }
  function tagsAdd(root, raws) {
    const input = root.querySelector("[data-asta-tags-input]");
    const list = root.querySelector("[data-asta-tags-list]");
    const tpl = root.querySelector("template[data-asta-tags-tpl]");
    const max = Number(root.dataset.max) || 8;
    let added = false;
    for (const r of raws) {
      const t = r.trim().replace(/\s+/g, " ");
      if (!t) continue;
      const tags = tagsOf(root);
      const dup = tags.find((li) => li.dataset.astaTag.toLowerCase() === t.toLowerCase());
      if (dup) {
        if (!reduce()) replay(dup, "asta-tag-shake");
        continue;
      }
      if (tags.length >= max) break;
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.dataset.astaTag = t;
      li.querySelector("[data-asta-tag-text]").textContent = t;
      li.querySelector("[data-asta-tag-remove]").setAttribute("aria-label", `Remove ${t}`);
      const hidden = li.querySelector("input[type=hidden]");
      if (hidden) hidden.value = t;
      list.append(li);
      added = true;
    }
    input.value = "";
    tagsSync(root);
    if (added) emit(root, "change");
  }
  function tagsRemove(root, li) {
    li.remove();
    tagsSync(root);
    root.querySelector("[data-asta-tags-input]").focus();
    emit(root, "change");
  }
  const tagsDisarm = (root) => tagsOf(root).forEach((li) => li.removeAttribute("data-armed"));
  const tagsInput = (e) => (e.target instanceof HTMLInputElement && e.target.matches("[data-asta-tags-input]") ? e.target : null);
  on("keydown", (e) => {
    const input = tagsInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-tags]");
    const tags = tagsOf(root);
    const last = tags[tags.length - 1];
    if (e.key === "Enter") {
      e.preventDefault();
      tagsAdd(root, [input.value]);
    } else if (e.key === "Backspace" && !input.value && last) {
      // The first Backspace marks the last tag, the second removes it.
      if (last.hasAttribute("data-armed")) tagsRemove(root, last);
      else last.setAttribute("data-armed", "");
    } else if (e.key === "Escape") tagsDisarm(root);
  });
  on("input", (e) => {
    const input = tagsInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-tags]");
    tagsDisarm(root);
    if (input.value.includes(",")) tagsAdd(root, input.value.split(","));
  });
  on("paste", (e) => {
    const input = tagsInput(e);
    const v = e.clipboardData?.getData("text") || "";
    if (!input || !/[,\n]/.test(v)) return;
    e.preventDefault();
    tagsAdd(input.closest("[data-asta-tags]"), v.split(/[,\n]/));
  });
  on("focusout", (e) => {
    const input = tagsInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-tags]");
    tagsDisarm(root);
    if (input.value.trim()) tagsAdd(root, [input.value]);
  });
  on("click", (e) => {
    const rm = near(e, "[data-asta-tag-remove]");
    if (rm) {
      e.stopPropagation();
      tagsRemove(rm.closest("[data-asta-tags]"), rm.closest("[data-asta-tag]"));
      return;
    }
    const box = near(e, "[data-asta-tags-box]");
    if (box) box.querySelector("[data-asta-tags-input]")?.focus();
  });

  /* ---------- RangeSlider ---------- */

  function rangeSync(root, moved) {
    const [a, b] = root.querySelectorAll("[data-asta-range-input]");
    const gap = Number(root.dataset.gap) || 0;
    const min = Number(a.min);
    const max = Number(a.max);
    // The thumbs never cross and keep the gap.
    if (moved === a && Number(a.value) > Number(b.value) - gap) a.value = String(Math.max(min, Number(b.value) - gap));
    if (moved === b && Number(b.value) < Number(a.value) + gap) b.value = String(Math.min(max, Number(a.value) + gap));
    const lo = Number(a.value);
    const hi = Number(b.value);
    const pct = (v) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
    root.querySelector("[data-asta-range-fill]").style.transform = `translateX(${pct(lo)}%) scaleX(${(pct(hi) - pct(lo)) / 100})`;
    const fmt = (v) => `${root.dataset.prefix || ""}${v}${root.dataset.suffix || ""}`;
    [lo, hi].forEach((v, i) => {
      const at = root.querySelector(`[data-asta-range-at="${i}"]`);
      // cqw = % of the track, so the zero-width marker never widens the page.
      at.style.transform = `translateX(${pct(v)}cqw)`;
      at.querySelector("[data-asta-range-bubble]").textContent = fmt(v);
      [a, b][i].setAttribute("aria-valuetext", fmt(v));
    });
    // The thumb you moved stays on top, and a low thumb parked at the max must stay grabbable.
    if (moved) {
      a.style.zIndex = moved === a || lo >= max ? "2" : "1";
      b.style.zIndex = moved === a || lo >= max ? "1" : "2";
    }
  }
  on("input", (e) => {
    const input = e.target instanceof Element && e.target.closest("[data-asta-range-input]");
    if (!input) return;
    const root = input.closest("[data-asta-range]");
    if (!e.isTrusted) return rangeSync(root, input);
    root.removeAttribute("data-glide");
    rangeSync(root, input);
  });
  on("pointerdown", (e) => {
    const track = near(e, "[data-asta-range-track]");
    if (!track || e.button !== 0) return;
    const root = track.closest("[data-asta-range]");
    const [a, b] = root.querySelectorAll("[data-asta-range-input]");
    if (a.disabled) return;
    const r = track.getBoundingClientRect();
    const min = Number(a.min);
    const max = Number(a.max);
    const v = min + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (max - min);
    const lo = Number(a.value);
    const hi = Number(b.value);
    const input = lo === hi ? (v < lo ? a : b) : Math.abs(v - lo) < Math.abs(v - hi) ? a : b;
    e.preventDefault();
    root.setAttribute("data-glide", "");
    input.value = String(v);
    input.focus({ preventScroll: true });
    emit(input, "input");
    emit(input, "change");
  });

  /* ---------- ColorPicker ---------- */

  const parseHex = (s) => {
    const h = String(s).trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(h)) return `#${[...h].map((c) => c + c).join("")}`;
    if (/^[0-9a-f]{6}$/.test(h)) return `#${h}`;
    return null;
  };
  const colorParts = (root) => ({
    radios: [...root.querySelectorAll("input[type=radio]:not([data-asta-color-custom])")],
    custom: root.querySelector("[data-asta-color-custom]"),
    hex: root.querySelector("[data-asta-color-hex]"),
    preview: root.querySelector("[data-asta-color-preview]"),
    hint: root.querySelector("[data-asta-color-hint]"),
  });
  const colorCurrent = (root) => root.querySelector("input[type=radio]:checked")?.value || "";
  function colorPreview(root, hex) {
    const { preview } = colorParts(root);
    if (!preview) return;
    preview.style.background = hex || "transparent";
    preview.toggleAttribute("data-empty", !hex);
  }
  function colorShow(root) {
    const { hex, hint } = colorParts(root);
    const cur = colorCurrent(root);
    if (hex) hex.value = cur.replace(/^#/, "");
    if (hint) {
      hint.textContent = "";
      hint.removeAttribute("data-on");
    }
    hex?.removeAttribute("aria-invalid");
    colorPreview(root, cur);
  }
  function colorCommit(root) {
    const { radios, custom, hex } = colorParts(root);
    const v = parseHex(hex.value);
    if (v && v !== colorCurrent(root)) {
      const match = radios.find((r) => r.value === v);
      const target = match || custom;
      target.value = v;
      target.checked = true;
      emit(target, "change");
    }
    colorShow(root);
  }
  on("change", (e) => {
    const root = e.target instanceof HTMLInputElement && e.target.type === "radio" && e.target.closest("[data-asta-color]");
    if (root) colorShow(root);
  });
  on("keydown", (e) => {
    const t = e.target;
    const root = t instanceof HTMLInputElement && t.closest("[data-asta-color]");
    if (!root) return;
    if (t.type === "radio" && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      // Up and down move a whole row, like the grid looks.
      const { radios } = colorParts(root);
      const cols = Number(root.dataset.columns) || 5;
      const i = radios.indexOf(t);
      const j = e.key === "ArrowDown" ? Math.min(radios.length - 1, i + cols) : Math.max(0, i - cols);
      e.preventDefault();
      if (i < 0 || j === i) return;
      radios[j].checked = true;
      radios[j].focus();
      emit(radios[j], "change");
    } else if (t.matches("[data-asta-color-hex]")) {
      if (e.key === "Enter") {
        e.preventDefault();
        colorCommit(root);
      } else if (e.key === "Escape") {
        e.preventDefault();
        colorShow(root);
      }
    }
  });
  on("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || !t.matches("[data-asta-color-hex]")) return;
    const root = t.closest("[data-asta-color]");
    const { hint } = colorParts(root);
    const v = parseHex(t.value);
    const bad = t.value.trim() !== "" && !v;
    colorPreview(root, v);
    t.toggleAttribute("aria-invalid", bad);
    if (hint) {
      hint.textContent = bad ? "Not a hex" : "";
      hint.toggleAttribute("data-on", bad);
    }
  });
  on("focusout", (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.matches("[data-asta-color-hex]")) colorCommit(t.closest("[data-asta-color]"));
  });

  /* ---------- Combobox ---------- */

  const combo = (root) => ({
    input: root.querySelector("[data-asta-combo-input]"),
    list: root.querySelector('[role="listbox"]'),
    opts: [...root.querySelectorAll('[role="option"]')],
    multi: root.dataset.astaCombo === "multiple",
    value: root.querySelector("[data-asta-combo-value]"),
  });
  const comboShown = (root) => combo(root).opts.filter((o) => !o.hidden);
  const comboEnabled = (root) => comboShown(root).filter((o) => o.getAttribute("aria-disabled") !== "true");
  function comboActive(root, opt) {
    const { input, opts } = combo(root);
    opts.forEach((o) => o.toggleAttribute("data-active", o === opt));
    if (opt) {
      input.setAttribute("aria-activedescendant", opt.id);
      opt.scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  }
  function comboFilter(root, q) {
    const { opts } = combo(root);
    const query = q.trim().toLowerCase();
    let n = 0;
    for (const o of opts) {
      const label = o.dataset.label || "";
      const i = query ? label.toLowerCase().indexOf(query) : -1;
      o.hidden = Boolean(query) && i < 0;
      if (!o.hidden) n++;
      const text = o.querySelector("[data-asta-combo-text]");
      // The typed part in bold.
      text.innerHTML =
        i < 0
          ? esc(label)
          : `${esc(label.slice(0, i))}<span class="font-semibold text-ink">${esc(label.slice(i, i + query.length))}</span>${esc(label.slice(i + query.length))}`;
    }
    const empty = root.querySelector("[data-asta-combo-empty]");
    empty.hidden = n > 0;
    const said = root.querySelector("[data-asta-combo-query]");
    said.textContent = query ? `Nothing matches “${q.trim()}”` : "";
  }
  function comboOpen(root) {
    const { input, list, multi } = combo(root);
    if (input.disabled || root.hasAttribute("data-open")) return;
    root.setAttribute("data-open", "");
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    root.querySelector("[data-asta-combo-toggle]")?.setAttribute("aria-label", "Close list");
    comboFilter(root, root._astaQuery ?? "");
    const picked = !multi && comboEnabled(root).find((o) => o.getAttribute("aria-selected") === "true");
    comboActive(root, picked || comboEnabled(root)[0]);
  }
  function comboClose(root, dismiss) {
    const { input, list, multi, value, opts } = combo(root);
    if (!root.hasAttribute("data-open") && root._astaQuery == null) return;
    // Leaving a single combobox with its text cleared clears the value.
    if (dismiss && !multi && root._astaQuery != null && !root._astaQuery.trim() && opts.some((o) => o.getAttribute("aria-selected") === "true")) {
      opts.forEach((o) => o.setAttribute("aria-selected", "false"));
      if (value) {
        value.value = "";
        emit(value, "change");
      } else emit(root, "change");
    }
    root._astaQuery = null;
    root.removeAttribute("data-open");
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    root.querySelector("[data-asta-combo-toggle]")?.setAttribute("aria-label", "Open list");
    if (!multi) input.value = opts.find((o) => o.getAttribute("aria-selected") === "true")?.dataset.label || "";
  }
  function comboChipSync(root) {
    const { input, multi } = combo(root);
    if (!multi) return;
    input.placeholder = root.querySelector("[data-asta-combo-chip]") ? "" : input.dataset.placeholder || "";
  }
  function comboPick(root, opt) {
    if (!opt || opt.getAttribute("aria-disabled") === "true") return;
    const { input, multi, value, opts } = combo(root);
    if (multi) {
      const v = opt.dataset.value;
      const chip = [...root.querySelectorAll("[data-asta-combo-chip]")].find((c) => c.dataset.astaComboChip === v);
      if (chip) {
        chip.remove();
        opt.setAttribute("aria-selected", "false");
      } else {
        const c = root.querySelector("template[data-asta-combo-tpl]").content.firstElementChild.cloneNode(true);
        c.dataset.astaComboChip = v;
        c.querySelector("[data-asta-combo-chip-text]").textContent = opt.dataset.label;
        c.querySelector("[data-asta-combo-remove]").setAttribute("aria-label", `Remove ${opt.dataset.label}`);
        const icon = opt.querySelector("[data-asta-combo-icon]");
        if (icon) {
          const s = document.createElement("span");
          s.className = "inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5";
          s.innerHTML = icon.innerHTML;
          c.prepend(s);
        }
        const hidden = c.querySelector("input[type=hidden]");
        if (hidden) hidden.value = v;
        input.before(c);
        opt.setAttribute("aria-selected", "true");
      }
      root._astaQuery = null;
      input.value = "";
      comboFilter(root, "");
      comboChipSync(root);
      input.focus();
      emit(root, "change");
      return;
    }
    opts.forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
    root._astaQuery = null;
    comboClose(root, false);
    if (value) {
      value.value = opt.dataset.value;
      emit(value, "change");
    } else emit(root, "change");
  }
  function comboMove(root, step) {
    const list = comboEnabled(root);
    if (!list.length) return;
    const i = list.findIndex((o) => o.hasAttribute("data-active"));
    comboActive(root, list[(i + step + list.length) % list.length] || list[0]);
  }
  const comboInput = (e) => (e.target instanceof HTMLInputElement && e.target.matches("[data-asta-combo-input]") ? e.target : null);
  on("focusin", (e) => {
    const input = comboInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-combo]");
    if (root.dataset.astaCombo !== "multiple") input.select();
    comboOpen(root);
  });
  on("focusout", (e) => {
    const root = near(e, "[data-asta-combo]");
    if (root && !root.contains(e.relatedTarget)) comboClose(root, true);
  });
  on("input", (e) => {
    const input = comboInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-combo]");
    root._astaQuery = input.value;
    comboOpen(root);
    comboFilter(root, input.value);
    comboActive(root, comboEnabled(root)[0]);
  });
  on("keydown", (e) => {
    const input = comboInput(e);
    if (!input) return;
    const root = input.closest("[data-asta-combo]");
    const open = root.hasAttribute("data-open");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!open) comboOpen(root);
      else comboMove(root, e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      if (!open) return;
      comboPick(root, root.querySelector('[role="option"][data-active]:not([hidden])'));
    } else if (e.key === "Escape") {
      if (!open && root._astaQuery == null) return;
      comboClose(root, false);
    } else if (e.key === "Backspace" && root.dataset.astaCombo === "multiple" && !input.value) {
      const chips = root.querySelectorAll("[data-asta-combo-chip]");
      const last = chips[chips.length - 1];
      if (!last) return;
      const opt = combo(root).opts.find((o) => o.dataset.value === last.dataset.astaComboChip);
      if (opt) comboPick(root, opt);
      else last.remove();
    } else return;
    e.preventDefault();
  });
  on("pointerdown", (e) => {
    const t = el(e);
    if (!t) return;
    if (t.closest('[data-asta-combo] [role="listbox"]') || t.closest("[data-asta-combo-toggle]") || t.closest("[data-asta-combo-remove]")) {
      // Keep focus in the field.
      e.preventDefault();
      return;
    }
    const box = t.matches("[data-asta-combo-box]") ? t : null;
    if (box) {
      e.preventDefault();
      const root = box.closest("[data-asta-combo]");
      combo(root).input.focus();
      comboOpen(root);
    }
  });
  on("pointermove", (e) => {
    const opt = near(e, '[data-asta-combo] [role="option"]');
    if (opt && !opt.hasAttribute("data-active") && opt.getAttribute("aria-disabled") !== "true") comboActive(opt.closest("[data-asta-combo]"), opt);
  });
  on("click", (e) => {
    const opt = near(e, '[data-asta-combo] [role="option"]');
    if (opt) return comboPick(opt.closest("[data-asta-combo]"), opt);
    const toggle = near(e, "[data-asta-combo-toggle]");
    if (toggle) {
      const root = toggle.closest("[data-asta-combo]");
      if (root.hasAttribute("data-open")) comboClose(root, false);
      else {
        combo(root).input.focus();
        comboOpen(root);
      }
      return;
    }
    const rm = near(e, "[data-asta-combo-remove]");
    if (rm) {
      const root = rm.closest("[data-asta-combo]");
      const chip = rm.closest("[data-asta-combo-chip]");
      const opt = combo(root).opts.find((o) => o.dataset.value === chip.dataset.astaComboChip);
      if (opt) comboPick(root, opt);
      else {
        chip.remove();
        comboChipSync(root);
        emit(root, "change");
      }
    }
  });

  /* ---------- DatePicker ---------- */

  const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const month0 = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const addMonths = (d, n) => {
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
  };
  const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDay = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };

  function dp(root) {
    if (root._astaDp) return root._astaDp;
    const locale = root.dataset.locale || "en-US";
    let fmt, title, full, wd, wdl;
    try {
      fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
      title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
      full = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      wd = new Intl.DateTimeFormat(locale, { weekday: "short" });
      wdl = new Intl.DateTimeFormat(locale, { weekday: "long" });
    } catch {
      return dp(Object.assign(root, { dataset: Object.assign(root.dataset, { locale: "en-US" }) }));
    }
    const s = {
      range: root.dataset.astaDate === "range",
      week: Number(root.dataset.week) || 0,
      min: parseDay(root.dataset.min),
      max: parseDay(root.dataset.max),
      fmt,
      title,
      full,
      wd,
      wdl,
      start: null,
      end: null,
      single: null,
      view: null,
      focus: null,
      hover: null,
      today: null,
    };
    const v = root.querySelector("[data-asta-date-value]").value;
    if (s.range) {
      const [a, b] = v.split("/");
      s.start = parseDay(a);
      s.end = s.start ? parseDay(b) : null;
    } else s.single = parseDay(v);
    root._astaDp = s;
    return s;
  }
  const dpOff = (s, d) => (s.min && d < s.min) || (s.max && d > s.max) || false;
  const dpClamp = (s, d) => (s.min && d < s.min ? s.min : s.max && d > s.max ? s.max : d);
  function dpText(root) {
    const s = dp(root);
    const t = root.querySelector("[data-asta-date-text]");
    let shown = null;
    if (s.range) {
      if (s.start && s.end) shown = s.fmt.formatRange ? s.fmt.formatRange(s.start, s.end) : `${s.fmt.format(s.start)} – ${s.fmt.format(s.end)}`;
      else if (s.start) shown = `${s.fmt.format(s.start)} – …`;
    } else if (s.single) shown = s.fmt.format(s.single);
    t.textContent = shown ?? root.dataset.placeholder ?? "";
    t.classList.toggle("text-ink", !!shown);
    t.classList.toggle("text-mute", !shown);
  }
  const DP_NAV =
    "flex h-8 w-8 items-center justify-center rounded-md text-ink-2 outline-none transition-[background-color,transform] duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 disabled:pointer-events-none disabled:opacity-35";
  const DP_DAY =
    "relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[13px] tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-30";
  const dpCanFlip = (s, n) => {
    const to = addMonths(s.view, n);
    return !(s.min && to < month0(s.min)) && !(s.max && to > month0(s.max));
  };
  // Build the month. dir slides the grid in from the side the user paged to.
  function dpRender(root, dir) {
    const s = dp(root);
    const cal = root.querySelector("[data-asta-date-cal]");
    const lead = (s.view.getDay() - s.week + 7) % 7;
    const first = addDays(s.view, -lead);
    const arrow = (d) =>
      `<button type="button" data-dp-flip="${d}" aria-label="${d === 1 ? "Next month" : "Previous month"}" class="${DP_NAV}"${dpCanFlip(s, d) ? "" : " disabled"}><svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "m10 3.5L5.5 8l4.5 4.5"}"/></svg></button>`;
    const weekdays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 10, 1 + ((i + s.week) % 7));
      return `<span class="py-1 text-center text-[11px] font-medium text-mute" title="${esc(s.wdl.format(d))}">${esc(s.wd.format(d))}</span>`;
    }).join("");
    // 6 weeks, always, so the popover never changes height between months.
    const cells = Array.from({ length: 42 }, (_, i) => {
      const d = addDays(first, i);
      const k = key(d);
      return `<div role="gridcell" class="relative" data-dp-cell="${k}"><span aria-hidden="true" data-dp-band class="absolute inset-y-0 hidden bg-[color-mix(in_srgb,var(--brand)_11%,transparent)]"></span><button type="button" data-dp-day="${k}" tabindex="-1" aria-label="${esc(s.full.format(d))}" class="${DP_DAY} ${d.getMonth() === s.view.getMonth() ? "text-ink" : "text-mute"}"${dpOff(s, d) ? " disabled" : ""}><span class="relative">${d.getDate()}</span></button></div>`;
    }).join("");
    const today = s.today && !dpOff(s, s.today);
    cal.innerHTML =
      `<div class="mb-2 flex items-center justify-between gap-2 pl-2"><p aria-live="polite" class="text-[14px] font-medium tracking-[-0.01em] text-ink">${esc(s.title.format(s.view))}</p><div class="flex gap-0.5">${arrow(-1)}${arrow(1)}</div></div>` +
      `<div class="grid grid-cols-7 pb-1" aria-hidden="true">${weekdays}</div>` +
      `<div class="overflow-hidden"><div role="grid" aria-label="${esc(s.title.format(s.view))}" data-dp-grid class="grid grid-cols-7 gap-y-0.5 ${dir === 1 ? "asta-dp-next" : dir === -1 ? "asta-dp-prev" : ""}">${cells}</div></div>` +
      `<div class="mt-2 flex items-center justify-between gap-2 pl-2"><p class="text-[12px] tabular-nums text-mute" data-dp-status></p><div class="flex gap-1"><button type="button" data-dp-clear class="h-7 rounded-md px-2.5 text-[12px] font-medium text-ink-2 outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50">Clear</button>${
        today
          ? '<button type="button" data-dp-today class="h-7 rounded-md bg-paper-2 px-2.5 text-[12px] font-medium text-ink outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_8%,var(--paper-2))] focus-visible:ring-2 focus-visible:ring-brand/50">Today</button>'
          : ""
      }</div></div>`;
    dpPaint(root, true);
  }
  // Apply picked, band, today and focus to the cells already built, so hovering never rebuilds the month.
  function dpPaint(root, fresh) {
    const s = dp(root);
    const preview = s.range && s.start && !s.end ? s.hover || s.focus : null;
    const from = s.start;
    const to = s.end || (preview && s.start && preview > s.start ? preview : null);
    root.querySelectorAll("[data-dp-cell]").forEach((cell) => {
      const d = parseDay(cell.dataset.dpCell);
      const b = cell.lastElementChild;
      const picked = s.range ? same(d, s.start) || same(d, s.end) : same(d, s.single);
      const inBand = !!(from && to && d >= from && d <= to && !same(from, to));
      const band = cell.firstElementChild;
      band.classList.toggle("hidden", !inBand);
      band.classList.toggle("left-1/2", inBand && same(d, from));
      band.classList.toggle("right-1/2", inBand && same(d, to));
      band.classList.toggle("left-0", inBand && !same(d, from));
      band.classList.toggle("right-0", inBand && !same(d, to));
      band.classList.toggle("opacity-70", !s.end);
      cell.setAttribute("aria-selected", String(picked || inBand));
      const inMonth = d.getMonth() === s.view.getMonth();
      b.classList.toggle("font-medium", picked);
      b.classList.toggle("text-white", picked);
      b.classList.toggle("text-ink", !picked && inMonth);
      b.classList.toggle("text-mute", !picked && !inMonth);
      b.classList.toggle("hover:bg-paper-2", !picked);
      let fill = b.querySelector("[data-dp-fill]");
      if (picked && !fill) {
        fill = document.createElement("span");
        fill.dataset.dpFill = "";
        fill.setAttribute("aria-hidden", "true");
        fill.className = `absolute inset-0 rounded-lg bg-brand shadow-[0_4px_10px_-4px_color-mix(in_srgb,var(--brand)_70%,transparent)]${fresh ? "" : " asta-dp-pop"}`;
        b.prepend(fill);
      } else if (!picked) fill?.remove();
      const isToday = same(d, s.today);
      let dot = b.querySelector("[data-dp-dot]");
      if (isToday && !dot) {
        dot = document.createElement("span");
        dot.dataset.dpDot = "";
        dot.setAttribute("aria-hidden", "true");
        b.append(dot);
      }
      if (dot) dot.className = `absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${picked ? "bg-white" : "bg-brand"}`;
      if (isToday) b.setAttribute("aria-current", "date");
      b.tabIndex = same(d, s.focus) ? 0 : -1;
    });
    const status = root.querySelector("[data-dp-status]");
    if (status)
      status.textContent =
        s.range && s.start && !s.end ? "Pick an end date" : s.range && s.start && s.end ? `${Math.round((s.end - s.start) / 864e5) + 1} days` : "";
  }
  function dpFocusDay(root) {
    const s = dp(root);
    root.querySelector(`[data-dp-day="${key(s.focus)}"]`)?.focus({ preventScroll: true });
  }
  function dpOpen(root) {
    const s = dp(root);
    const trigger = root.querySelector("[data-asta-date-trigger]");
    if (trigger.disabled) return;
    s.today = day0(new Date());
    const anchor = dpClamp(s, (s.range ? s.start : s.single) || s.today);
    s.view = month0(anchor);
    s.focus = anchor;
    s.hover = null;
    root.querySelector("[data-asta-date-cal]").hidden = false;
    root.setAttribute("data-open", "");
    trigger.setAttribute("aria-expanded", "true");
    dpRender(root, 0);
    dpFocusDay(root);
  }
  function dpClose(root, refocus) {
    if (!root.hasAttribute("data-open")) return;
    root.querySelector("[data-asta-date-cal]").hidden = true;
    root.removeAttribute("data-open");
    const trigger = root.querySelector("[data-asta-date-trigger]");
    trigger.setAttribute("aria-expanded", "false");
    if (refocus) trigger.focus();
  }
  function dpMove(root, d, steer) {
    const s = dp(root);
    const next = dpClamp(s, d);
    if (next.getFullYear() !== s.view.getFullYear() || next.getMonth() !== s.view.getMonth()) {
      const dir = next > s.view ? 1 : -1;
      s.view = month0(next);
      s.focus = next;
      dpRender(root, dir);
    } else {
      s.focus = next;
      dpPaint(root, false);
    }
    if (steer) dpFocusDay(root);
  }
  function dpFlip(root, n, steer) {
    const s = dp(root);
    if (!dpCanFlip(s, n)) return;
    s.view = addMonths(s.view, n);
    s.view = month0(s.view);
    s.focus = dpClamp(s, addMonths(s.focus, n));
    dpRender(root, n > 0 ? 1 : -1);
    if (steer) dpFocusDay(root);
  }
  function dpSave(root) {
    const s = dp(root);
    const input = root.querySelector("[data-asta-date-value]");
    const v = s.range ? (s.start && s.end ? `${key(s.start)}/${key(s.end)}` : "") : s.single ? key(s.single) : "";
    dpText(root);
    if (input.value === v) return;
    input.value = v;
    emit(input, "change");
  }
  function dpPick(root, d) {
    const s = dp(root);
    if (dpOff(s, d)) return;
    if (!s.range) {
      s.single = d;
      dpSave(root);
      dpClose(root, true);
      return;
    }
    if (!s.start || s.end || d < s.start) {
      s.start = d;
      s.end = null;
    } else s.end = d;
    dpSave(root);
    if (s.end) dpClose(root, true);
    else {
      s.focus = d;
      dpPaint(root, false);
      dpFocusDay(root);
    }
  }
  on("click", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-date]");
    // A click outside closes any open calendar.
    for (const r of document.querySelectorAll("[data-asta-date][data-open]")) if (r !== root) dpClose(r, false);
    if (!root) return;
    if (t.closest("[data-asta-date-trigger]")) return root.hasAttribute("data-open") ? dpClose(root, false) : dpOpen(root);
    const day = t.closest("[data-dp-day]");
    if (day) return dpPick(root, parseDay(day.dataset.dpDay));
    const flip = t.closest("[data-dp-flip]");
    if (flip) return dpFlip(root, Number(flip.dataset.dpFlip), false);
    if (t.closest("[data-dp-clear]")) {
      const s = dp(root);
      s.single = s.start = s.end = null;
      dpSave(root);
      return dpClose(root, true);
    }
    if (t.closest("[data-dp-today]")) dpMove(root, dp(root).today, true);
  });
  on("pointerover", (e) => {
    const day = near(e, "[data-asta-date] [data-dp-day]");
    if (!day) return;
    const root = day.closest("[data-asta-date]");
    const s = dp(root);
    if (!s.range || !s.start || s.end) return;
    s.hover = parseDay(day.dataset.dpDay);
    dpPaint(root, false);
  });
  on("keydown", (e) => {
    const t = el(e);
    const root = t?.closest("[data-asta-date]");
    if (!root) return;
    if (t.matches("[data-asta-date-trigger]") && e.key === "ArrowDown" && !root.hasAttribute("data-open")) {
      e.preventDefault();
      return dpOpen(root);
    }
    if (!t.closest("[data-asta-date-cal]")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      return dpClose(root, true);
    }
    if (!t.matches("[data-dp-day]")) return;
    const s = dp(root);
    const f = s.focus;
    const dow = (f.getDay() - s.week + 7) % 7;
    if (e.key === "ArrowRight") dpMove(root, addDays(f, 1), true);
    else if (e.key === "ArrowLeft") dpMove(root, addDays(f, -1), true);
    else if (e.key === "ArrowDown") dpMove(root, addDays(f, 7), true);
    else if (e.key === "ArrowUp") dpMove(root, addDays(f, -7), true);
    else if (e.key === "Home") dpMove(root, addDays(f, -dow), true);
    else if (e.key === "End") dpMove(root, addDays(f, 6 - dow), true);
    else if (e.key === "PageDown") dpFlip(root, e.shiftKey ? 12 : 1, true);
    else if (e.key === "PageUp") dpFlip(root, e.shiftKey ? -12 : -1, true);
    else if (e.key === "Enter" || e.key === " ") dpPick(root, f);
    else return;
    e.preventDefault();
  });
  on("focusin", (e) => {
    const day = near(e, "[data-asta-date] [data-dp-day]");
    if (!day) return;
    const root = day.closest("[data-asta-date]");
    const s = dp(root);
    const d = parseDay(day.dataset.dpDay);
    if (!same(d, s.focus)) {
      s.focus = d;
      dpPaint(root, false);
    }
  });

  /* ---------- FileUpload ---------- */

  const fmtBytes = (n) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);
  const accepts = (file, accept) => {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
      .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a));
  };
  const extOf = (name) => {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(i + 1, i + 5).toUpperCase() : "FILE";
  };
  function uploadSync(root) {
    const input = root.querySelector("[data-asta-upload-input]");
    const list = root.querySelector("[data-asta-upload-list]");
    const files = root._astaFiles || [];
    try {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    } catch {}
    const rows = [...list.children];
    rows.forEach((li) => !files.includes(li._astaFile) && li.remove());
    const have = new Set(rows.map((li) => li._astaFile));
    const tpl = root.querySelector("template[data-asta-upload-tpl]");
    for (const f of files) {
      if (have.has(f)) continue;
      const li = tpl.content.firstElementChild.cloneNode(true);
      li._astaFile = f;
      li.querySelector("[data-ext]").textContent = extOf(f.name);
      li.querySelector("[data-file-name]").textContent = f.name;
      li.querySelector("[data-file-meta]").textContent = fmtBytes(f.size);
      li.querySelector("[role=progressbar]").setAttribute("aria-label", `${f.name} upload`);
      li.querySelector("[data-asta-upload-remove]").setAttribute("aria-label", `Remove ${f.name}`);
      list.append(li);
    }
  }
  function uploadError(root, msg) {
    const p = root.querySelector("[data-asta-upload-error]");
    p.querySelector("[data-asta-upload-error-text]").textContent = msg || "";
    if (msg) {
      p.hidden = true;
      void p.offsetWidth;
    }
    p.hidden = !msg;
  }
  function uploadAdd(root, list) {
    const input = root.querySelector("[data-asta-upload-input]");
    if (input.disabled) return;
    const incoming = [...list];
    if (!incoming.length) return;
    const multiple = input.multiple;
    const current = root._astaFiles || [];
    const maxFiles = Number(root.dataset.maxFiles) || 0;
    const maxSize = Number(root.dataset.maxSize) || 0;
    // A single-file input replaces what is there, so only a multiple list counts existing files.
    const room = maxFiles ? Math.max(0, maxFiles - (multiple ? current.length : 0)) : Infinity;
    const rejected = [];
    const ok = [];
    for (const f of multiple ? incoming : incoming.slice(0, 1)) {
      if (!accepts(f, root.dataset.accept)) rejected.push(`${f.name} isn't an accepted file type.`);
      else if (maxSize && f.size > maxSize) rejected.push(`${f.name} is over ${fmtBytes(maxSize)}.`);
      else if (ok.length >= room) rejected.push(`Only ${maxFiles} file${maxFiles === 1 ? "" : "s"} allowed.`);
      else ok.push(f);
    }
    uploadError(root, rejected.length ? (rejected.length === 1 ? rejected[0] : `${rejected[0]} ${rejected.length - 1} more skipped.`) : "");
    if (ok.length) root._astaFiles = multiple ? [...current, ...ok] : ok;
    uploadSync(root);
  }
  on("change", (e) => {
    const input = e.target instanceof HTMLInputElement && e.target.matches("[data-asta-upload-input]") ? e.target : null;
    if (!input || input._astaSyncing) return;
    // The picker replaces the input's files. Merge them into the list instead.
    uploadAdd(input.closest("[data-asta-upload]"), input.files);
  });
  on("click", (e) => {
    const rm = near(e, "[data-asta-upload-remove]");
    if (!rm) return;
    const root = rm.closest("[data-asta-upload]");
    const f = rm.closest("li")._astaFile;
    root._astaFiles = (root._astaFiles || []).filter((x) => x !== f);
    uploadError(root, "");
    uploadSync(root);
  });
  ["dragenter", "dragleave", "dragover", "drop"].forEach((type) =>
    on(type, (e) => {
      const zone = near(e, "[data-asta-upload-zone]");
      if (!zone) return;
      e.preventDefault();
      const root = zone.closest("[data-asta-upload]");
      if (root.querySelector("[data-asta-upload-input]").disabled) return;
      if (type === "dragenter") {
        zone._astaDepth = (zone._astaDepth || 0) + 1;
        zone.setAttribute("data-over", "");
      } else if (type === "dragleave") {
        zone._astaDepth = Math.max(0, (zone._astaDepth || 0) - 1);
        if (!zone._astaDepth) zone.removeAttribute("data-over");
      } else if (type === "dragover") {
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      } else {
        zone._astaDepth = 0;
        zone.removeAttribute("data-over");
        if (e.dataTransfer) uploadAdd(root, e.dataTransfer.files);
      }
    }),
  );
  // htmx reports upload progress on the element that sent the request. Show it on the rows of the uploads inside.
  const uploadsFor = (e) => {
    const t = el(e);
    if (!t) return [];
    const scope = t.closest("form") || t;
    return [...scope.querySelectorAll("[data-asta-upload]"), ...(t.closest("[data-asta-upload]") ? [t.closest("[data-asta-upload]")] : [])];
  };
  on("htmx:xhr:progress", (e) => {
    const { loaded, total } = e.detail || {};
    if (!total) return;
    const p = Math.min(1, loaded / total);
    for (const root of uploadsFor(e))
      for (const li of root.querySelectorAll("[data-asta-upload-list] > li")) {
        li.dataset.status = "uploading";
        li.querySelector("[data-file-bar]").style.transform = `scaleX(${p})`;
        li.querySelector("[data-file-meta]").textContent = `${Math.round(p * 100)}%`;
        li.querySelector("[role=progressbar]").setAttribute("aria-valuenow", String(Math.round(p * 100)));
      }
  });
  on("htmx:afterRequest", (e) => {
    for (const root of uploadsFor(e))
      for (const li of root.querySelectorAll('[data-asta-upload-list] > li[data-status="uploading"]')) {
        const ok = e.detail?.successful;
        li.dataset.status = ok ? "done" : "error";
        li.querySelector("[data-file-meta]").textContent = ok ? fmtBytes(li._astaFile.size) : "Failed";
      }
  });

  /* ---------- InlineEdit ---------- */

  const inline = (root) => ({
    view: root.querySelector("[data-asta-inline-view]"),
    input: root.querySelector("[data-asta-inline-input]"),
    sizer: root.querySelector("[data-asta-inline-sizer]"),
    text: root.querySelector("[data-asta-inline-text]"),
    tick: root.querySelector("[data-asta-inline-tick]"),
    status: root.querySelector("[data-asta-inline-status]"),
  });
  function inlineOpen(root) {
    const { view, input, sizer, tick } = inline(root);
    if (view.disabled || root.hasAttribute("data-editing")) return;
    input.value = input.dataset.saved || "";
    sizer.textContent = `${input.value || input.placeholder} `;
    root.removeAttribute("data-failed");
    clearTimeout(root._astaTick);
    tick.classList.add("hidden");
    tick.classList.remove("asta-inline-tick");
    root.setAttribute("data-editing", "");
    input.focus();
    input.select();
  }
  function inlineClose(root, keepFocus) {
    const { view, input } = inline(root);
    root._astaSaving = null;
    input.readOnly = false;
    root.removeAttribute("data-editing");
    root.removeAttribute("data-failed");
    if (keepFocus) view.focus();
  }
  function inlineCancel(root, keepFocus) {
    if (root._astaSaving) return;
    const { input } = inline(root);
    input.value = input.dataset.saved || "";
    inlineClose(root, keepFocus);
    emit(input, "asta:cancel");
  }
  function inlineDone(root, next, keepFocus) {
    const { view, input, text, tick, status } = inline(root);
    const label = input.getAttribute("aria-label") || "";
    input.dataset.saved = next;
    input.value = next;
    text.textContent = next || input.placeholder;
    view.classList.toggle("text-ink", !!next);
    view.classList.toggle("text-mute", !next);
    view.setAttribute("aria-label", `${label}: ${next || input.placeholder}. Edit`);
    inlineClose(root, keepFocus);
    tick.classList.remove("hidden");
    replay(tick, "asta-inline-tick");
    status.textContent = "Saved";
    clearTimeout(root._astaTick);
    root._astaTick = setTimeout(() => {
      tick.classList.add("hidden");
      tick.classList.remove("asta-inline-tick");
      status.textContent = "";
    }, 1700);
  }
  function inlineSave(root, keepFocus) {
    if (root._astaSaving || !root.hasAttribute("data-editing")) return;
    const { input, status } = inline(root);
    const next = input.value.trim();
    const cur = (input.dataset.saved || "").trim();
    // Nothing changed: just close. Empty but required: drop the edit and keep the old text.
    if (next === cur) return inlineClose(root, keepFocus);
    if (root.hasAttribute("data-required") && !next) return inlineCancel(root, keepFocus);
    input.value = next;
    // With hx-trigger="asta:save" the server saves it: keep the field open until the request lands.
    const server = window.htmx && /asta:save/.test(input.getAttribute("hx-trigger") || input.getAttribute("data-hx-trigger") || "");
    if (!server) {
      emit(input, "asta:save", { value: next });
      return inlineDone(root, next, keepFocus);
    }
    root._astaSaving = { next, keepFocus };
    input.readOnly = true;
    const done = (e) => {
      if (e.target !== input) return;
      input.removeEventListener("htmx:afterRequest", done);
      if (!root.isConnected || !root._astaSaving) return;
      if (e.detail?.successful) return inlineDone(root, next, root._astaSaving.keepFocus);
      root._astaSaving = null;
      input.readOnly = false;
      root.setAttribute("data-failed", "");
      status.textContent = "Couldn't save. Try again or press Escape.";
      requestAnimationFrame(() => input.focus());
    };
    input.addEventListener("htmx:afterRequest", done);
    emit(input, "asta:save", { value: next });
  }
  on("click", (e) => {
    const view = near(e, "[data-asta-inline-view]");
    if (view) inlineOpen(view.closest("[data-asta-inline]"));
  });
  on("keydown", (e) => {
    const input = e.target instanceof HTMLInputElement && e.target.matches("[data-asta-inline-input]") ? e.target : null;
    if (!input) return;
    const root = input.closest("[data-asta-inline]");
    if (e.key === "Enter") {
      e.preventDefault();
      inlineSave(root, true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      inlineCancel(root, true);
    }
  });
  on("input", (e) => {
    const input = e.target instanceof HTMLInputElement && e.target.matches("[data-asta-inline-input]") ? e.target : null;
    if (!input) return;
    const root = input.closest("[data-asta-inline]");
    inline(root).sizer.textContent = `${input.value || input.placeholder} `;
    root.removeAttribute("data-failed");
  });
  on("focusout", (e) => {
    const input = e.target instanceof HTMLInputElement && e.target.matches("[data-asta-inline-input]") ? e.target : null;
    if (!input) return;
    const root = input.closest("[data-asta-inline]");
    if (!root.hasAttribute("data-editing") || root._astaSaving) return;
    if (root.hasAttribute("data-cancel-on-blur")) inlineCancel(root, false);
    else inlineSave(root, false);
  });

  /* ---------- Boot and htmx ---------- */

  function scan(scope) {
    for (const r of scope.querySelectorAll("[data-asta-password]")) if (r.querySelector("[data-asta-password-input]")?.value) passwordCheck(r);
    for (const r of scope.querySelectorAll("[data-asta-date]")) if (!r._astaDp && r.dataset.locale && r.dataset.locale !== "en-US") dpText(r);
    for (const r of scope.querySelectorAll("[data-asta-otp]")) otpPaint(r);
  }
  const boot = () => scan(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("htmx:afterSettle", (e) => scan(e.detail?.elt?.parentElement || document));
})();
