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

  const OS_COPY = {
    mac: { label: "macOS detected", href: "blog/mac-trackpad-not-working.html", link: "Mac trackpad not working? Read the fix guide →" },
    windows: { label: "Windows detected", href: "blog/windows-touchpad-not-working.html", link: "Windows touchpad not working? Read the fix guide →" },
    ios: { label: "iOS device detected", href: null, link: null },
    android: { label: "Android device detected", href: null, link: null },
    linux: { label: "Linux detected", href: null, link: null },
    other: { label: null, href: null, link: null }
  };

  const os = detectOS();
  const osBanner = document.getElementById("os-banner");
  if (osBanner && OS_COPY[os].label) {
    osBanner.textContent = OS_COPY[os].label;
    osBanner.hidden = false;
  }

  document.querySelectorAll("[data-os-link]").forEach(function (el) {
    const info = OS_COPY[os];
    if (info.href) {
      el.href = info.href;
      el.textContent = info.link;
      el.hidden = false;
    }
  });

  /* ---------- Canvas trail + input testing ---------- */
  const canvas = document.getElementById("test-canvas");
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

  const COLORS = ["#3860ff", "#ff5d73", "#14a35c", "#e0b23a", "#a259ff", "#00b3c6"];
  function colorForId(id) {
    const n = typeof id === "number" ? id : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return COLORS[Math.abs(n) % COLORS.length];
  }

  // active pointers: id -> {x,y,downX,downY,downTime,dragging,color,points:[{x,y,age}]}
  const pointers = new Map();

  const state = {
    move: false,
    click: false,
    rightClick: false,
    doubleClick: false,
    drag: false,
    scrollV: false,
    scrollH: false,
    pinch: false,
    multiTouch: false
  };

  function markDetected(key) {
    if (state[key]) return;
    state[key] = true;
    const item = document.querySelector('[data-check="' + key + '"]');
    if (item) item.classList.add("detected");
  }

  function setReadout(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* Pointer events cover mouse, touch, and pen uniformly */
  canvas.addEventListener("pointerdown", function (e) {
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
    if (pointers.size > 1) markDetected("multiTouch");
  });

  canvas.addEventListener("pointermove", function (e) {
    const p = pointers.get(e.pointerId);
    setReadout("ro-coords", Math.round(e.offsetX) + ", " + Math.round(e.offsetY));
    if (!p) {
      markDetected("move");
      return;
    }
    markDetected("move");
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
  canvas.addEventListener("pointerdown", function () {
    setReadout("ro-active", String(pointers.size));
  });

  canvas.addEventListener("dblclick", function () {
    markDetected("doubleClick");
  });

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    markDetected("rightClick");
  });

  /* Scroll + pinch/zoom via wheel. Trackpads report pinch as wheel+ctrlKey
     in Chromium/Firefox; Safari also fires gesture* events for pinch. */
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

  /* Safari-only pinch gesture events */
  canvas.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  canvas.addEventListener("gesturechange", function (e) {
    e.preventDefault();
    markDetected("pinch");
    setReadout("ro-wheel", "gesture scale " + e.scale.toFixed(2));
  });

  /* ---------- Render loop: fading trails ---------- */
  function frame() {
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(127,127,127,0.06)";
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

  /* ---------- Reset ---------- */
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      Object.keys(state).forEach(function (k) { state[k] = false; });
      document.querySelectorAll(".check-item.detected").forEach(function (el) {
        el.classList.remove("detected");
      });
      pointers.clear();
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    });
  }
})();
