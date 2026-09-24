// Sito Inspector Rules — content script.
// Draws Firefox-devtools-style dashed guide lines from the hovered element's
// edges across the whole viewport, plus a box highlight and a tag/size label.
(() => {
  if (window.__sitoRules) return; // already injected, background sends toggle
  const api = typeof browser !== "undefined" ? browser : chrome;

  const state = { on: false, el: null, pinned: false, root: null, parts: null };

  function build() {
    const root = document.createElement("div");
    root.id = "sito-rules-root";
    const mk = (cls) => {
      const d = document.createElement("div");
      d.className = cls;
      root.appendChild(d);
      return d;
    };
    const parts = {
      top: mk("sito-rules-line h"),
      bottom: mk("sito-rules-line h"),
      left: mk("sito-rules-line v"),
      right: mk("sito-rules-line v"),
      margin: mk("sito-rules-margin"),
      padding: mk("sito-rules-padding"),
      box: mk("sito-rules-box"),
      label: mk("sito-rules-label"),
    };
    parts.label.innerHTML =
      '<span class="tag"></span><span class="dim"></span><span class="pin" hidden>pinned</span>';
    document.documentElement.appendChild(root);
    state.root = root;
    state.parts = parts;
  }

  const px = (v) => parseFloat(v) || 0;

  function describe(el) {
    let s = `<span class="tag">${el.tagName.toLowerCase()}</span>`;
    if (el.id) s += `<span class="id">#${el.id}</span>`;
    if (typeof el.className === "string" && el.className.trim()) {
      const cls = el.className.trim().split(/\s+/).slice(0, 3);
      s += `<span class="cls">.${cls.join(".")}</span>`;
    }
    return s;
  }

  function draw() {
    const { el, parts } = state;
    if (!el || !el.isConnected) return hide();
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const set = (n, x, y, w, h) => {
      n.style.transform = `translate(${x}px, ${y}px)`;
      n.style.width = w + "px";
      n.style.height = h + "px";
    };

    parts.top.style.transform = `translateY(${r.top}px)`;
    parts.bottom.style.transform = `translateY(${r.bottom}px)`;
    parts.left.style.transform = `translateX(${r.left}px)`;
    parts.right.style.transform = `translateX(${r.right}px)`;

    // margin area (drawn under box)
    const mt = px(cs.marginTop), mr = px(cs.marginRight), mb = px(cs.marginBottom), ml = px(cs.marginLeft);
    set(parts.margin, r.left - ml, r.top - mt, r.width + ml + mr, r.height + mt + mb);
    parts.margin.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${mt}px, ${ml}px ${mt}px, ${ml}px calc(100% - ${mb}px), calc(100% - ${mr}px) calc(100% - ${mb}px), calc(100% - ${mr}px) ${mt}px, 0 ${mt}px)`;

    // padding area
    const pt = px(cs.paddingTop), pr = px(cs.paddingRight), pb = px(cs.paddingBottom), pl = px(cs.paddingLeft);
    set(parts.padding, r.left, r.top, r.width, r.height);
    parts.padding.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${pt}px, ${pl}px ${pt}px, ${pl}px calc(100% - ${pb}px), calc(100% - ${pr}px) calc(100% - ${pb}px), calc(100% - ${pr}px) ${pt}px, 0 ${pt}px)`;

    set(parts.box, r.left, r.top, r.width, r.height);

    // label
    parts.label.innerHTML =
      describe(el) +
      `<span class="dim">${Math.round(r.width * 100) / 100} × ${Math.round(r.height * 100) / 100}</span>` +
      (state.pinned ? '<span class="pin">📌 pinned</span>' : "");

    const lw = parts.label.offsetWidth, lh = parts.label.offsetHeight;
    let lx = r.left, ly = r.top - lh - 4;
    if (ly < 0) ly = r.bottom + 4;
    if (ly + lh > innerHeight) ly = Math.max(0, r.top + 4);
    lx = Math.min(Math.max(0, lx), innerWidth - lw);
    parts.label.style.transform = `translate(${lx}px, ${ly}px)`;
    state.root.style.display = "";
  }

  function hide() {
    if (state.root) state.root.style.display = "none";
  }

  function pick(x, y) {
    state.root.style.display = "none";
    let el = document.elementFromPoint(x, y);
    state.root.style.display = "";
    return el;
  }

  function onMove(e) {
    if (state.pinned) return;
    const el = pick(e.clientX, e.clientY);
    if (!el || el === document.documentElement || state.root.contains(el)) return hide();
    state.el = el;
    draw();
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.pinned) {
      state.pinned = false;
      state.el = pick(e.clientX, e.clientY);
    } else if (state.el) {
      state.pinned = true;
    }
    draw();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOn(false);
    }
  }

  function onScroll() { if (state.el) draw(); }

  function setOn(on) {
    if (on === state.on) return;
    state.on = on;
    if (on) {
      if (!state.root) build();
      state.pinned = false;
      document.documentElement.classList.add("sito-rules-active");
      addEventListener("mousemove", onMove, true);
      addEventListener("click", onClick, true);
      addEventListener("keydown", onKey, true);
      addEventListener("scroll", onScroll, true);
      addEventListener("resize", onScroll, true);
      hide();
    } else {
      document.documentElement.classList.remove("sito-rules-active");
      removeEventListener("mousemove", onMove, true);
      removeEventListener("click", onClick, true);
      removeEventListener("keydown", onKey, true);
      removeEventListener("scroll", onScroll, true);
      removeEventListener("resize", onScroll, true);
      state.el = null;
      hide();
    }
    try {
      const p = api.runtime.sendMessage({ type: "sito-rules-state", on });
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }

  // devtools.js marks the element selected in the Elements panel ($0).
  // While guides are on, pin them to that element.
  const MARK = "data-sito-rules-target";
  new MutationObserver((muts) => {
    for (const m of muts) {
      const el = m.target;
      if (!(el instanceof Element) || !el.hasAttribute(MARK)) continue;
      el.removeAttribute(MARK);
      if (!state.on || state.root?.contains(el)) continue;
      state.el = el;
      state.pinned = true;
      draw();
    }
  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: [MARK] });

  api.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "sito-rules-toggle") setOn(!state.on);
  });

  window.__sitoRules = { setOn };
})();
