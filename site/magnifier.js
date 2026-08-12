/* ============================================================
   Image Magnifier — vanilla port of the Originkit component.
   The drawing logic, the cover/contain placement maths and the
   lens transform are kept identical to the original; only the
   React wrapper (useRef / useEffect) is replaced by a plain
   factory, because this site has no React and no build step.

   Originkit preset props: { focusY: 14, zoom: 2 }
   ============================================================ */
(function (global) {
  const DEFAULTS = {
    fit: 'cover',
    focusY: 14,          // Originkit preset
    zoom: 2,             // Originkit preset
    lensSize: 80,
    rim: false,
    rimOptions: { color: '#0A0A0C', width: 6 }
  };

  const clampFocus = v => Math.min(100, Math.max(0, typeof v === 'number' ? v : 50));

  function createMagnifier(canvas, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const rimColor = (o.rimOptions && o.rimOptions.color) || DEFAULTS.rimOptions.color;
    const rimWidth = o.rim ? ((o.rimOptions && o.rimOptions.width) || 0) : 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return { destroy() {} };

    let alive = true, raf = 0, dpr = 1;
    let cssW = 0, cssH = 0;
    let placed = { dx: 0, dy: 0, dw: 0, dh: 0 };
    let img = null, hovering = false;
    const lens = { x: 0, y: 0 };

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      /* Measure the CSS box, never the intrinsic attribute size. Reading
         clientWidth when CSS does not constrain the canvas feeds the
         attribute back into itself and the ResizeObserver grows it without
         bound, so the measurement is taken from the layout box and clamped. */
      const r = canvas.getBoundingClientRect();
      let w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) {
        const p = canvas.parentElement;
        w = (p && p.clientWidth) || 600;
        h = Math.round(w * 9 / 16);
      }
      w = Math.max(1, Math.min(w, 4096));
      h = Math.max(1, Math.min(h, 4096));

      if (w !== cssW || h !== cssH || !canvas.width) {
        cssW = w; cssH = h;
        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const cw = canvas.width, ch = canvas.height;
      if (!img) { placed = { dx: 0, dy: 0, dw: cw, dh: ch }; return; }

      const iw = img.naturalWidth  || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = o.fit === 'contain'
        ? Math.min(cw / iw, ch / ih)
        : Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (cw - dw) / 2;
      const f  = o.fit === 'cover' ? clampFocus(o.focusY) / 100 : 0.5;
      placed = { dx, dy: (ch - dh) * f, dw, dh };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!img) return;
      ctx.drawImage(img, placed.dx, placed.dy, placed.dw, placed.dh);
      if (!hovering) return;

      const lx = lens.x * dpr, ly = lens.y * dpr;
      const r  = o.lensSize * dpr;
      const z  = Math.max(1, o.zoom);

      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        lx - (lx - placed.dx) * z,
        ly - (ly - placed.dy) * z,
        placed.dw * z,
        placed.dh * z
      );
      ctx.restore();

      if (!o.rim || rimWidth <= 0) return;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.lineWidth = rimWidth * dpr;
      ctx.strokeStyle = rimColor;
      ctx.stroke();
    }

    function loop() { if (!alive) return; draw(); raf = requestAnimationFrame(loop); }

    function onImage(x, y) {
      if (!img) return false;
      return x >= placed.dx / dpr && x <= (placed.dx + placed.dw) / dpr &&
             y >= placed.dy / dpr && y <= (placed.dy + placed.dh) / dpr;
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width  > 0 ? cssW / rect.width  : 1;
      const sy = rect.height > 0 ? cssH / rect.height : 1;
      const x = (e.clientX - rect.left) * sx;
      const y = (e.clientY - rect.top)  * sy;
      lens.x = x; lens.y = y;
      hovering = onImage(x, y);
      canvas.style.cursor = hovering ? 'none' : 'default';
      if (hovering && e.pointerType === 'touch') e.preventDefault();
    }
    function onLeave() { hovering = false; canvas.style.cursor = 'default'; }

    const loading = new Image();
    loading.onload = () => { if (alive) { img = loading; layout(); } };
    loading.src = o.src;

    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    layout();

    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(loop);

    return {
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
      }
    };
  }

  /* auto-wire: <canvas class="magnify" data-src="..." data-zoom="4" data-fit="contain"> */
  function autoInit() {
    document.querySelectorAll('canvas.magnify').forEach(cv => {
      if (cv.dataset.bound) return;
      cv.dataset.bound = '1';
      createMagnifier(cv, {
        src: cv.dataset.src,
        fit: cv.dataset.fit || 'contain',
        focusY: cv.dataset.focusy !== undefined ? +cv.dataset.focusy : 14,
        zoom: cv.dataset.zoom !== undefined ? +cv.dataset.zoom : 2,
        lensSize: cv.dataset.lens !== undefined ? +cv.dataset.lens : 80,
        rim: cv.dataset.rim === 'true',
        rimOptions: { color: cv.dataset.rimcolor || '#0A0A0C', width: +(cv.dataset.rimwidth || 6) }
      });
    });
  }

  global.createMagnifier = createMagnifier;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();
})(window);
