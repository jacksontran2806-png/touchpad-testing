(function () {
  "use strict";

  /* ---------- OS auto-detect ---------- */
  function detectOS() {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    if (/Mac/i.test(platform) && !/iPhone|iPad|iPod/i.test(ua)) return "mac";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return "windows";
    if (/Android/i.test(ua)) return "android";
    if (/Linux/i.test(platform)) return "linux";
    return "other";
  }

  const OS_LABEL = {
    mac: "macOS detected",
    windows: "Windows detected",
    ios: "iOS device detected",
    android: "Android device detected",
    linux: "Linux detected",
    other: null
  };

  const os = detectOS();
  const osBanner = document.getElementById("os-banner");
  if (osBanner && OS_LABEL[os]) {
    osBanner.textContent = OS_LABEL[os];
    osBanner.hidden = false;
  }

  /* ============================================================
     TOUCHPAD TEST
     ============================================================ */
  (function touchpadTest() {
    const canvas = document.getElementById("test-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const emptyState = document.getElementById("canvas-empty-state");
    let emptyStateHidden = false;
    function hideEmptyState() {
      if (emptyStateHidden || !emptyState) return;
      emptyStateHidden = true;
      emptyState.classList.add("is-hidden");
    }

    const COLORS = ["#2f6fed", "#e0546b", "#17a673", "#d98c12", "#8b5cf6", "#0891b2"];
    function colorForId(id) {
      const n = typeof id === "number" ? id : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
      return COLORS[Math.abs(n) % COLORS.length];
    }

    const pointers = new Map();
    const state = { move: false, click: false, rightClick: false, doubleClick: false, drag: false, scrollV: false, scrollH: false, pinch: false };

    function markDetected(key) {
      if (state[key]) return;
      state[key] = true;
      const item = document.querySelector('[data-check="' + key + '"]');
      if (item) {
        item.classList.add("detected");
        const status = item.querySelector(".status");
        if (status) status.textContent = "Detected";
      }
    }

    function setReadout(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    canvas.addEventListener("pointerdown", function (e) {
      hideEmptyState();
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, {
        downX: e.offsetX, downY: e.offsetY,
        x: e.offsetX, y: e.offsetY,
        downTime: performance.now(),
        dragging: false,
        color: colorForId(e.pointerId),
        points: []
      });
      setReadout("ro-pointertype", e.pointerType);
      if (e.button === 2) markDetected("rightClick");
      setReadout("ro-active", String(pointers.size));
    });

    canvas.addEventListener("pointermove", function (e) {
      hideEmptyState();
      const p = pointers.get(e.pointerId);
      setReadout("ro-coords", Math.round(e.offsetX) + ", " + Math.round(e.offsetY));
      markDetected("move");
      if (!p) return;
      const dist = Math.hypot(e.offsetX - p.downX, e.offsetY - p.downY);
      if (dist > 6) {
        p.dragging = true;
        markDetected("drag");
      }
      p.x = e.offsetX;
      p.y = e.offsetY;
      p.points.push({ x: e.offsetX, y: e.offsetY, age: 0 });
      if (p.points.length > 40) p.points.shift();
    });

    function endPointer(e) {
      const p = pointers.get(e.pointerId);
      if (p) {
        const elapsed = performance.now() - p.downTime;
        const dist = Math.hypot(p.x - p.downX, p.y - p.downY);
        if (!p.dragging && dist < 6 && elapsed < 500) {
          markDetected("click");
        }
        pointers.delete(e.pointerId);
      }
      setReadout("ro-active", String(pointers.size));
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    canvas.addEventListener("dblclick", function () { markDetected("doubleClick"); });
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); markDetected("rightClick"); });

    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        markDetected("pinch");
        setReadout("ro-wheel", "pinch Δ" + e.deltaY.toFixed(1));
      } else {
        if (Math.abs(e.deltaY) > 0) markDetected("scrollV");
        if (Math.abs(e.deltaX) > 0) markDetected("scrollH");
        setReadout("ro-wheel", "dx " + e.deltaX.toFixed(1) + " / dy " + e.deltaY.toFixed(1));
      }
    }, { passive: false });

    canvas.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    canvas.addEventListener("gesturechange", function (e) {
      e.preventDefault();
      markDetected("pinch");
      setReadout("ro-wheel", "gesture scale " + e.scale.toFixed(2));
    });

    function frame() {
      const rect = canvas.getBoundingClientRect();
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(90,100,120,0.07)";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.restore();

      pointers.forEach(function (p) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.dragging ? 3 : 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        p.points.forEach(function (pt, i) {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const resetBtn = document.getElementById("reset-touchpad");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        Object.keys(state).forEach(function (k) { state[k] = false; });
        document.querySelectorAll(".check-item.detected").forEach(function (el) {
          el.classList.remove("detected");
          const status = el.querySelector(".status");
          if (status) status.textContent = "Waiting";
        });
        pointers.clear();
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        emptyStateHidden = false;
        if (emptyState) emptyState.classList.remove("is-hidden");
      });
    }
  })();

  /* ============================================================
     KEYBOARD LAYOUT BUILDERS — shared by the keyboard test and the
     ghosting/NKRO test, so the on-screen board isn't built twice.
     ============================================================ */
  const KB = (function keyboardBuilders() {
    const BASE_LABELS = {
      KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R", KeyT: "T", KeyY: "Y", KeyU: "U", KeyI: "I", KeyO: "O", KeyP: "P",
      KeyA: "A", KeyS: "S", KeyD: "D", KeyF: "F", KeyG: "G", KeyH: "H", KeyJ: "J", KeyK: "K", KeyL: "L", Semicolon: ";", Quote: "'",
      KeyZ: "Z", KeyX: "X", KeyC: "C", KeyV: "V", KeyB: "B", KeyN: "N", KeyM: "M", Comma: ",", Period: ".", Slash: "/"
    };

    const LAYOUTS = {
      qwerty: {},
      qwertz: { KeyY: "Z", KeyZ: "Y" },
      azerty: { KeyQ: "A", KeyW: "Z", KeyA: "Q", KeyZ: "W", KeyM: ",", Semicolon: "M", Comma: ";", Period: ":", Slash: "!" },
      dvorak: {
        KeyQ: "'", KeyW: ",", KeyE: ".", KeyR: "P", KeyT: "Y", KeyY: "F", KeyU: "G", KeyI: "C", KeyO: "R", KeyP: "L",
        KeyA: "A", KeyS: "O", KeyD: "E", KeyF: "U", KeyG: "I", KeyH: "D", KeyJ: "H", KeyK: "T", KeyL: "N", Semicolon: "S", Quote: "-",
        KeyZ: ";", KeyX: "Q", KeyC: "J", KeyV: "K", KeyB: "X", KeyN: "B", KeyM: "M", Comma: "W", Period: "V", Slash: "Z"
      }
    };

    const ALPHA_CODES = new Set(Object.keys(BASE_LABELS));

    function labelFor(layout, code) {
      return (LAYOUTS[layout] && LAYOUTS[layout][code]) || BASE_LABELS[code];
    }

    /* ---------- key/row builders ----------
       A key is {code, label, w}. `code` null means the key exists physically
       but never reaches the browser (fn), so it renders dimmed and inert.
       A {gap: true, w} cell is invisible spacing that keeps rows aligned. */
    function k(code, label, w, opts) {
      return Object.assign({ code: code, label: label, w: w || 1 }, opts || {});
    }
    function gap(w) { return { gap: true, w: w }; }

    // Every main-block row totals 15 units wide so the rows line up.
    function buildMainRows(osKind, size) {
      const mac = osKind === "mac";
      const rows = [];

      if (size === "full") {
        const fnRow = [k("Escape", mac ? "esc" : "Esc"), gap(0.5)];
        for (let i = 1; i <= 12; i++) {
          fnRow.push(k("F" + i, "F" + i));
          if (i === 4 || i === 8) fnRow.push(gap(0.5));
        }
        fnRow.push(gap(0.5)); // pad the row out to the same 15u as the rest
        rows.push(fnRow);
      }

      rows.push([
        k("Backquote", "`"), k("Digit1", "1"), k("Digit2", "2"), k("Digit3", "3"), k("Digit4", "4"),
        k("Digit5", "5"), k("Digit6", "6"), k("Digit7", "7"), k("Digit8", "8"), k("Digit9", "9"),
        k("Digit0", "0"), k("Minus", "-"), k("Equal", "="),
        k("Backspace", mac ? "⌫" : "Bksp", 2)
      ]);

      rows.push([
        k("Tab", mac ? "tab" : "Tab", 1.5),
        k("KeyQ", "Q"), k("KeyW", "W"), k("KeyE", "E"), k("KeyR", "R"), k("KeyT", "T"),
        k("KeyY", "Y"), k("KeyU", "U"), k("KeyI", "I"), k("KeyO", "O"), k("KeyP", "P"),
        k("BracketLeft", "["), k("BracketRight", "]"), k("Backslash", "\\", 1.5)
      ]);

      rows.push([
        k("CapsLock", mac ? "caps" : "Caps", 1.75),
        k("KeyA", "A"), k("KeyS", "S"), k("KeyD", "D"), k("KeyF", "F"), k("KeyG", "G"),
        k("KeyH", "H"), k("KeyJ", "J"), k("KeyK", "K"), k("KeyL", "L"),
        k("Semicolon", ";"), k("Quote", "'"),
        k("Enter", mac ? "return" : "Enter", 2.25)
      ]);

      rows.push([
        k("ShiftLeft", mac ? "⇧" : "Shift", 2.25),
        k("KeyZ", "Z"), k("KeyX", "X"), k("KeyC", "C"), k("KeyV", "V"), k("KeyB", "B"),
        k("KeyN", "N"), k("KeyM", "M"), k("Comma", ","), k("Period", "."), k("Slash", "/"),
        k("ShiftRight", mac ? "⇧" : "Shift", 2.75)
      ]);

      if (mac) {
        rows.push([
          k(null, "fn"),
          k("ControlLeft", "⌃"), k("AltLeft", "⌥"), k("MetaLeft", "⌘", 1.25),
          k("Space", "", 8.5),
          k("MetaRight", "⌘", 1.25), k("AltRight", "⌥")
        ]);
      } else {
        rows.push([
          k("ControlLeft", "Ctrl", 1.25), k("MetaLeft", "Win", 1.25), k("AltLeft", "Alt", 1.25),
          k("Space", "", 6.25),
          k("AltRight", "Alt", 1.25), k("MetaRight", "Win", 1.25),
          k("ContextMenu", "Menu", 1.25), k("ControlRight", "Ctrl", 1.25)
        ]);
      }

      // Compact has no nav cluster, so the arrows ride along the bottom right.
      if (size === "compact") {
        rows.push([gap(10.75), k("ArrowLeft", "←"), k("ArrowUp", "↑"), k("ArrowDown", "↓"), k("ArrowRight", "→"), gap(0.25)]);
      }

      return rows;
    }

    // "space" marks a vertical gap between clusters.
    function buildNavRows(osKind) {
      if (osKind === "mac") {
        return [
          [k("F13", "F13"), k("F14", "F14"), k("F15", "F15")],
          "space",
          [k(null, "fn"), k("Home", "↖"), k("PageUp", "⇞")],
          [k("Delete", "⌦"), k("End", "↘"), k("PageDown", "⇟")],
          "space",
          [gap(1), k("ArrowUp", "↑"), gap(1)],
          [k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")]
        ];
      }
      return [
        [k("PrintScreen", "PrtSc"), k("ScrollLock", "ScrLk"), k("Pause", "Pause")],
        "space",
        [k("Insert", "Ins"), k("Home", "Home"), k("PageUp", "PgUp")],
        [k("Delete", "Del"), k("End", "End"), k("PageDown", "PgDn")],
        "space",
        [gap(1), k("ArrowUp", "↑"), gap(1)],
        [k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")]
      ];
    }

    // 4-column grid; tall/wide keys use rowSpan/colSpan.
    function buildNumpadCells(osKind) {
      if (osKind === "mac") {
        // Mac numpad: Clear instead of Num Lock, an "=" key, and no tall "+".
        return [
          k("NumLock", "⌧"), k("NumpadEqual", "="), k("NumpadDivide", "/"), k("NumpadMultiply", "*"),
          k("Numpad7", "7"), k("Numpad8", "8"), k("Numpad9", "9"), k("NumpadSubtract", "-"),
          k("Numpad4", "4"), k("Numpad5", "5"), k("Numpad6", "6"), k("NumpadAdd", "+"),
          k("Numpad1", "1"), k("Numpad2", "2"), k("Numpad3", "3"), k("NumpadEnter", "↩", 1, { rowSpan: 2 }),
          k("Numpad0", "0", 1, { colSpan: 2 }), k("NumpadDecimal", ".")
        ];
      }
      return [
        k("NumLock", "Num"), k("NumpadDivide", "/"), k("NumpadMultiply", "*"), k("NumpadSubtract", "-"),
        k("Numpad7", "7"), k("Numpad8", "8"), k("Numpad9", "9"), k("NumpadAdd", "+", 1, { rowSpan: 2 }),
        k("Numpad4", "4"), k("Numpad5", "5"), k("Numpad6", "6"),
        k("Numpad1", "1"), k("Numpad2", "2"), k("Numpad3", "3"), k("NumpadEnter", "Ent", 1, { rowSpan: 2 }),
        k("Numpad0", "0", 1, { colSpan: 2 }), k("NumpadDecimal", ".")
      ];
    }

    /* ---------- rendering ---------- */
    function makeKey(cell) {
      if (cell.gap) {
        const g = document.createElement("div");
        g.className = "kb-gap";
        g.style.flexGrow = String(cell.w);
        return g;
      }
      const el = document.createElement("div");
      el.className = "key";
      if (cell.code) el.dataset.code = cell.code;
      else {
        el.classList.add("dead");
        el.title = "Handled by the hardware — never reaches the browser";
      }
      if (cell.label.length >= 4) el.classList.add("wide-label");
      el.style.flexGrow = String(cell.w);
      if (cell.rowSpan) el.style.gridRow = "span " + cell.rowSpan;
      if (cell.colSpan) el.style.gridColumn = "span " + cell.colSpan;
      el.textContent = cell.label;
      return el;
    }

    function renderRows(container, rows) {
      rows.forEach(function (row) {
        if (row === "space") {
          const s = document.createElement("div");
          s.className = "kb-rowgap";
          container.appendChild(s);
          return;
        }
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";
        row.forEach(function (cell) { rowEl.appendChild(makeKey(cell)); });
        container.appendChild(rowEl);
      });
    }

    function section(className) {
      const el = document.createElement("div");
      el.className = "kb-section " + className;
      return el;
    }

    /* How wide each mode is in key units, so a board can be scaled to fit
       whatever space it actually has. Full size adds the nav cluster (3u) and
       numpad (4u) beside the main block (15u), plus the two 18px section gaps.
       Below `min` we stop shrinking and let the wrap scroll instead. */
    const METRICS = {
      compact: { max: 44, min: 24, gap: 6, units: 15, gaps: 14, extra: 0 },
      full: { max: 36, min: 20, gap: 5, units: 22, gaps: 19, extra: 36 }
    };

    // Watches `wrapEl` and rewrites `boardEl`'s --key-size/--key-gap to fit it.
    // `getMetrics` is called fresh on every fit so callers whose layout can
    // change at runtime (switching compact/full) stay correct; a caller with
    // one fixed layout can just return the same METRICS entry every time.
    function attachFit(boardEl, wrapEl, getMetrics) {
      let fittedTo = "";
      function fit() {
        if (!wrapEl) return;
        if (wrapEl.clientWidth <= 0) return; // hidden — refits once it's shown
        const m = getMetrics();
        const style = window.getComputedStyle(wrapEl);
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const avail = wrapEl.clientWidth - padding - 2; // keeps sub-pixel rounding from overflowing
        const raw = (avail - m.extra - m.gaps * m.gap) / m.units;
        const size = Math.max(m.min, Math.min(m.max, Math.floor(raw)));
        const next = size + "/" + m.gap;
        if (next === fittedTo) return; // no-op writes would just churn the observer
        fittedTo = next;
        boardEl.style.setProperty("--key-size", size + "px");
        boardEl.style.setProperty("--key-gap", m.gap + "px");
      }
      if (wrapEl && typeof ResizeObserver === "function") {
        new ResizeObserver(fit).observe(wrapEl);
      } else {
        window.addEventListener("resize", fit);
      }
      return fit;
    }

    return {
      ALPHA_CODES: ALPHA_CODES,
      labelFor: labelFor,
      buildMainRows: buildMainRows,
      buildNavRows: buildNavRows,
      buildNumpadCells: buildNumpadCells,
      makeKey: makeKey,
      renderRows: renderRows,
      section: section,
      METRICS: METRICS,
      attachFit: attachFit
    };
  })();

  /* ============================================================
     KEYBOARD TEST
     ============================================================ */
  (function keyboardTest() {
    const board = document.getElementById("keyboard");
    if (!board) return;

    const ALPHA_CODES = KB.ALPHA_CODES, labelFor = KB.labelFor, buildMainRows = KB.buildMainRows,
      buildNavRows = KB.buildNavRows, buildNumpadCells = KB.buildNumpadCells, makeKey = KB.makeKey,
      renderRows = KB.renderRows, section = KB.section;

    const wrap = document.querySelector(".keyboard-wrap");
    const testWrap = board.closest(".test-wrap");
    const osSelect = document.getElementById("kb-os");
    const sizeSelect = document.getElementById("kb-size");
    const layoutSelect = document.getElementById("layout-select");

    // Refits on window resize, on first layout, and when the sidebar appears/
    // disappears as the layout flips between full and compact.
    const fitBoard = KB.attachFit(board, wrap, function () {
      return KB.METRICS[sizeSelect ? sizeSelect.value : "full"] || KB.METRICS.full;
    });

    // Every code pressed since the last reset. Kept outside the DOM so the green
    // stays put when the board is rebuilt (OS / size / layout change).
    const tested = new Set();

    function applyTested() {
      tested.forEach(function (code) {
        const el = board.querySelector('[data-code="' + code + '"]');
        if (el) el.classList.add("tested");
      });
    }

    function buildBoard() {
      const osKind = osSelect ? osSelect.value : "windows";
      const size = sizeSelect ? sizeSelect.value : "full";

      board.textContent = "";
      board.className = "keyboard size-" + size;
      if (testWrap) testWrap.classList.toggle("kb-full", size === "full");

      const main = section("kb-main");
      renderRows(main, buildMainRows(osKind, size));
      board.appendChild(main);

      if (size === "full") {
        const nav = section("kb-nav");
        renderRows(nav, buildNavRows(osKind));
        board.appendChild(nav);

        const numpad = section("kb-numpad");
        const grid = document.createElement("div");
        grid.className = "kb-grid";
        buildNumpadCells(osKind).forEach(function (cell) { grid.appendChild(makeKey(cell)); });
        numpad.appendChild(grid);
        board.appendChild(numpad);
      }

      applyLayout(layoutSelect ? layoutSelect.value : "qwerty");
      applyTested();
      fitBoard();
    }

    function applyLayout(layout) {
      ALPHA_CODES.forEach(function (code) {
        const el = board.querySelector('[data-code="' + code + '"]');
        if (el) el.textContent = labelFor(layout, code);
      });
    }

    // Default the hardware picker to whatever we detected.
    if (osSelect) {
      osSelect.value = os === "mac" || os === "ios" ? "mac" : "windows";
      osSelect.addEventListener("change", buildBoard);
    }
    if (sizeSelect) sizeSelect.addEventListener("change", buildBoard);
    if (layoutSelect) {
      layoutSelect.addEventListener("change", function () { applyLayout(layoutSelect.value); });
    }
    buildBoard();

    /* ---------- typed-text readout ---------- */
    const TYPED_MAX = 2000;
    const typedEl = document.getElementById("typed-text");
    let typed = "";

    function renderTyped() {
      if (!typedEl) return;
      typedEl.classList.toggle("is-empty", typed === "");
      typedEl.textContent = typed === "" ? "Start typing — what the browser receives shows up here." : typed;
      typedEl.scrollTop = typedEl.scrollHeight;
    }

    function recordTyped(e) {
      // Shortcuts aren't typing — let Ctrl/Cmd/Alt combos through untouched.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Backspace") typed = typed.slice(0, -1);
      else if (e.key === "Enter") typed += "\n";
      else if (e.key === "Tab") typed += "\t";
      else if (e.key.length === 1) typed += e.key;
      else return;
      if (typed.length > TYPED_MAX) typed = typed.slice(-TYPED_MAX);
      renderTyped();
    }

    renderTyped();

    const clearTypedBtn = document.getElementById("clear-typed");
    if (clearTypedBtn) {
      clearTypedBtn.addEventListener("click", function () { typed = ""; renderTyped(); });
    }

    let count = 0;
    const countEl = document.getElementById("kb-count");
    const lastKeyEl = document.getElementById("kb-lastkey");
    const lastCodeEl = document.getElementById("kb-lastcode");
    const mods = document.querySelectorAll(".mod-pill");

    // F5/F11/F12 are left alone on purpose — reload, fullscreen, and devtools
    // still fire keydown first, so the key lights up either way, and swallowing
    // them would be more annoying than useful.
    const PREVENT_DEFAULT_CODES = new Set([
      "Tab", "Space", "Backspace",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "F1", "F2", "F3", "F4", "F6", "F7", "F8", "F9", "F10",
      "ContextMenu"
    ]);

    window.addEventListener("keydown", function (e) {
      if (PREVENT_DEFAULT_CODES.has(e.code)) e.preventDefault();
      recordTyped(e);

      const keyEl = board.querySelector('[data-code="' + e.code + '"]');
      if (keyEl) {
        keyEl.classList.add("pressed", "tested");
        // count is distinct keys covered, so a key already green doesn't re-count
        if (!tested.has(e.code)) {
          tested.add(e.code);
          count += 1;
          if (countEl) countEl.textContent = String(count);
        }
        if (lastKeyEl) lastKeyEl.textContent = e.key === " " ? "Space" : e.key;
        if (lastCodeEl) lastCodeEl.textContent = e.code;
      }
      mods.forEach(function (pill) {
        pill.classList.toggle("active", e.getModifierState && e.getModifierState(pill.dataset.mod));
      });
    });

    window.addEventListener("keyup", function (e) {
      const keyEl = board.querySelector('[data-code="' + e.code + '"]');
      if (keyEl) keyEl.classList.remove("pressed");
      mods.forEach(function (pill) {
        pill.classList.toggle("active", e.getModifierState && e.getModifierState(pill.dataset.mod));
      });
    });

    const resetBtn = document.getElementById("reset-keyboard");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        count = 0;
        if (countEl) countEl.textContent = "0";
        if (lastKeyEl) lastKeyEl.textContent = "–";
        if (lastCodeEl) lastCodeEl.textContent = "–";
        tested.clear();
        board.querySelectorAll(".key.pressed, .key.tested").forEach(function (el) {
          el.classList.remove("pressed", "tested");
        });
        mods.forEach(function (pill) { pill.classList.remove("active"); });
        typed = "";
        renderTyped();
      });
    }
  })();

  /* ============================================================
     MOUSE TEST
     ============================================================ */
  (function mouseTest() {
    const surface = document.getElementById("mouse-surface");
    if (!surface) return;

    const state = { "m-move": false, "m-left": false, "m-right": false, "m-middle": false, "m-double": false, "m-drag": false, "m-scroll": false, "m-back": false, "m-forward": false };

    function markDetected(key) {
      if (state[key]) return;
      state[key] = true;
      const item = document.querySelector('[data-check="' + key + '"]');
      if (item) {
        item.classList.add("detected");
        const status = item.querySelector(".status");
        if (status) status.textContent = "Detected";
      }
    }

    function setReadout(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    const BUTTON_ZONE = { 0: "left", 1: "middle", 2: "right", 3: "back", 4: "forward" };
    const BUTTON_CHECK = { 0: "m-left", 1: "m-middle", 2: "m-right", 3: "m-back", 4: "m-forward" };
    const BUTTON_NAME = { 0: "Left", 1: "Middle", 2: "Right", 3: "Back", 4: "Forward" };

    function flashZone(button) {
      const zoneName = BUTTON_ZONE[button];
      if (!zoneName) return;
      const zoneEl = surface.querySelector('[data-zone="' + zoneName + '"]');
      if (!zoneEl) return;
      zoneEl.classList.add("active");
      clearTimeout(zoneEl._flashTimer);
      zoneEl._flashTimer = setTimeout(function () { zoneEl.classList.remove("active"); }, 350);
    }

    let down = null;

    surface.addEventListener("pointerdown", function (e) {
      surface.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, time: performance.now(), dragging: false, button: e.button };
      flashZone(e.button);
      const check = BUTTON_CHECK[e.button];
      if (check) markDetected(check);
      setReadout("mo-button", BUTTON_NAME[e.button] || String(e.button));
    });

    surface.addEventListener("pointermove", function (e) {
      const rect = surface.getBoundingClientRect();
      setReadout("mo-coords", Math.round(e.clientX - rect.left) + ", " + Math.round(e.clientY - rect.top));
      markDetected("m-move");
      if (!down) return;
      const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (dist > 6) {
        down.dragging = true;
        markDetected("m-drag");
      }
    });

    function endPointer() { down = null; }
    surface.addEventListener("pointerup", endPointer);
    surface.addEventListener("pointercancel", endPointer);

    surface.addEventListener("dblclick", function () { markDetected("m-double"); });
    surface.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    surface.addEventListener("auxclick", function (e) { e.preventDefault(); });

    surface.addEventListener("wheel", function (e) {
      e.preventDefault();
      markDetected("m-scroll");
      setReadout("mo-wheel", "dx " + e.deltaX.toFixed(1) + " / dy " + e.deltaY.toFixed(1));
    }, { passive: false });

    const resetBtn = document.getElementById("reset-mouse");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        Object.keys(state).forEach(function (k) { state[k] = false; });
        document.querySelectorAll(".check-item.detected").forEach(function (el) {
          el.classList.remove("detected");
          const status = el.querySelector(".status");
          if (status) status.textContent = "Waiting";
        });
        setReadout("mo-coords", "–");
        setReadout("mo-button", "–");
        setReadout("mo-wheel", "–");
      });
    }
  })();

  /* ============================================================
     MOUSE DOUBLE-CLICK TEST
     A worn switch fires two "click" events for one physical press.
     Two genuine human clicks are essentially never under ~100ms apart,
     so a gap shorter than the chosen threshold is flagged as a misfire.
     ============================================================ */
  (function doubleClickTest() {
    const zone = document.getElementById("dc-zone");
    if (!zone) return;

    const thresholdSelect = document.getElementById("dc-threshold");
    const totalEl = document.getElementById("dc-total");
    const misfireEl = document.getElementById("dc-misfires");
    const logEl = document.getElementById("dc-log");
    const resetBtn = document.getElementById("reset-dblclick");

    let lastClickTime = 0;
    let total = 0;
    let misfires = 0;
    const LOG_MAX = 8;

    function addLogEntry(gapMs, isMisfire) {
      if (!logEl) return;
      const row = document.createElement("div");
      row.className = "click-log-row" + (isMisfire ? " is-misfire" : "");
      row.textContent = isMisfire
        ? "Misfire — " + gapMs.toFixed(1) + "ms after the previous click"
        : "Click — " + (lastClickTime === 0 ? "first click" : gapMs.toFixed(1) + "ms gap");
      logEl.prepend(row);
      while (logEl.children.length > LOG_MAX) logEl.removeChild(logEl.lastChild);
    }

    zone.addEventListener("click", function () {
      const now = performance.now();
      const threshold = thresholdSelect ? Number(thresholdSelect.value) : 50;
      const gap = now - lastClickTime;
      const isFirst = lastClickTime === 0;
      const isMisfire = !isFirst && gap < threshold;

      total += 1;
      if (totalEl) totalEl.textContent = String(total);

      if (isMisfire) {
        misfires += 1;
        if (misfireEl) misfireEl.textContent = String(misfires);
        zone.classList.add("flash-bad");
        setTimeout(function () { zone.classList.remove("flash-bad"); }, 250);
      } else {
        zone.classList.add("flash-ok");
        setTimeout(function () { zone.classList.remove("flash-ok"); }, 150);
      }
      addLogEntry(gap, isMisfire);
      lastClickTime = now;
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        total = 0;
        misfires = 0;
        lastClickTime = 0;
        if (totalEl) totalEl.textContent = "0";
        if (misfireEl) misfireEl.textContent = "0";
        if (logEl) logEl.textContent = "";
      });
    }
  })();

  /* ============================================================
     CLICKS-PER-SECOND (CPS) TEST
     ============================================================ */
  (function cpsTest() {
    const button = document.getElementById("cps-button");
    if (!button) return;

    const durationSelect = document.getElementById("cps-duration");
    const timerEl = document.getElementById("cps-timer");
    const liveCountEl = document.getElementById("cps-count");
    const labelEl = document.getElementById("cps-label");
    const resultPanel = document.getElementById("cps-result");
    const scoreEl = document.getElementById("cps-score");
    const tierEl = document.getElementById("cps-tier");
    const copyBtn = document.getElementById("cps-copy");
    const againBtn = document.getElementById("cps-again");
    const historyWrap = document.getElementById("cps-history-wrap");
    const historyEl = document.getElementById("cps-history");

    const TIERS = [
      { max: 4, label: "Below average — most people land higher with practice." },
      { max: 6, label: "Average — right around where most visitors score." },
      { max: 9, label: "Fast — solidly above average clicking speed." },
      { max: 12, label: "Very fast — competitive-gaming territory." },
      { max: Infinity, label: "Exceptional — verify it's really a finger, not a macro." }
    ];
    function tierFor(cps) {
      return TIERS.find(function (t) { return cps <= t.max; }).label;
    }

    let state = "idle"; // idle | running | finished — box clicks only start a run from idle
    let clicks = 0;
    let endAt = 0;
    let rafId = null;
    let lastResult = null;
    const history = [];

    function tick() {
      const remaining = Math.max(0, endAt - performance.now());
      if (timerEl) timerEl.textContent = (remaining / 1000).toFixed(1) + "s";
      if (remaining <= 0) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function renderHistory() {
      if (!historyEl) return;
      historyEl.innerHTML = "";
      for (let i = history.length - 1; i >= 0; i--) {
        const row = document.createElement("div");
        row.className = "click-log-row";
        row.textContent = history[i].cps.toFixed(2) + " CPS — " + history[i].duration + "s run";
        historyEl.appendChild(row);
      }
      if (historyWrap) historyWrap.hidden = history.length === 0;
    }

    function start() {
      state = "running";
      clicks = 0;
      const duration = durationSelect ? Number(durationSelect.value) : 5;
      endAt = performance.now() + duration * 1000;
      if (liveCountEl) liveCountEl.textContent = "0 clicks";
      if (resultPanel) resultPanel.hidden = true;
      if (labelEl) labelEl.textContent = "Click as fast as you can!";
      button.classList.add("is-running");
      rafId = requestAnimationFrame(tick);
    }

    function finish() {
      state = "finished";
      cancelAnimationFrame(rafId);
      const duration = durationSelect ? Number(durationSelect.value) : 5;
      const cps = clicks / duration;
      lastResult = cps;
      history.push({ cps: cps, duration: duration });
      renderHistory();
      if (labelEl) labelEl.textContent = "Press “Try again” to retry";
      button.classList.remove("is-running");
      if (timerEl) timerEl.textContent = "0.0s";
      if (resultPanel) resultPanel.hidden = false;
      if (scoreEl) scoreEl.textContent = cps.toFixed(2);
      if (tierEl) tierEl.textContent = tierFor(cps);
    }

    button.addEventListener("click", function () {
      if (state === "finished") return;
      if (state === "idle") {
        start();
        return;
      }
      clicks += 1;
      if (liveCountEl) liveCountEl.textContent = clicks + " clicks";
    });

    if (againBtn) {
      againBtn.addEventListener("click", function () {
        state = "idle";
        if (resultPanel) resultPanel.hidden = true;
        if (labelEl) labelEl.textContent = "Click to start";
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (lastResult === null) return;
        const duration = durationSelect ? Number(durationSelect.value) : 5;
        const text = "I scored " + lastResult.toFixed(2) + " CPS on the " + duration + "-second Click Speed Test! Test yours: " + location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            const original = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(function () { copyBtn.textContent = original; }, 1500);
          });
        }
      });
    }
  })();

  /* ============================================================
     KEYBOARD GHOSTING / N-KEY ROLLOVER TEST
     A browser can't detect a keypress that never sends an event, so this
     doesn't diagnose ghosting automatically — it shows exactly how many
     simultaneous keys register, so you can compare against how many
     fingers you're actually holding down.
     ============================================================ */
  (function ghostingTest() {
    const board = document.getElementById("ghost-keyboard");
    if (!board) return;

    const main = KB.section("kb-main");
    KB.renderRows(main, KB.buildMainRows("windows", "compact"));
    board.appendChild(main);
    KB.ALPHA_CODES.forEach(function (code) {
      const el = board.querySelector('[data-code="' + code + '"]');
      if (el) el.textContent = KB.labelFor("qwerty", code);
    });

    const fitBoard = KB.attachFit(board, document.querySelector(".keyboard-wrap"), function () {
      return KB.METRICS.compact;
    });
    fitBoard();

    const held = new Set();
    let maxSeen = 0;

    const currentEl = document.getElementById("ghost-current");
    const maxEl = document.getElementById("ghost-max");
    const resetBtn = document.getElementById("reset-ghosting");

    window.addEventListener("keydown", function (e) {
      if (["Tab", "Space"].indexOf(e.code) !== -1) e.preventDefault();
      const keyEl = board.querySelector('[data-code="' + e.code + '"]');
      if (keyEl) keyEl.classList.add("pressed");
      if (!held.has(e.code)) {
        held.add(e.code);
        if (currentEl) currentEl.textContent = String(held.size);
        if (held.size > maxSeen) {
          maxSeen = held.size;
          if (maxEl) maxEl.textContent = String(maxSeen);
        }
      }
    });

    window.addEventListener("keyup", function (e) {
      const keyEl = board.querySelector('[data-code="' + e.code + '"]');
      if (keyEl) keyEl.classList.remove("pressed");
      held.delete(e.code);
      if (currentEl) currentEl.textContent = String(held.size);
    });

    window.addEventListener("blur", function () {
      held.forEach(function (code) {
        const keyEl = board.querySelector('[data-code="' + code + '"]');
        if (keyEl) keyEl.classList.remove("pressed");
      });
      held.clear();
      if (currentEl) currentEl.textContent = "0";
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        maxSeen = 0;
        if (maxEl) maxEl.textContent = "0";
      });
    }
  })();

  /* ============================================================
     MOUSE SCROLL TEST
     ============================================================ */
  (function scrollTest() {
    const zone = document.getElementById("scroll-zone");
    if (!zone) return;

    const totalEl = document.getElementById("scroll-total");
    const lastDyEl = document.getElementById("scroll-last-dy");
    const lastDxEl = document.getElementById("scroll-last-dx");
    const indicator = document.getElementById("scroll-indicator");
    const track = document.getElementById("scroll-track");
    const logEl = document.getElementById("scroll-log");
    const resetBtn = document.getElementById("reset-scroll");

    let total = 0;
    let pos = 0.5; // 0 = top of track, 1 = bottom
    const LOG_MAX = 8;

    zone.addEventListener("wheel", function (e) {
      e.preventDefault();
      total += 1;
      if (totalEl) totalEl.textContent = String(total);
      if (lastDyEl) lastDyEl.textContent = e.deltaY.toFixed(1);
      if (lastDxEl) lastDxEl.textContent = e.deltaX.toFixed(1);

      if (indicator && track) {
        const trackHeight = track.clientHeight - indicator.clientHeight;
        pos = Math.min(1, Math.max(0, pos + e.deltaY / 4000));
        indicator.style.top = (pos * trackHeight) + "px";
      }

      if (logEl) {
        const row = document.createElement("div");
        row.className = "scroll-log-row";
        const big = Math.abs(e.deltaY) > 150 || Math.abs(e.deltaX) > 150;
        if (big) row.classList.add("is-flagged");
        row.textContent = "dy " + e.deltaY.toFixed(1) + " / dx " + e.deltaX.toFixed(1) + (big ? "  — large jump" : "");
        logEl.prepend(row);
        while (logEl.children.length > LOG_MAX) logEl.removeChild(logEl.lastChild);
      }
    }, { passive: false });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        total = 0;
        pos = 0.5;
        if (totalEl) totalEl.textContent = "0";
        if (lastDyEl) lastDyEl.textContent = "–";
        if (lastDxEl) lastDxEl.textContent = "–";
        if (logEl) logEl.textContent = "";
        if (indicator && track) {
          indicator.style.top = (pos * (track.clientHeight - indicator.clientHeight)) + "px";
        }
      });
    }
  })();

  /* ============================================================
     REACTION TIME TEST
     ============================================================ */
  (function reactionTimeTest() {
    const box = document.getElementById("reaction-box");
    if (!box) return;

    const statusEl = document.getElementById("reaction-status");
    const roundEl = document.getElementById("reaction-round");
    const resultPanel = document.getElementById("reaction-result");
    const avgEl = document.getElementById("reaction-avg");
    const bestEl = document.getElementById("reaction-best");
    const listEl = document.getElementById("reaction-list");
    const copyBtn = document.getElementById("reaction-copy");
    const againBtn = document.getElementById("reaction-again");

    const TOTAL_ROUNDS = 5;
    // `phase` drives what a click does next; the CSS class (set separately
    // via setVisual) only controls how the box looks — they don't always
    // match 1:1 ("early" and "between-rounds" both look idle/neutral but
    // need different click handling).
    let phase = "idle"; // idle | waiting | ready | early | between
    let round = 0;
    let times = [];
    let readyAt = 0;
    let waitTimer = null;

    function setVisual(cssState, text) {
      box.className = "reaction-box state-" + cssState;
      if (statusEl) statusEl.textContent = text;
    }

    function startRound() {
      phase = "waiting";
      if (roundEl) roundEl.textContent = "Round " + (round + 1) + " of " + TOTAL_ROUNDS;
      setVisual("waiting", "Wait for green…");
      const delay = 1500 + Math.random() * 3000;
      waitTimer = setTimeout(function () {
        phase = "ready";
        readyAt = performance.now();
        setVisual("ready", "Click now!");
      }, delay);
    }

    function finishAll() {
      phase = "idle";
      const avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
      const best = Math.min.apply(null, times);
      setVisual("idle", "Click to test again");
      if (roundEl) roundEl.textContent = "";
      if (resultPanel) resultPanel.hidden = false;
      if (avgEl) avgEl.textContent = Math.round(avg) + "ms";
      if (bestEl) bestEl.textContent = Math.round(best) + "ms";
    }

    box.addEventListener("click", function () {
      if (phase === "idle") {
        round = 0;
        times = [];
        if (resultPanel) resultPanel.hidden = true;
        if (listEl) listEl.textContent = "";
        startRound();
        return;
      }
      if (phase === "waiting") {
        clearTimeout(waitTimer);
        phase = "early";
        setVisual("early", "Too soon! Click to try this round again");
        return;
      }
      if (phase === "early") {
        startRound();
        return;
      }
      if (phase === "ready") {
        const ms = performance.now() - readyAt;
        times.push(ms);
        if (listEl) {
          const row = document.createElement("div");
          row.className = "reaction-round-row";
          row.textContent = "Round " + (round + 1) + ": " + Math.round(ms) + "ms";
          listEl.appendChild(row);
        }
        round += 1;
        if (round >= TOTAL_ROUNDS) {
          finishAll();
        } else {
          phase = "between";
          setVisual("idle", "Nice — click for the next round");
        }
        return;
      }
      if (phase === "between") {
        startRound();
      }
    });

    if (againBtn) {
      againBtn.addEventListener("click", function () {
        phase = "idle";
        if (resultPanel) resultPanel.hidden = true;
        setVisual("idle", "Click to start");
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!times.length) return;
        const avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
        const text = "My reaction time: " + Math.round(avg) + "ms average over " + TOTAL_ROUNDS + " rounds. Test yours: " + location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            const original = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(function () { copyBtn.textContent = original; }, 1500);
          });
        }
      });
    }

    setVisual("idle", "Click to start");
  })();

  /* ============================================================
     FAQ ACCORDION — smooth open/close on <details class="faq-item">
     Native <details> toggles instantly; this animates the height
     with the Web Animations API while keeping the element itself
     as the source of truth (so no-JS / reduced-motion still works).
     ============================================================ */
  (function faqAccordion() {
    const items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    items.forEach(function (item) {
      const summary = item.querySelector("summary");
      const answer = item.querySelector(".faq-answer");
      if (!summary || !answer) return;

      let animation = null;
      let isClosing = false;
      let isExpanding = false;

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (prefersReducedMotion) {
          item.open = !item.open;
          return;
        }
        item.style.overflow = "hidden";
        if (isClosing || !item.open) {
          openItem();
        } else if (isExpanding || item.open) {
          closeItem();
        }
      });

      function openItem() {
        item.style.height = item.offsetHeight + "px";
        item.open = true;
        window.requestAnimationFrame(function () { expand(); });
      }

      function expand() {
        isExpanding = true;
        const startHeight = item.offsetHeight + "px";
        const endHeight = (summary.offsetHeight + answer.offsetHeight) + "px";
        if (animation) animation.cancel();
        animation = item.animate(
          { height: [startHeight, endHeight] },
          { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        );
        animation.onfinish = function () { onFinish(true); };
        animation.oncancel = function () { isExpanding = false; };
      }

      function closeItem() {
        isClosing = true;
        const startHeight = item.offsetHeight + "px";
        const endHeight = summary.offsetHeight + "px";
        if (animation) animation.cancel();
        animation = item.animate(
          { height: [startHeight, endHeight] },
          { duration: 200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        );
        animation.onfinish = function () { onFinish(false); };
        animation.oncancel = function () { isClosing = false; };
      }

      function onFinish(open) {
        item.open = open;
        animation = null;
        isClosing = false;
        isExpanding = false;
        item.style.height = "";
        item.style.overflow = "";
      }
    });
  })();
})();
