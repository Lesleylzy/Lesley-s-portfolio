/* Fit the fixed 1672x941 canvas into whatever viewport we are given.
   Landscape and portrait run out of different things: landscape runs out of
   height first, portrait runs out of width. Taking the smaller of the two
   ratios handles both without a second set of rules. */
(function () {
  const screen = document.getElementById('screen');
  const W = 1672, H = 941;
  let settled = false;

  function measure() {
    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth || document.documentElement.clientWidth;
    const vh = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight;
    return [vw, vh];
  }

  function fit() {
    const [vw, vh] = measure();
    const k = Math.min(vw / W, vh / H);
    /* Never write a zero or a NaN. The first call can land before the embedded
       viewport reports a size, and a scale of 0 collapses the whole page to
       nothing with no error anywhere to show for it. */
    if (!isFinite(k) || k <= 0) return false;
    screen.style.setProperty('--k', k);
    /* The background is a 1672px wide dithered pixel image. Nearest-neighbour
       is right when we are enlarging it and wrong when we are shrinking it:
       downsampling a fine dither with nearest-neighbour produces moire. */
    screen.classList.toggle('is-upscaled', k >= 1);
    return true;
  }

  /* Keep asking until a real measurement arrives, then stop. */
  (function attempt(tries) {
    if (fit()) { settled = true; return; }
    if (tries > 0) requestAnimationFrame(() => attempt(tries - 1));
  })(60);

  /* A plain resize listener is not enough: on phones the address bar showing
     and hiding changes the viewport without always firing resize, and some
     embedded browsers resize the frame rather than the window. */
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  window.addEventListener('load', fit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.documentElement);
})();
