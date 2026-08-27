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

  /* ---------- Device tab switcher ---------- */
  const tabs = document.querySelectorAll(".device-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.getAttribute("data-panel");
      tabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      document.querySelectorAll(".test-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.id === "panel-" + target);
      });
    });
  });

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
      const item = document.querySelector('#panel-touchpad [data-check="' + key + '"]');
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
        document.querySelectorAll("#panel-touchpad .check-item.detected").forEach(function (el) {
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
     KEYBOARD TEST
     ============================================================ */
  (function keyboardTest() {
    const board = document.getElementById("keyboard");
    if (!board) return;

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

    const panel = document.getElementById("panel-keyboard");
    const wrap = document.querySelector(".keyboard-wrap");
    const osSelect = document.getElementById("kb-os");
    const sizeSelect = document.getElementById("kb-size");
    const layoutSelect = document.getElementById("layout-select");

    /* How wide each mode is in key units, so the board can be scaled to fit
       whatever space it actually has. Full size adds the nav cluster (3u) and
       numpad (4u) beside the main block (15u), plus the two 18px section gaps.
       Below `min` we stop shrinking and let .keyboard-wrap scroll instead. */
    const KB_METRICS = {
      compact: { max: 44, min: 24, gap: 6, units: 15, gaps: 14, extra: 0 },
      full: { max: 36, min: 20, gap: 5, units: 22, gaps: 19, extra: 36 }
    };

    let fittedTo = "";

    function fitBoard() {
      if (!wrap) return;
      if (wrap.clientWidth <= 0) return; // panel is hidden — the observer refits when it shows
      const m = KB_METRICS[sizeSelect ? sizeSelect.value : "full"] || KB_METRICS.full;
      const style = window.getComputedStyle(wrap);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const avail = wrap.clientWidth - padding - 2; // 2px keeps sub-pixel rounding from overflowing
      const raw = (avail - m.extra - m.gaps * m.gap) / m.units;
      const size = Math.max(m.min, Math.min(m.max, Math.floor(raw)));
      const next = size + "/" + m.gap;
      if (next === fittedTo) return; // no-op writes would just churn the observer
      fittedTo = next;
      board.style.setProperty("--key-size", size + "px");
      board.style.setProperty("--key-gap", m.gap + "px");
    }

    // Refits on window resize, on tab switch (hidden -> visible), and when the
    // sidebar appears/disappears as the layout flips between full and compact.
    if (wrap && typeof ResizeObserver === "function") {
      new ResizeObserver(fitBoard).observe(wrap);
    } else {
      window.addEventListener("resize", fitBoard);
    }

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
      if (panel) panel.classList.toggle("kb-full", size === "full");

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

    function isKeyboardPanelActive() {
      const panel = document.getElementById("panel-keyboard");
      return panel && panel.classList.contains("active");
    }

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
      if (!isKeyboardPanelActive()) return;
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
      const item = document.querySelector('#panel-mouse [data-check="' + key + '"]');
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
        document.querySelectorAll("#panel-mouse .check-item.detected").forEach(function (el) {
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
})();
