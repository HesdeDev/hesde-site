/*
 * Hesde · interações do site.
 * Um módulo init* por área da página, cada um isolado em try/catch: um erro num módulo
 * não derruba os outros. Todo dado vem da HesdeApi (assets/data.js).
 */
(function () {
  "use strict";

  /* ================= utilidades ================= */

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const api = window.HesdeApi;
  const app = {};
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => mqReduce.matches;
  const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = () => (reduced() ? "auto" : "smooth");

  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  const esc = escapeHtml;
  const icon = (name, cls) => '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const SEV = { crit: "Crítico", high: "Alto", mid: "Médio", low: "Baixo", info: "Informativo", ok: "Conforme" };
  const badge = (sev, label) => '<span class="badge badge--' + sev + '">' + icon("sev-" + sev) + esc(label || SEV[sev]) + "</span>";
  const REASON_TONE = { "target.in_scope": "ok", "target.partially_excluded": "ok", "approval.required": "mid" };
  function reasonChip(code) {
    const t = REASON_TONE[code] || "crit";
    return '<span class="reason reason--' + t + '">' + (t === "crit" ? icon("ban") : t === "mid" ? icon("user-check") : "") + esc(code) + "</span>";
  }
  const reasons = (list) => '<div class="chips">' + list.map(reasonChip).join("") + "</div>";
  function fmtDate(iso) {
    const d = new Date(iso), p = (n) => String(n).padStart(2, "0");
    return p(d.getUTCDate()) + "/" + p(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear() + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + " UTC";
  }
  const skel = (w, h, extra) => '<div class="skel" style="width:' + w + ";height:" + (h || 12) + "px" + (extra ? ";" + extra : "") + '"></div>';

  /** Botão em carregamento: spinner no lugar do rótulo, largura mantida, aria-busy. */
  function setLoading(btn, on, label) {
    if (on) {
      btn.style.minWidth = btn.offsetWidth + "px";
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
    } else {
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      btn.style.minWidth = "";
    }
    if (label != null) btn.textContent = label;
  }
  const busy = (btn) => btn.classList.contains("is-loading");

  /** Contagem animada até `to` (tabular). Com movimento reduzido, vai direto ao valor final. */
  function countTo(el, to, dur) {
    const from = el.dataset.v != null ? Number(el.dataset.v) : parseFloat(el.textContent) || 0;
    el.dataset.v = to;
    cancelAnimationFrame(el._raf);
    if (reduced() || from === to) { el.textContent = to; return; }
    const t0 = performance.now(), d = dur || 1200;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  /** Chama cb(ativo) quando o elemento entra ou sai da tela e quando a aba muda de visibilidade. */
  function whenActive(el, cb, threshold) {
    let seen = false;
    const fire = () => cb(seen && !document.hidden);
    if (!("IntersectionObserver" in window)) { seen = true; fire(); return; }
    new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; fire(); }, { threshold: threshold || 0.15 }).observe(el);
    document.addEventListener("visibilitychange", fire);
  }
  function onceVisible(el, cb, margin) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { rootMargin: margin || "0px 0px -10% 0px" });
    io.observe(el);
  }

  /** Um único listener de scroll e resize, com rAF. */
  const frameFns = [];
  let framePending = false;
  function onFrame(fn) { frameFns.push(fn); fn(); }
  function schedule() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => { framePending = false; frameFns.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); });
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);

  /* ================= componentes compartilhados ================= */

  /** Toasts: até 3 ao mesmo tempo, somem em 4,2 s; role alert para erro. */
  function toast(msg, type) {
    const box = $("#toasts");
    if (!box) return;
    type = type || "info";
    const el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.setAttribute("role", type === "crit" ? "alert" : "status");
    el.innerHTML = icon(type === "ok" ? "sev-ok" : type === "crit" ? "sev-crit" : "sev-info") + "<div>" + esc(msg) + "</div>";
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 260); }, 4200);
  }

  /** Modal: prende o foco, fecha com Esc ou clique fora, devolve o foco ao gatilho. */
  const Modal = (function () {
    let open = null, trigger = null;
    const outside = () => $$("body > header, body > main, body > footer");
    const focusables = (root) => $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', root);
    function show(id, from) {
      const m = document.getElementById(id);
      if (!m) return;
      if (open) hide(true);
      trigger = from || document.activeElement;
      open = m;
      m.classList.add("is-open");
      m.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      outside().forEach((el) => el.setAttribute("inert", ""));
      const f = focusables(m);
      setTimeout(() => (f[0] || m).focus(), 30);
    }
    function hide(silent) {
      if (!open) return;
      open.classList.remove("is-open");
      open.setAttribute("aria-hidden", "true");
      open = null;
      outside().forEach((el) => el.removeAttribute("inert"));
      if (!$("#mobile-menu.is-open")) document.body.classList.remove("is-locked");
      if (!silent && trigger && trigger.focus) trigger.focus();
    }
    document.addEventListener("keydown", (e) => {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); hide(); return; }
      if (e.key !== "Tab") return;
      const f = focusables(open);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-modal-open]");
      if (opener) { e.preventDefault(); closeMenu(); show(opener.getAttribute("data-modal-open"), opener); return; }
      if (!open) return;
      if (e.target === open || e.target.closest("[data-modal-close]")) hide();
    });
    return { show, hide, isOpen: () => !!open };
  })();

  /** Abas ARIA: setas, Home e End; indicador de 2 px que desliza; painel entra com fade. */
  function setupTabs(list, onChange) {
    const tabs = $$('[role="tab"]', list);
    const ink = $(".tabs__ink", list);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    let cur = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    function moveInk() {
      const t = tabs[cur];
      if (!ink || !t || !t.offsetWidth) return;
      ink.style.transform = "translateX(" + t.offsetLeft + "px) scaleX(" + t.offsetWidth + ")";
    }
    function select(i, focus) {
      if (i < 0 || i >= tabs.length) return;
      if (i !== cur) {
        tabs.forEach((t, k) => {
          const on = k === i;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          panels[k].hidden = !on;
        });
        const p = panels[i];
        p.classList.remove("is-entering");
        void p.offsetWidth;
        p.classList.add("is-entering");
        cur = i;
        moveInk();
      }
      if (focus) tabs[i].focus();
      if (onChange) onChange(tabs[i].id, panels[i]);
    }
    tabs.forEach((t, k) => t.addEventListener("click", () => select(k)));
    list.addEventListener("keydown", (e) => {
      const k = tabs.indexOf(document.activeElement);
      if (k < 0) return;
      const n = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n == null) return;
      e.preventDefault();
      select((n + tabs.length) % tabs.length, true);
    });
    if ("ResizeObserver" in window) new ResizeObserver(moveInk).observe(list);
    if (document.fonts) document.fonts.ready.then(moveInk);
    requestAnimationFrame(moveInk);
    if (onChange) onChange(tabs[cur].id, panels[cur]);
    return { select: (id, focus) => select(tabs.findIndex((t) => t.id === id), focus), moveInk };
  }

  /** Segmentado como grupo de rádio ARIA, com foco itinerante. */
  function setupSeg(el, onChange) {
    el._seg = true;
    const opts = $$('[role="radio"]', el);
    function select(i, focus) {
      opts.forEach((o, k) => { o.setAttribute("aria-checked", String(k === i)); o.tabIndex = k === i ? 0 : -1; });
      if (focus) opts[i].focus();
      if (onChange) onChange(opts[i].dataset.value, i);
    }
    opts.forEach((o, k) => o.addEventListener("click", () => { if (o.getAttribute("aria-checked") !== "true") select(k); }));
    el.addEventListener("keydown", (e) => {
      const k = opts.indexOf(document.activeElement);
      if (k < 0) return;
      const n = { ArrowRight: k + 1, ArrowDown: k + 1, ArrowLeft: k - 1, ArrowUp: k - 1, Home: 0, End: opts.length - 1 }[e.key];
      if (n == null) return;
      e.preventDefault();
      select((n + opts.length) % opts.length, true);
    });
    return { select, value: () => (opts.find((o) => o.getAttribute("aria-checked") === "true") || opts[0]).dataset.value };
  }

  /** Switch ARIA (role="switch"). */
  function setupSwitch(btn, onChange) {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("aria-disabled") === "true") return;
      const on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", String(on));
      if (onChange) onChange(on);
    });
  }
  const isOn = (btn) => btn.getAttribute("aria-checked") === "true";

  let closeMenu = () => {};

  /* ================= módulos ================= */

  function initTheme() {
    const root = document.documentElement, btn = $("#theme-toggle");
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const effective = () => root.getAttribute("data-theme") || (mq.matches ? "dark" : "light");
    function sync() {
      const dark = effective() === "dark";
      root.classList.toggle("is-dark", dark);
      btn.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
      $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#191718" : "#F3EFE8"));
      document.dispatchEvent(new CustomEvent("hesde:theme"));
    }
    btn.addEventListener("click", () => {
      const next = effective() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("hesde-theme", next); } catch (e) { /* armazenamento indisponível */ }
      sync();
    });
    if (mq.addEventListener) mq.addEventListener("change", sync); else mq.addListener(sync);
    sync();
  }

  function initHeader() {
    const header = $("#header"), nav = $("#nav"), bar = $(".nav__bar", nav);
    const links = $$(".nav__link[data-nav]", nav);
    const MAP = { produto: "produto", plataforma: "plataforma", "antes-depois": "plataforma", recursos: "recursos", "como-funciona": "recursos", seguranca: "seguranca", precos: "precos", contato: "contato" };
    const sections = $$("main > section");
    let active = null;
    function moveBar() {
      const l = links.find((x) => x.dataset.nav === active);
      if (!l || !l.offsetWidth) { bar.classList.remove("is-on"); return; }
      bar.style.transform = "translateX(" + (l.offsetLeft + 10) + "px) scaleX(" + (l.offsetWidth - 20) + ")";
      bar.classList.add("is-on");
    }
    onFrame(() => {
      header.classList.toggle("is-scrolled", scrollY > 12);
      const line = innerHeight * 0.35;
      const sec = sections.find((s) => { if (s.hidden) return false; const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
      const key = sec ? MAP[sec.id] || null : null;
      if (key !== active) {
        active = key;
        links.forEach((l) => (l.dataset.nav === key ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current")));
        moveBar();
      }
    });
    if (document.fonts) document.fonts.ready.then(moveBar);

    const btn = $("#menu-btn"), menu = $("#mobile-menu");
    function setMenu(open) {
      if (open === menu.classList.contains("is-open")) return;
      menu.classList.toggle("is-open", open);
      menu.toggleAttribute("inert", !open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      $("use", btn).setAttribute("href", open ? "#i-x" : "#i-menu");
      document.body.classList.toggle("is-locked", open);
      if (open) setTimeout(() => $("a, button", menu).focus(), 60);
      else if (menu.contains(document.activeElement)) btn.focus();
    }
    closeMenu = () => setMenu(false);
    btn.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open") && !Modal.isOpen()) setMenu(false); });
    addEventListener("resize", () => { if (innerWidth > 1100) setMenu(false); });
  }

  function initReveal() {
    if (reduced() || !("IntersectionObserver" in window)) return;
    const vh = innerHeight;
    const pending = $$("[data-reveal]").filter((el) => el.getBoundingClientRect().top > vh * 0.95);
    pending.forEach((el) => {
      const sibs = Array.prototype.filter.call(el.parentElement.children, (c) => c.hasAttribute("data-reveal"));
      el.style.setProperty("--rd", Math.min(sibs.indexOf(el), 4) * 70 + "ms");
      el.classList.add("is-pending");
    });
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      io.unobserve(el);
      el.classList.add("is-revealed");
      el.classList.remove("is-pending");
      // Ao terminar, devolve o elemento ao estado normal (o hover dos cards volta a valer).
      setTimeout(() => { el.classList.remove("is-revealed"); el.style.removeProperty("--rd"); }, 700);
    }), { rootMargin: "0px 0px -8% 0px" });
    pending.forEach((el) => io.observe(el));
  }

  function initGlossary() {
    const tip = $("#tip"), map = {};
    $$("#glossary dt").forEach((dt, i) => {
      const dd = dt.nextElementSibling;
      dd.id = "gl-" + i;
      map[dt.textContent.trim()] = { text: dd.textContent.trim(), id: dd.id };
    });
    $$(".term").forEach((t) => { const g = map[t.dataset.term]; if (g) t.setAttribute("aria-describedby", g.id); });
    let cur = null;
    function show(t) {
      const g = map[t.dataset.term];
      if (!g) return;
      cur = t;
      tip.innerHTML = "<strong>" + esc(t.dataset.term) + "</strong>" + esc(g.text);
      const r = t.getBoundingClientRect(), w = Math.min(280, innerWidth - 24);
      tip.style.maxWidth = w + "px";
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = clamp(r.left + r.width / 2 - tw / 2, 12, innerWidth - tw - 12);
      let top = r.top - th - 10;
      if (top < 70) top = r.bottom + 10;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
      tip.classList.add("is-open");
    }
    function hide() { cur = null; tip.classList.remove("is-open"); }
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const t = e.target.closest && e.target.closest(".term");
      if (t && t !== cur) show(t);
    });
    document.addEventListener("pointerout", (e) => {
      if (e.pointerType !== "mouse" || !cur) return;
      const t = e.target.closest && e.target.closest(".term");
      if (t === cur && !cur.contains(e.relatedTarget) && document.activeElement !== cur) hide();
    });
    document.addEventListener("focusin", (e) => { const t = e.target.closest && e.target.closest(".term"); if (t) show(t); else if (cur) hide(); });
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".term");
      if (t) { e.preventDefault(); if (cur === t && tip.classList.contains("is-open") && e.pointerType !== "mouse") hide(); else show(t); }
      else if (cur) hide();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && cur) hide(); });
    addEventListener("scroll", () => { if (cur) hide(); }, { passive: true });
  }

  function initHero() {
    const hero = $("#inicio"), mock = $("#mock");
    if (!mock) return;
    const grid = $("#hero-grid");
    hero.addEventListener("pointermove", (e) => {
      if (!fine() || reduced() || e.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      grid.style.setProperty("--px", (-((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(1) + "px");
      grid.style.setProperty("--py", (-((e.clientY - r.top) / r.height - 0.5) * 16).toFixed(1) + "px");
    });
    hero.addEventListener("pointerleave", () => { grid.style.setProperty("--px", "0px"); grid.style.setProperty("--py", "0px"); });

    const counters = $$("[data-count]", mock);
    const index = $("#mock-index");
    const rows = $$(".mock__row", mock);
    const pointer = $("#mock-pointer"), detail = $("#mock-detail"), feed = $("#mock-feed");
    if (!reduced()) counters.forEach((c) => { c.textContent = "0"; c.dataset.v = "0"; });

    api.summary().then((sum) => {
      // Sparkline a partir da tendência.
      const t = sum.trend, max = Math.max.apply(null, t), min = Math.min.apply(null, t);
      const pts = t.map((v, i) => [(i / (t.length - 1)) * 300, 4 + ((max - v) / (max - min || 1)) * 32]);
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      $("#mock-spark-line").setAttribute("d", d);
      $("#mock-spark-area").setAttribute("d", d + " V40 H0 Z");

      let lines = [], fi = 0, row = -1;
      function feedLine(animated) {
        const el = document.createElement("div");
        el.className = "mock__feed-line" + (animated ? " is-new" : "");
        el.textContent = sum.feed[fi++ % sum.feed.length];
        el.style.transform = "translateY(" + (animated ? 72 : lines.length * 24) + "px)";
        feed.appendChild(el);
        lines.push(el);
        if (!animated) return;
        void el.offsetWidth;
        el.classList.remove("is-new");
        if (lines.length > 3) {
          const old = lines.shift();
          old.style.opacity = "0";
          old.style.transform = "translateY(-24px)";
          setTimeout(() => old.remove(), 420);
        }
        lines.forEach((l, i) => (l.style.transform = "translateY(" + i * 24 + "px)"));
      }
      function pointTo(i) {
        row = i;
        const r = rows[i];
        rows.forEach((x, k) => x.classList.toggle("is-hot", k === i));
        pointer.style.transform = "translate(" + Math.round(r.offsetWidth * 0.58) + "px," + Math.round(r.offsetTop + 20) + "px)";
        pointer.classList.add("is-on");
        detail.classList.remove("is-on");
        setTimeout(() => {
          if (row !== i) return;
          detail.textContent = sum.topFindings[i].detail;
          detail.style.setProperty("--y", r.offsetTop + r.offsetHeight + 2 + "px");
          detail.classList.add("is-on");
        }, reduced() ? 0 : 750);
      }

      if (reduced()) {
        counters.forEach((c) => countTo(c, Number(c.dataset.count)));
        $("#mock-chart").classList.add("is-in");
        $$(".badge", mock).forEach((b) => b.classList.add("is-in"));
        for (let k = 0; k < 3; k++) feedLine(false);
        pointTo(0);
        pointer.classList.remove("is-on");
        return;
      }

      let started = false, timers = [];
      const every = (fn, ms) => timers.push(setInterval(fn, ms));
      function start() {
        if (!timers.length) {
          every(() => feedLine(true), 2600);
          every(() => pointTo((row + 1) % rows.length), 3000);
          every(() => { countTo(index, sum.exposureIndexLow, 1200); setTimeout(() => countTo(index, sum.exposureIndex, 1200), 4500); }, 9000);
        }
        hero.classList.remove("is-paused");
      }
      function stop() { timers.forEach(clearInterval); timers = []; hero.classList.add("is-paused"); }
      whenActive(mock, (on) => {
        if (on && !started) {
          started = true;
          counters.forEach((c) => countTo(c, Number(c.dataset.count), 1200));
          $("#mock-chart").classList.add("is-in");
          $$(".badge", mock).forEach((b, k) => setTimeout(() => b.classList.add("is-in"), 300 + k * 260));
          for (let k = 0; k < 3; k++) feedLine(false);
          setTimeout(() => pointTo(0), 1500);
        }
        on ? start() : stop();
      }, 0.2);
    });
  }

  function initFlow() {
    const root = $("#flow");
    const tabs = $$(".flow__step", root), prog = $(".flow__progress", root), panel = $("#flow-panel");
    const swap = $$("[data-flow-swap]", root);
    let idx = 0, auto = !reduced(), timer = null, swapT = null;
    function select(i, focus) {
      i = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        t.classList.toggle("is-done", k < i);
      });
      prog.style.setProperty("--p", i / (tabs.length - 1));
      panel.setAttribute("aria-labelledby", tabs[i].id);
      if (focus) tabs[i].focus();
      idx = i;
      const t = tabs[i];
      const apply = () => {
        $("#flow-count").textContent = "Etapa " + (i + 1) + " de " + tabs.length;
        $("#flow-title").textContent = t.textContent.trim();
        $("#flow-text").textContent = t.dataset.text;
        $("#flow-out").textContent = "Saída: " + t.dataset.out;
        swap.forEach((s) => s.classList.remove("is-out"));
      };
      clearTimeout(swapT);
      if (reduced()) { apply(); return; }
      swap.forEach((s) => s.classList.add("is-out"));
      swapT = setTimeout(apply, 160);
    }
    function stopAuto() { auto = false; clearInterval(timer); timer = null; }
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => { stopAuto(); select(k); });
      t.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && fine() && k !== idx) { stopAuto(); select(k); } });
    });
    root.addEventListener("keydown", (e) => {
      const k = tabs.indexOf(document.activeElement);
      if (k < 0) return;
      const n = { ArrowRight: k + 1, ArrowDown: k + 1, ArrowLeft: k - 1, ArrowUp: k - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n == null) return;
      e.preventDefault();
      stopAuto();
      select(n, true);
    });
    whenActive(root, (on) => {
      if (on && auto && !timer) timer = setInterval(() => select(idx + 1), 3800);
      if (!on && timer) { clearInterval(timer); timer = null; }
    }, 0.4);
  }

  /* ---------- Plataforma ---------- */

  function initPlatform() {
    const loaders = {};
    const loaded = {};
    app.registerTab = (id, fn) => { loaders[id] = fn; };
    app.platform = null;
    const modules = [initDashboard, initAudit, initValidate, initScope, initTrail, initReports, initIntegrations];
    modules.forEach((fn) => { try { fn(); } catch (e) { console.error("[hesde]", fn.name, e); } });
    let ready = false;
    const load = (id) => {
      if (!ready || loaded[id] || !loaders[id]) return;
      loaded[id] = true;
      try { loaders[id](); } catch (e) { console.error("[hesde]", id, e); }
    };
    let current = "tab-dash";
    app.platform = setupTabs($("#app-tabs"), (id) => { current = id; load(id); });
    onceVisible($("#app"), () => { ready = true; load(current); }, "200px 0px");
  }

  function initDashboard() {
    const state = { query: "", severities: [], environment: "all", onlyInternet: false };
    const rows = $("#dash-rows"), empty = $("#dash-empty"), detail = $("#dash-detail"), status = $("#dash-status");
    const search = $("#dash-search"), env = $("#dash-env"), inet = $("#dash-internet"), chips = $$("#dash-sev [data-sev]");
    const bars = $("#dash-bars");
    let selected = null, req = 0, debounce = null;

    const rowSkel = "<tr aria-hidden=\"true\"><td>" + skel("70%", 14) + skel("40%", 10, "margin-top:6px") + "</td><td>" + skel("80%") + "</td><td>" + skel("60%") + "</td><td>" + skel("24px", 12, "margin:auto") + "</td><td>" + skel("72px", 22, "border-radius:999px") + "</td></tr>";

    async function load() {
      const id = ++req;
      rows.innerHTML = rowSkel.repeat(5);
      empty.hidden = true;
      status.textContent = "Carregando…";
      const res = await api.listAssets(state);
      if (id !== req) return;
      rows.innerHTML = res.items.map((a) =>
        '<tr class="is-clickable' + (a.id === selected ? " is-selected" : "") + '" tabindex="0" data-id="' + esc(a.id) + '" aria-label="' + esc(a.name + ", risco " + SEV[a.risk] + ", " + a.findings.length + " achados") + '">' +
        '<td><span class="cell-title">' + esc(a.name) + '</span><span class="cell-sub' + (a.isIp ? "" : " cell-sub--plain") + '">' + esc(a.address) + "</span></td>" +
        "<td>" + esc(a.type) + "</td>" +
        '<td><span class="row" style="gap:6px">' + esc(a.envLabel) + (a.exposure === "internet" ? '<span class="chip chip--sm">' + icon("globe") + "Internet</span>" : "") + "</span></td>" +
        '<td class="td-num">' + a.findings.length + "</td><td>" + badge(a.risk) + "</td></tr>").join("");
      empty.hidden = res.items.length > 0;
      const c = res.counts;
      countTo($('[data-kpi="crit"]'), c.crit, 600);
      countTo($('[data-kpi="high"]'), c.high, 600);
      countTo($('[data-kpi="mid"]'), c.mid, 600);
      countTo($('[data-kpi="assets"]'), res.items.length, 600);
      const vals = [c.crit, c.high, c.mid, c.low, c.ok], max = Math.max(1, Math.max.apply(null, vals));
      $$(".bars__bar", bars).forEach((b, i) => b.style.setProperty("--v", Math.max(0.04, vals[i] / max)));
      bars.classList.add("is-in");
      $("#dash-bars-text").textContent = "Na visão: " + c.crit + " críticos, " + c.high + " altos, " + c.mid + " médios, " + c.low + " baixos e " + c.ok + " ativos conformes.";
      status.textContent = res.items.length + " de " + res.total + " ativos";
    }

    async function open(id) {
      selected = id;
      $$("tr[data-id]", rows).forEach((tr) => tr.classList.toggle("is-selected", tr.dataset.id === id));
      detail.innerHTML = '<div style="display:grid;gap:10px">' + skel("70%", 16) + skel("50%") + skel("100%", 90, "margin-top:8px") + skel("100%", 60) + "</div>";
      if (matchMedia("(max-width: 900px)").matches) detail.scrollIntoView({ behavior: smooth(), block: "nearest" });
      const a = await api.getAsset(id);
      if (selected !== id) return;
      const find = a.findings.length
        ? a.findings.map((f) => '<div class="finding">' + badge(f.sev) + '<p class="finding__title">' + esc(f.title) + "</p>" +
            (f.factors.length ? '<div class="chips">' + f.factors.map((x) => '<span class="chip chip--sm">' + esc(x) + "</span>").join("") + "</div>" : "") +
            '<p class="finding__action"><strong>Ação recomendada:</strong> ' + esc(f.action) + '</p><span class="cell-sub">' + esc(f.rule) + "</span></div>").join("")
        : '<div class="finding"><p class="row">' + badge("ok") + "Nenhum achado aberto.</p></div>";
      detail.innerHTML =
        '<div class="panel-title" style="margin-bottom:2px"><h4 class="h4" style="overflow-wrap:anywhere">' + esc(a.name) + "</h4>" + badge(a.risk) + "</div>" +
        '<span class="cell-sub' + (a.isIp ? "" : " cell-sub--plain") + '">' + esc(a.address) + " · " + esc(a.type) + "</span>" +
        '<dl class="detail__facts"><dt>Ambiente</dt><dd>' + esc(a.envLabel) + "</dd><dt>Exposição</dt><dd>" + (a.exposure === "internet" ? "Exposto à internet" : "Rede interna") +
        "</dd><dt>Criticidade</dt><dd>" + a.criticality + " de 5</dd><dt>Prazo</dt><dd>" + (a.deadlineDays ? "Corrigir em " + a.deadlineDays + " dias" : "Sem prazo aberto") +
        "</dd><dt>Responsável</dt><dd>" + esc(a.owner) + "</dd><dt>Última coleta</dt><dd>" + fmtDate(a.lastSeen) + "</dd></dl>" + find +
        '<div class="detail__actions"><button class="btn btn--secondary btn--sm" type="button" data-act="ticket">' + icon("ticket", "ic--16") + 'Abrir chamado</button><button class="btn btn--primary btn--sm" type="button" data-act="validate">' + icon("flask", "ic--16") + "Validar com segurança</button></div>";
      detail._asset = a;
    }

    rows.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) open(tr.dataset.id); });
    rows.addEventListener("keydown", (e) => {
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(tr.dataset.id); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const sib = e.key === "ArrowDown" ? tr.nextElementSibling : tr.previousElementSibling;
        if (sib) sib.focus();
      }
    });
    detail.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]");
      const a = detail._asset;
      if (!b || !a || busy(b)) return;
      if (b.dataset.act === "ticket") {
        setLoading(b, true);
        await sleep(700);
        setLoading(b, false);
        toast("Chamado simulado aberto para " + a.owner + (a.deadlineDays ? ", com prazo de " + a.deadlineDays + " dias." : "."), "ok");
      } else {
        app.platform.select("tab-validate");
        $("#plataforma").scrollIntoView({ behavior: smooth(), block: "start" });
        if (app.validate && a.isIp) {
          app.validate.preselect(a);
          toast("Alvo " + a.name + " pré-selecionado no Hesde Validate.", "info");
        } else {
          toast("Este ativo não tem endereço de rede para validação. Escolha um alvo na lista.", "info");
        }
      }
    });

    search.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { state.query = search.value; load(); }, 250);
    });
    env.addEventListener("change", () => { state.environment = env.value; load(); });
    setupSwitch(inet, (on) => { state.onlyInternet = on; load(); });
    chips.forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") !== "true";
      c.setAttribute("aria-pressed", String(on));
      state.severities = chips.filter((x) => x.getAttribute("aria-pressed") === "true").map((x) => x.dataset.sev);
      load();
    }));
    $("#dash-clear").addEventListener("click", () => {
      search.value = ""; env.value = "all"; inet.setAttribute("aria-checked", "false");
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      Object.assign(state, { query: "", severities: [], environment: "all", onlyInternet: false });
      load();
      search.focus();
    });
    app.registerTab("tab-dash", load);
  }

  function initAudit() {
    const meters = $("#audit-meters"), btn = $("#audit-run"), log = $("#audit-log"), bar = $("#audit-bar"), pct = $("#audit-pct"), result = $("#audit-result");
    async function load() {
      meters.innerHTML = Array(6).fill('<div class="meters__row">' + skel("40%") + skel("32px") + '<div class="meter" style="border:0">' + skel("100%", 8) + "</div></div>").join("");
      const cov = await api.hardeningCoverage();
      meters.classList.remove("is-in");
      meters.innerHTML = cov.map((c) => '<div class="meters__row"><span>' + esc(c.area) + '</span><span class="num" style="font-weight:600">' + c.pct + '%</span><div class="meter" aria-hidden="true"><div class="meter__fill" style="--v:' + c.pct / 100 + '"></div></div></div>').join("");
      requestAnimationFrame(() => requestAnimationFrame(() => meters.classList.add("is-in")));
    }
    let t0 = 0;
    const stamp = (i) => { const s = 2 + i * 3; return "09:41:" + String(s).padStart(2, "0"); };
    function line(l, i) {
      const el = document.createElement("div");
      el.className = "log__line" + (l.sev ? " t-" + l.sev : "");
      el.innerHTML = '<span class="t-muted">' + stamp(i) + "</span>" + (l.sev ? icon("sev-" + l.sev) + "<b>[" + SEV[l.sev] + "]</b> " : "") + "<span>" + esc(l.text) + "</span>";
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    }
    btn.addEventListener("click", async () => {
      if (busy(btn)) return;
      setLoading(btn, true);
      log.innerHTML = "";
      result.innerHTML = "";
      bar.style.transform = "scaleX(0)";
      pct.textContent = "0%";
      t0++;
      const run = t0;
      try {
        const res = await api.runAudit();
        for (let i = 0; i < res.lines.length; i++) {
          await sleep(420);
          if (run !== t0) return;
          line(res.lines[i], i);
          const p = (i + 1) / res.lines.length;
          bar.style.transform = "scaleX(" + p + ")";
          pct.textContent = Math.round(p * 100) + "%";
        }
        result.innerHTML = '<div class="alert alert--ok">' + icon("sev-ok") + "<div>" + esc(res.summary) + "</div></div>";
        toast("Auditoria concluída sem alterar nenhum sistema.", "ok");
      } catch (e) {
        result.innerHTML = '<div class="alert alert--crit">' + icon("sev-crit") + "<div><strong>A auditoria não terminou.</strong> " + esc(e.message) + "</div></div>";
        toast("A auditoria não terminou.", "crit");
      } finally {
        setLoading(btn, false, "Executar de novo");
      }
    });
    app.registerTab("tab-audit", load);
  }

  function initValidate() {
    const sel = $("#val-target"), evalBtn = $("#val-eval"), decision = $("#val-decision");
    const steps = $$("#val-steps .vstep");
    const selfBtn = $("#val-approve-self"), otherBtn = $("#val-approve-other"), runBtn = $("#val-run"), nodetect = $("#val-nodetect");
    const DEFAULTS = steps.map((li) => $("[data-msg]", li).innerHTML);
    let st = {}, loaded = null;

    function setStep(n, state, html) {
      const li = steps[n - 1];
      li.className = "vstep is-" + state;
      $(".vstep__dot", li).innerHTML = state === "done" ? icon("check") : state === "denied" ? icon("x") : String(n);
      if (html != null) $("[data-msg]", li).innerHTML = html;
    }
    function reset() {
      st = { gen: (st.gen || 0) + 1 };
      steps.forEach((li, i) => setStep(i + 1, i ? "pending" : "current", DEFAULTS[i]));
      [selfBtn, otherBtn, runBtn].forEach((b) => { b.disabled = true; setLoading(b, false); });
      nodetect.removeAttribute("aria-disabled");
      decision.innerHTML = "";
    }
    function load() {
      if (loaded) return loaded;
      loaded = api.listValidateTargets().then((ts) => {
        const keep = sel.value;
        sel.innerHTML = ts.map((t) => '<option value="' + esc(t.id) + '"' + (t.assetId ? ' data-asset="' + esc(t.assetId) + '"' : "") + ">" +
          esc(t.label === t.address ? t.address + " · " + t.envLabel : t.label + " · " + t.address + " · " + t.envLabel) + "</option>").join("");
        if (keep) sel.value = keep;
      });
      return loaded;
    }
    sel.addEventListener("change", reset);

    evalBtn.addEventListener("click", async () => {
      if (busy(evalBtn) || !sel.value) return;
      reset();
      const gen = st.gen;
      setLoading(evalBtn, true);
      try {
        const d = await api.evaluatePolicy(sel.value);
        if (gen !== st.gen) return;
        st.d = d;
        const deny = d.decision === "deny";
        decision.innerHTML = '<div class="alert ' + (deny ? "alert--crit" : "alert--mid") + '">' + icon(deny ? "ban" : "user-check") + '<div><strong style="display:block;margin-bottom:6px">' +
          (deny ? "Negar" : "Exigir aprovação") + "</strong>" + reasons(d.reasons) + '<p style="margin-top:8px">' + esc(d.message) + "</p></div></div>";
        if (deny) {
          setStep(1, "denied", esc(d.message) + reasons(d.reasons));
          steps.slice(1).forEach((li, i) => setStep(i + 2, "pending"));
          $("[data-msg]", steps[1]).textContent = "Nada é executado: o pedido foi negado antes de qualquer atividade.";
          toast("Pedido negado pelo motor de política: " + d.reasons[d.reasons.length - 1] + ".", "crit");
        } else {
          setStep(1, "done", "Exigir aprovação: dentro do escopo, teto N" + d.ceiling + ". Pedido " + '<code class="mono">' + esc(d.requestDigest) + "</code>." + reasons(d.reasons));
          setStep(2, "current", d.lab ? "Laboratório: a autoaprovação é aceita com a dispensa de segregação registrada." : "Fora do laboratório, a aprovação precisa vir de um segundo operador.");
          selfBtn.disabled = otherBtn.disabled = false;
          toast("Decisão: exigir aprovação humana antes de executar.", "info");
        }
      } catch (e) {
        decision.innerHTML = '<div class="alert alert--crit">' + icon("sev-crit") + "<div><strong>Falha na avaliação.</strong> " + esc(e.message) + "</div></div>";
        toast("Falha ao avaliar o pedido.", "crit");
      } finally { setLoading(evalBtn, false); }
    });

    async function approve(self, btn) {
      if (busy(btn) || !st.d) return;
      const gen = st.gen;
      setLoading(btn, true);
      try {
        const r = await api.approve(sel.value, { self });
        if (gen !== st.gen) return;
        if (!r.ok) {
          setStep(2, "denied", '<div class="alert alert--crit">' + icon("ban") + "<div>" + reasons([r.code]) + '<p style="margin-top:6px">' + esc(r.message) + " A aprovação por um segundo operador continua disponível.</p></div></div>");
          toast("Autoaprovação negada: " + r.code + ".", "crit");
          return;
        }
        selfBtn.disabled = otherBtn.disabled = true;
        setStep(2, "done", "<p>Aprovado por " + esc(r.by) + ".</p>" + (r.waiver ? "<p>" + esc(r.waiver) + "</p>" : "") + "<p>" + esc(r.message) + "</p>" + (r.signature ? "<p>" + icon("lock", "ic--16") + " " + esc(r.signature) + "</p>" : ""));
        setStep(3, "current");
        runBtn.disabled = false;
        toast("Aprovação registrada e vinculada ao pedido.", "ok");
      } catch (e) {
        toast(e.message, "crit");
      } finally { setLoading(btn, false); }
    }
    selfBtn.addEventListener("click", () => approve(true, selfBtn));
    otherBtn.addEventListener("click", () => approve(false, otherBtn));

    setupSwitch(nodetect);
    runBtn.addEventListener("click", async () => {
      if (busy(runBtn) || runBtn.disabled) return;
      const gen = st.gen;
      nodetect.setAttribute("aria-disabled", "true");
      setLoading(runBtn, true);
      try {
        const r = await api.runValidation(sel.value, { detected: !isOn(nodetect) });
        if (gen !== st.gen) return;
        runBtn.disabled = true;
        setStep(3, "done", "<p>" + esc(r.execution.replace(r.marker + ".", "")) + '<code class="mono">' + esc(r.marker) + "</code>.</p>");
        setStep(4, "current", '<p class="muted">Consultando o SIEM e o EDR pelo marcador…</p>');
        toast("Execução segura concluída. Nada foi alterado no alvo.", "ok");
        await sleep(900);
        if (gen !== st.gen) return;
        setStep(4, r.detected ? "done" : "denied", "<p>" + esc(r.detection) + "</p>");
        if (r.detected) toast("Detecção confirmada no SIEM.", "ok");
        else toast("Lacuna de detecção registrada como achado Alto.", "crit");
        await sleep(400);
        if (gen !== st.gen) return;
        setStep(5, "done", esc(r.evidence));
        toast("Evidência registrada e ancorada na trilha.", "ok");
      } catch (e) {
        setStep(3, "denied", esc(e.message));
        toast("A execução falhou: " + e.message, "crit");
      } finally { setLoading(runBtn, false); }
    });
    $("#val-reset").addEventListener("click", () => { reset(); toast("Simulação reiniciada.", "info"); });

    app.validate = {
      preselect(asset) {
        load().then(() => {
          let opt = $('option[data-asset="' + asset.id + '"]', sel);
          if (!opt) {
            opt = document.createElement("option");
            opt.value = asset.id;
            opt.dataset.asset = asset.id;
            opt.textContent = asset.name + " · " + asset.address + " · " + asset.envLabel;
            sel.appendChild(opt);
          }
          sel.value = opt.value;
          reset();
        });
      },
    };
    app.registerTab("tab-validate", load);
  }

  function initScope() {
    const rowsEl = $("#scope-rows"), form = $("#scope-form"), input = $("#scope-input"), out = $("#scope-result"), submit = $("#scope-submit");
    async function load() {
      rowsEl.innerHTML = ("<tr aria-hidden=\"true\"><td>" + skel("64px", 20, "border-radius:999px") + "</td><td>" + skel("80%") + "</td><td>" + skel("60%") + "</td><td>" + skel("24px") + "</td></tr>").repeat(7);
      const sc = await api.getScope();
      rowsEl.innerHTML = sc.entries.map((e) => e.kind === "include"
        ? '<tr><td><span class="chip chip--sm">Inclusão</span></td><td class="mono">' + esc(e.label || e.value) + "</td><td>" + esc(e.env) + '</td><td class="td-num">N' + e.ceiling + "</td></tr>"
        : '<tr class="row-excl"><td><span class="excl-mark">' + icon("lock") + "Exclusão</span></td><td class=\"mono\">" + esc(e.value) + "</td><td>" + esc(e.env) + '</td><td class="muted">—</td></tr>').join("");
    }
    const TONE = { covered: ["ok", "sev-ok"], covered_partial: ["ok", "sev-ok"], excluded: ["crit", "ban"], out: ["crit", "ban"], invalid: ["crit", "x"] };
    let req = 0;
    async function check(value) {
      if (busy(submit)) return;
      const id = ++req;
      setLoading(submit, true);
      out.innerHTML = '<div class="verdict" style="display:grid;gap:10px">' + skel("40%", 18) + skel("70%") + skel("55%") + "</div>";
      try {
        const r = await api.checkScope(value);
        if (id !== req) return;
        const tone = TONE[r.state];
        let dl = "<dt>Entrada</dt><dd>" + esc(r.input || "—") + "</dd>";
        if (r.resolved) dl += "<dt>Resolve para</dt><dd>" + esc(r.resolved) + "</dd>";
        if (r.entry) {
          dl += "<dt>Entrada do escopo</dt><dd>" + esc(r.entry.value) + "</dd><dt>Ambiente</dt><dd>" + esc(r.entry.env) + "</dd>";
          if (r.entry.ceiling != null) dl += "<dt>Teto</dt><dd>N" + r.entry.ceiling + "</dd>";
        }
        out.innerHTML = '<div class="verdict" style="border-color:var(--' + tone[0] + '-line)"><p class="verdict__state t-' + tone[0] + '">' + icon(tone[1]) + esc(r.label) + "</p><dl>" + dl + "</dl>" + reasons(r.reasons) + (r.note ? "<p>" + esc(r.note) + "</p>" : "") + "</div>";
      } catch (e) {
        out.innerHTML = '<div class="alert alert--crit">' + icon("sev-crit") + "<div>" + esc(e.message) + "</div></div>";
      } finally { setLoading(submit, false); }
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); check(input.value); });
    $$("[data-try]").forEach((c) => c.addEventListener("click", () => { input.value = c.dataset.try; check(c.dataset.try); }));
    app.registerTab("tab-scope", load);
  }

  function initTrail() {
    const rowsEl = $("#trail-rows"), verify = $("#trail-verify"), anchor = $("#trail-anchor"), aCheck = $("#trail-anchor-check"), result = $("#trail-result");
    let tamper = "none", run = 0;
    const cell = (e, k) => '<td class="mono' + (e.tampered && e.tampered.indexOf(k) >= 0 ? " is-tampered" : "") + '">' + esc(e[k]) + "</td>";
    async function load() {
      run++;
      result.innerHTML = "";
      anchor.className = "anchor";
      aCheck.className = "trail__check";
      rowsEl.innerHTML = ("<tr aria-hidden=\"true\"><td>" + skel("70%") + "</td>" + ("<td>" + skel("80%") + "</td>").repeat(5) + "<td></td></tr>").repeat(8);
      const data = await api.listAuditEvents({ tamper });
      rowsEl.innerHTML = data.events.map((e) =>
        '<tr data-seq="' + e.seq + '"><td><span class="cell-title num">#' + e.seq + '</span><span class="cell-sub">' + esc(e.at) + "</span></td>" +
        "<td>" + esc(e.actor) + '</td><td><span class="mono">' + esc(e.action) + '</span><span class="cell-sub' + (e.tampered && e.tampered.indexOf("detail") >= 0 ? " is-tampered" : "") + '">' + esc(e.detail) + "</span></td>" +
        '<td><span class="res' + (e.result === "deny" ? " res--deny" : e.result === "allow" ? " res--allow" : "") + '">' + esc(e.result) + "</span></td>" +
        cell(e, "prev") + cell(e, "hash") + '<td><span class="trail__check" aria-hidden="true">' + icon("check") + "</span></td></tr>").join("");
    }
    setupSeg($("#trail-sim"), (v) => { tamper = v; load(); });
    verify.addEventListener("click", async () => {
      if (busy(verify)) return;
      const id = ++run;
      setLoading(verify, true);
      result.innerHTML = "";
      anchor.className = "anchor";
      aCheck.className = "trail__check";
      $$(".trail__check", rowsEl).forEach((c) => { c.className = "trail__check"; c.innerHTML = icon("check"); });
      try {
        const r = await api.verifyAuditTrail({ tamper });
        for (const s of r.steps) {
          await sleep(120);
          if (id !== run) return;
          const c = $('tr[data-seq="' + s.seq + '"] .trail__check', rowsEl);
          if (c) { c.classList.add(s.ok ? "is-ok" : "is-bad"); c.innerHTML = icon(s.ok ? "check" : "x"); }
        }
        if (r.chainOk) {
          await sleep(200);
          anchor.classList.add(r.anchorOk ? "is-ok" : "is-bad");
          aCheck.classList.add(r.anchorOk ? "is-ok" : "is-bad");
          aCheck.innerHTML = icon(r.anchorOk ? "check" : "x");
        }
        const ok = r.chainOk && r.anchorOk;
        result.innerHTML = '<div class="alert ' + (ok ? "alert--ok" : "alert--crit") + '">' + icon(ok ? "sev-ok" : "sev-crit") + "<div><strong>" + (ok ? "Íntegra." : "Adulteração detectada.") + "</strong> " + esc(r.message) + "</div></div>";
        toast(r.message, ok ? "ok" : "crit");
      } finally { setLoading(verify, false); }
    });
    $("#trail-export").addEventListener("click", () => toast("Pacote de verificação gerado (simulação).", "ok"));
    app.registerTab("tab-trail", load);
  }

  function initReports() {
    const desc = $("#rep-desc"), gen = $("#rep-gen"), stage = $("#rep-stage");
    const DESC = {
      exec: "Para diretoria e comitês: postura, tendência, riscos principais e plano de ação, sem jargão.",
      tech: "Para quem corrige: cada achado com evidência, regra, versão dos feeds e passo de correção.",
    };
    const kind = setupSeg($("#rep-kind"), (v) => {
      desc.classList.add("is-out");
      setTimeout(() => { desc.textContent = DESC[v]; desc.classList.remove("is-out"); }, reduced() ? 0 : 160);
    });
    gen.addEventListener("click", async () => {
      if (busy(gen)) return;
      const k = kind.value(), fmt = ($('input[name="rep-fmt"]:checked') || {}).value || "PDF";
      setLoading(gen, true);
      stage.innerHTML = '<div class="paper-skel" aria-label="Gerando relatório">' + skel("35%", 14) + skel("60%", 26, "margin-top:12px") + skel("100%") + skel("92%") + skel("96%") + skel("100%", 80, "margin-top:8px") + skel("80%") + skel("70%") + "</div>";
      try {
        const r = await api.generateReport(k);
        const head = '<div class="paper__head"><span class="wordmark wordmark--mini">HESDE</span><span class="paper__class">' + esc(r.classification) + "</span></div>";
        const foot = '<p class="paper__foot">Manifesto ' + esc(r.manifest) + " · assinado (Ed25519) · " + r.pages + " páginas · " + esc(fmt) + " · gerado em " + esc(r.generatedAt) + "</p>";
        const body = k === "exec"
          ? '<h4>Relatório executivo</h4><p class="small muted">Empresa Exemplo S.A. · sessão de 14/10/2026</p>' +
            '<div class="paper__kpis"><div><strong>68<small class="muted">/100</small></strong><span>Índice de exposição · <span class="t-ok">▼ 4 na semana</span></span></div><div><strong class="t-crit">4</strong><span>Exposições críticas · 2 validadas</span></div><div><strong>87%</strong><span>Controles conformes · <span class="t-ok">▲ 3 p.p.</span></span></div></div>' +
            '<p class="h4" style="margin-bottom:8px">Três decisões para este mês</p><ol><li>Exigir MFA nas contas privilegiadas do AD.</li><li>Atualizar o gateway de VPN exposto.</li><li>Bloquear o acesso público ao bucket de backups.</li></ol>'
          : '<h4>Achado 1 de 14 · Contas privilegiadas sem MFA</h4><p class="small muted">Crítico a Médio no corpo; 3 achados baixos no anexo</p>' +
            "<dl><dt>Ativo</dt><dd>dc-01.empresa.example · 198.51.100.5</dd><dt>Severidade</dt><dd>" + badge("crit") + '</dd><dt>Regra</dt><dd class="mono">windows.ad.privileged_mfa · v1.2.0</dd><dt>Evidência</dt><dd class="mono">sha256:e3b7…41d2</dd><dt>Correção</dt><dd>Exigir MFA para todas as contas dos grupos privilegiados e revisar as exceções.</dd></dl>' +
            '<p class="small">Reprodutibilidade: regras 0.4.1 · feeds de 2026-10-11 · configuração <span class="mono">sha256:58c6…2bab</span></p>';
        stage.innerHTML = '<article class="paper" aria-label="Prévia do relatório">' + head + body + foot + "</article>";
        toast("Relatório gerado: " + r.pages + " páginas, manifesto assinado.", "ok");
      } catch (e) {
        stage.innerHTML = '<div class="alert alert--crit">' + icon("sev-crit") + "<div>" + esc(e.message) + "</div></div>";
        toast("Falha ao gerar o relatório.", "crit");
      } finally { setLoading(gen, false); }
    });
  }

  function initIntegrations() {
    $$("[data-integ]").forEach((card) => {
      const btn = $("[data-connect]", card), id = card.dataset.integ, name = $(".h4", card).textContent.trim();
      let connected = false;
      btn.addEventListener("click", async () => {
        if (busy(btn)) return;
        setLoading(btn, true);
        if (connected) {
          await api.disconnectIntegration(id);
          connected = false;
          card.classList.remove("is-connected");
          btn.classList.remove("is-success");
          setLoading(btn, false, "Conectar");
          toast(name + " desconectado.", "info");
          return;
        }
        card.classList.remove("is-error");
        btn.classList.remove("is-error");
        try {
          await api.connectIntegration(id);
          connected = true;
          card.classList.add("is-connected");
          setLoading(btn, false, "");
          btn.innerHTML = icon("check", "ic--16") + 'Conectado<span class="sr-only">. Clique para desconectar</span>';
          btn.classList.add("is-success");
          toast(name + " conectado (simulação).", "ok");
        } catch (e) {
          card.classList.add("is-error");
          $("[data-err]", card).textContent = e.message;
          btn.classList.add("is-error");
          setLoading(btn, false, "Tentar de novo");
          toast(e.message, "crit");
        }
      });
    });
  }

  /* ---------- Seções ---------- */

  function initCompare() {
    const stage = $("#cmp-stage"), range = $("#cmp-range");
    let touched = false;
    const set = (v) => {
      stage.style.setProperty("--pos", v + "%");
      range.setAttribute("aria-valuetext", Math.round(v) + "% da largura: à esquerda sem Hesde, à direita com Hesde");
    };
    range.addEventListener("input", () => { touched = true; set(range.value); });
    setupSeg($("#cmp-theme"), (v) => {
      $$("[data-cmp]", stage).forEach((el) => (el.hidden = el.dataset.cmp !== v));
      $$("[data-cmp-caption]", stage).forEach((el) => (el.hidden = el.dataset.cmpCaption !== v));
    });
    set(50);
    if (reduced()) return;
    onceVisible(stage, () => {
      if (touched) return;
      const keys = [[0, 50], [450, 38], [1050, 62], [1500, 50]];
      const t0 = performance.now();
      const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      const step = (t) => {
        if (touched) return;
        const dt = t - t0;
        let i = 0;
        while (i < keys.length - 2 && dt > keys[i + 1][0]) i++;
        const a = keys[i], b = keys[i + 1], k = clamp((dt - a[0]) / (b[0] - a[0]), 0, 1);
        const v = a[1] + (b[1] - a[1]) * ease(k);
        set(v);
        range.value = Math.round(v);
        if (dt < keys[keys.length - 1][0]) requestAnimationFrame(step); else { set(50); range.value = 50; }
      };
      setTimeout(() => requestAnimationFrame(step), 300);
    }, "0px 0px -30% 0px");
  }

  function initExpanders() {
    $$(".feature__toggle, .cmp__btn").forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const label = $("span", btn);
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        panel.classList.toggle("is-open", open);
        if (label && btn.classList.contains("feature__toggle")) label.textContent = open ? "Menos detalhes" : "Detalhes";
      });
    });
    $$(".acc__btn").forEach((b) => {
      const p = document.getElementById(b.getAttribute("aria-controls"));
      b.addEventListener("click", () => {
        const open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(open));
        p.classList.toggle("is-open", open);
      });
    });
  }

  function initHow() {
    const wrap = $("#how"), fill = $(".how__fill", wrap), steps = $$(".how__step", wrap);
    if (reduced()) { fill.style.setProperty("--p", 1); steps.forEach((s) => s.classList.add("is-active")); return; }
    onFrame(() => {
      const r = wrap.getBoundingClientRect(), vh = innerHeight;
      const vertical = matchMedia("(max-width: 900px)").matches;
      const p = vertical ? (vh * 0.6 - r.top) / r.height : (vh * 0.85 - r.top) / (vh * 0.5);
      fill.style.setProperty("--p", clamp(p, 0, 1).toFixed(3));
      steps.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.82) s.classList.add("is-active"); });
    });
  }

  function initSecurity() {
    const wrap = $("#sec-tl"), fill = $(".sec-tl__fill", wrap), items = $$(".sec-tl li", wrap);
    onFrame(() => {
      const vh = innerHeight, line = vh * 0.55;
      if (reduced()) { fill.style.setProperty("--p", 1); }
      const r = wrap.getBoundingClientRect();
      if (!reduced()) fill.style.setProperty("--p", clamp((line - r.top) / r.height, 0, 1).toFixed(3));
      let cur = -1;
      items.forEach((li, i) => { if (li.getBoundingClientRect().top < line) cur = i; });
      items.forEach((li, i) => { li.classList.toggle("is-current", i === cur); li.classList.toggle("is-past", i < cur); });
    });
  }

  function initMarquee() {
    const m = $("#marquee");
    whenActive(m, (on) => m.classList.toggle("is-paused", !on), 0);
  }

  function initCarousel() {
    const root = $("#carousel"), track = $(".carousel__track", root), slides = $$(".slide", root), dots = $$(".dot", root), live = $("#carousel-live");
    const vp = $(".carousel__viewport", root);
    let i = 0;
    function go(n, announce) {
      i = (n + slides.length) % slides.length;
      track.style.transform = "translateX(" + -100 * i + "%)";
      slides.forEach((s, k) => { s.setAttribute("aria-hidden", String(k !== i)); s.toggleAttribute("inert", k !== i); });
      dots.forEach((d, k) => (k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
      if (announce) live.textContent = "Depoimento " + (i + 1) + " de " + slides.length;
    }
    $$(".carousel__arrow", root).forEach((b) => b.addEventListener("click", () => go(i + Number(b.dataset.dir), true)));
    dots.forEach((d, k) => d.addEventListener("click", () => go(k, true)));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1, true); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1, true); }
    });
    let x0 = null;
    vp.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    vp.addEventListener("pointerup", (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1), true);
    });
    vp.addEventListener("pointercancel", () => { x0 = null; });
    go(0, false);
  }

  function initPricing() {
    const paid = $$("[data-billing]");
    setupSeg($("#billing"), (v) => {
      paid.forEach((el) => {
        el.classList.add("is-out");
        setTimeout(() => { el.textContent = v === "annual" ? "Cobrança anual · condições sob consulta" : "Cobrança mensal"; el.classList.remove("is-out"); }, reduced() ? 0 : 160);
      });
    });
  }

  function initContact() {
    const form = $("#contact-form"), done = $("#contact-done"), err = $("#contact-error"), submit = $("#contact-submit");
    const msg = $("#f-message"), count = $("#f-message-count");
    const PERSONAL = ["gmail.com", "hotmail.com", "outlook.com", "live.com", "yahoo.com", "yahoo.com.br", "bol.com.br", "uol.com.br", "icloud.com", "terra.com.br"];
    const radios = $$('input[name="interest"]', form);
    const F = {
      name: { el: $("#f-name"), test: (v) => (v.trim().length >= 3 ? "" : "Informe o nome completo, com pelo menos 3 caracteres.") },
      email: { el: $("#f-email"), test: (v) => {
        v = v.trim().toLowerCase();
        if (!v) return "Informe o e-mail corporativo.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "Informe um e-mail válido, como nome@empresa.com.br.";
        return PERSONAL.indexOf(v.split("@")[1]) >= 0 ? "Use o e-mail da empresa, não um e-mail pessoal." : "";
      } },
      company: { el: $("#f-company"), test: (v) => (v.trim().length >= 2 ? "" : "Informe o nome da empresa.") },
      area: { el: $("#f-area"), test: (v) => (v ? "" : "Selecione a sua área.") },
      size: { el: $("#f-size"), test: (v) => (v ? "" : "Selecione o tamanho do ambiente.") },
      interest: { el: radios[0], wrap: $("#f-interest-field"), value: () => ((radios.find((r) => r.checked) || {}).value || ""), test: (v) => (v ? "" : "Escolha o interesse principal.") },
      consent: { el: $("#f-consent"), wrap: $("#f-consent-field"), value: () => ($("#f-consent").checked ? "1" : ""), test: (v) => (v ? "" : "É preciso concordar com o uso dos dados para o contato.") },
    };
    const touched = new Set();
    function validate(k, show) {
      const f = F[k];
      const v = f.value ? f.value() : f.el.value;
      const m = f.test(v);
      if (!show) return !m;
      const wrap = f.wrap || f.el.closest(".field");
      wrap.classList.toggle("is-invalid", !!m);
      wrap.classList.toggle("is-valid", !m && k !== "interest" && k !== "consent");
      (k === "interest" ? radios : [f.el]).forEach((el) => el.setAttribute("aria-invalid", String(!!m)));
      $(".field__msg span", wrap).textContent = m;
      return !m;
    }
    Object.keys(F).forEach((k) => {
      const els = k === "interest" ? radios : [F[k].el];
      els.forEach((el) => {
        el.addEventListener("blur", () => { if (k !== "interest" && k !== "consent") { touched.add(k); validate(k, true); } });
        el.addEventListener(el.tagName === "SELECT" || el.type === "radio" || el.type === "checkbox" ? "change" : "input", () => {
          if (k === "interest" || k === "consent") touched.add(k);
          if (touched.has(k)) validate(k, true);
        });
      });
    });
    msg.addEventListener("input", () => {
      const n = msg.value.length;
      count.textContent = n + "/600";
      count.classList.toggle("is-near", n >= 540 && n < 600);
      count.classList.toggle("is-over", n >= 600);
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy(submit)) return;
      const keys = Object.keys(F);
      keys.forEach((k) => touched.add(k));
      const bad = keys.filter((k) => !validate(k, true));
      if (bad.length) {
        F[bad[0]].el.focus();
        toast("Revise " + (bad.length === 1 ? "o campo destacado" : "os " + bad.length + " campos destacados") + " antes de enviar.", "crit");
        return;
      }
      err.hidden = true;
      const label = submit.textContent;
      setLoading(submit, true, "Enviando…");
      try {
        const payload = { name: F.name.el.value.trim(), email: F.email.el.value.trim(), company: F.company.el.value.trim(), area: F.area.el.value, size: F.size.el.value, interest: F.interest.value(), message: msg.value.trim(), consent: true };
        const r = await api.submitContact(payload);
        form.hidden = true;
        done.hidden = false;
        $("#contact-protocol").textContent = "Protocolo " + r.protocol + ". Retornamos pelo e-mail informado.";
        const chk = $(".success-check", done);
        chk.classList.remove("is-drawn");
        void chk.getBoundingClientRect();
        chk.classList.add("is-drawn");
        done.focus();
        toast("Solicitação recebida (simulação).", "ok");
      } catch (ex) {
        err.hidden = false;
        toast("Não foi possível enviar agora. Seus dados continuam no formulário.", "crit");
      } finally { setLoading(submit, false, label); }
    });
    $("#contact-again").addEventListener("click", () => {
      form.reset();
      touched.clear();
      $$(".field", form).forEach((f) => f.classList.remove("is-invalid", "is-valid"));
      $$("[aria-invalid]", form).forEach((el) => el.removeAttribute("aria-invalid"));
      count.textContent = "0/600";
      done.hidden = true;
      form.hidden = false;
      F.name.el.focus();
    });
    app.contact = {
      focus(interest) {
        if (interest) {
          const r = radios.find((x) => x.value === interest);
          if (r) { r.checked = true; if (touched.has("interest")) validate("interest", true); }
        }
        (form.hidden ? done : F.name.el).focus({ preventScroll: true });
      },
    };
  }

  function initLinks() {
    document.addEventListener("click", (e) => {
      const demo = e.target.closest("[data-demo]");
      if (demo) {
        e.preventDefault();
        closeMenu();
        if (Modal.isOpen()) Modal.hide(true);
        $("#contato").scrollIntoView({ behavior: smooth(), block: "start" });
        if (app.contact) app.contact.focus(demo.dataset.interest);
        return;
      }
      const goto = e.target.closest("[data-goto-tab]");
      if (goto && app.platform) {
        e.preventDefault();
        app.platform.select(goto.dataset.gotoTab);
        $("#plataforma").scrollIntoView({ behavior: smooth(), block: "start" });
        return;
      }
      const tbd = e.target.closest("[data-tbd]");
      if (tbd) { e.preventDefault(); toast("Link a definir na versão final do site.", "info"); }
    });
  }

  /* ---------- Sistema de design ---------- */

  function initDesignSystem() {
    const ds = $("#design-system");
    let built = false, dsTabs = null;
    function build() {
      if (built) return;
      built = true;
      const names = $$("#sprite symbol").map((s) => s.id.replace(/^i-/, ""));
      $("#ds-icons").innerHTML = names.map((n) => '<div class="icon-cell">' + icon(n) + "<span>" + esc(n) + "</span></div>").join("");
      dsTabs = setupTabs($("#ds-tabs"));
      $$("[data-seg]", ds).forEach((el) => { if (!el._seg) setupSeg(el); });
      requestAnimationFrame(() => $("#ds-charts").classList.add("is-in"));
      measure();
    }
    function open(scroll) {
      ds.hidden = false;
      build();
      if (dsTabs) dsTabs.moveInk();
      if (scroll) ds.scrollIntoView({ behavior: smooth(), block: "start" });
    }
    $("#ds-open").addEventListener("click", (e) => { e.preventDefault(); open(true); try { history.replaceState(null, "", "#design-system"); } catch (x) { /* file:// */ } $("#ds-title").setAttribute("tabindex", "-1"); $("#ds-title").focus({ preventScroll: true }); });
    $("#ds-close").addEventListener("click", () => { ds.hidden = true; $("#grid-overlay").hidden = true; $("#ds-grid").setAttribute("aria-checked", "false"); });

    // Contraste medido no tema ativo.
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;transition:none";
    document.body.appendChild(probe);
    const read = (v) => { probe.style.color = "var(" + v + ")"; const m = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
    const over = (c, b) => ({ r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a), a: 1 });
    const lum = (c) => [c.r, c.g, c.b].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    function measure() {
      if (!built) return;
      const surface = read("--surface");
      $$(".pair", ds).forEach((p) => {
        const bg = over(read(p.dataset.bg), surface), fg = over(read(p.dataset.fg), bg);
        const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const need = p.hasAttribute("data-large") ? 3 : 4.5, ok = ratio >= need;
        p.style.background = "rgb(" + [bg.r, bg.g, bg.b].map(Math.round).join(",") + ")";
        p.style.color = "rgb(" + [fg.r, fg.g, fg.b].map(Math.round).join(",") + ")";
        let r = $(".pair__ratio", p);
        if (!r) { r = document.createElement("span"); r.className = "pair__ratio"; p.appendChild(r); }
        r.textContent = ratio.toFixed(2).replace(".", ",") + ":1 · " + (ok ? (need === 3 ? "AA texto grande" : "AA") : "abaixo de AA");
        r.classList.toggle("is-fail", !ok);
      });
    }
    document.addEventListener("hesde:theme", () => setTimeout(measure, 30));

    setupSwitch($("#ds-grid"), (on) => { $("#grid-overlay").hidden = !on; });
    setupSwitch($("#ds-fail"), (on) => {
      api.settings.failSubmit = on;
      toast(on ? "O próximo envio do formulário de contato vai falhar." : "Envio do formulário restaurado.", "info");
    });
    $$("[data-switch]", ds).forEach((s) => setupSwitch(s));
    const motion = $("#ds-motion");
    $("#ds-motion-btn").addEventListener("click", () => {
      motion.style.setProperty("--w", Math.max(40, motion.offsetWidth - 150) + "px");
      motion.classList.toggle("is-run");
    });
    $("#ds-load-btn").addEventListener("click", (e) => {
      const b = e.currentTarget;
      if (busy(b)) return;
      setLoading(b, true);
      setTimeout(() => setLoading(b, false), 1500);
    });
    $$("[data-toast]", ds).forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.toast;
      toast(t === "ok" ? "Ação concluída com sucesso." : t === "crit" ? "Algo deu errado. Tente de novo." : "Informação para o operador.", t);
    }));
    $$("[data-toggle-press]", ds).forEach((b) => b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"))));
    $("#ds-check-btn").addEventListener("click", () => {
      const c = $("#ds-check");
      c.classList.remove("is-drawn");
      void c.getBoundingClientRect();
      c.classList.add("is-drawn");
    });
    $("#ds-check").classList.add("is-drawn");
    $$("[data-counter]", ds).forEach((t) => {
      const c = document.getElementById(t.dataset.counter);
      t.addEventListener("input", () => { c.textContent = t.value.length + "/" + t.maxLength; });
    });
    const fromHash = () => { if (location.hash === "#design-system") open(true); };
    addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* ================= inicialização ================= */

  const MODULES = [initTheme, initHeader, initReveal, initGlossary, initHero, initFlow, initPlatform, initCompare, initExpanders, initHow, initSecurity, initMarquee, initCarousel, initPricing, initContact, initLinks, initDesignSystem];
  MODULES.forEach((fn) => {
    try { fn(); } catch (e) { console.error("[hesde] falha em " + fn.name, e); }
  });
})();
