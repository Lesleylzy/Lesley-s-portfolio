/* Fit the 1672x941 canvas to the viewport.
   Landscape and portrait run out of different things: landscape runs out of
   height first, portrait runs out of width. The smaller of the two ratios
   handles both.

   --k drives two things in the CSS: the size of #screen (the visible, centred
   box) and the scale of #world (the native-size content inside it). Because
   both read the same variable they always match, and because #screen is sized
   to the fitted dimensions it is never larger than the viewport, so the grid
   centres it correctly in every browser.

   No requestAnimationFrame: it is throttled or paused when the tab is not
   visible, which previously left --k unset and the canvas at scale 1. The
   value is set synchronously and refreshed from real, non-RAF events. */
(function () {
  const screen = document.getElementById('screen');
  const W = 1672, H = 941;

  function fit() {
    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth || document.documentElement.clientWidth;
    const vh = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight;
    if (!vw || !vh) return;
    const k = Math.min(vw / W, vh / H);
    if (!isFinite(k) || k <= 0) return;
    screen.style.setProperty('--k', k);
    /* Nearest-neighbour only when enlarging; downscaling a fine dither with it
       produces moire. */
    screen.classList.toggle('is-upscaled', k >= 1);
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  window.addEventListener('load', fit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  /* ResizeObserver fires once immediately on observe and again on any change,
     and unlike rAF it is not gated on tab visibility, so it reliably lands the
     first correct measurement. */
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.documentElement);
})();
