/* Cursor fish — vanilla port of the Originkit spring-follow cursor.
   The fish trails the real pointer and is kept off it: when the pointer moves
   right the fish sits to its left; when the pointer moves left the fish sits
   to its lower right. It turns to face the way it is swimming and tilts a
   little with vertical motion. The OS cursor stays visible so links are easy
   to click; the fish rides a pointer-events:none overlay. Skipped on touch /
   reduced-motion via CSS and the guard below.

   The source drawing faces LEFT, so "facing right" flips it on X. */
(function () {
  if (window.matchMedia) {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  }

  const layer = document.createElement('div');
  layer.id = 'fx';
  const fish = document.createElement('img');
  fish.id = 'fx-fish';
  fish.src = 'img/fish.png';
  fish.alt = '';
  fish.decoding = 'async';
  layer.appendChild(fish);
  (document.body || document.documentElement).appendChild(layer);

  const FOLLOW = 0.12;   // ease toward the goal; lower = laggier
  const GAPX = 32;       // horizontal distance the fish keeps from the pointer
  const DROP = 26;       // downward offset when the pointer moves left
  const HALF_W = 20, HALF_H = 13;   // half the fish's rendered size

  let tx = -300, ty = -300;   // pointer
  let x = -300, y = -300;     // fish
  let vx = 0, vy = 0;         // smoothed pointer velocity
  let dir = 1;                // +1 pointer moving right, -1 moving left
  let offX = -GAPX, offY = 0; // current offset, eased
  let tilt = 0;
  let started = false;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function onMove(e) {
    if (started) {
      vx += ((e.clientX - tx) - vx) * 0.35;
      vy += ((e.clientY - ty) - vy) * 0.35;
    }
    tx = e.clientX; ty = e.clientY;
    if (!started) {
      started = true;
      x = tx - GAPX; y = ty;
      fish.classList.add('is-on');
      loop();
    }
  }

  function loop() {
    // Direction with a dead-zone so a resting pointer does not flicker facing.
    if (vx > 0.5) dir = 1; else if (vx < -0.5) dir = -1;
    vx *= 0.9; vy *= 0.9;

    // Target offset: left-of-pointer when going right, lower-right when going
    // left. Eased so the fish swims around to the other side.
    const goalOffX = dir === 1 ? -GAPX : GAPX;
    const goalOffY = dir === 1 ? 0 : DROP;
    offX += (goalOffX - offX) * 0.08;
    offY += (goalOffY - offY) * 0.08;

    // While crossing over (offX near 0) push the fish down so it arcs UNDER the
    // pointer rather than passing across it: keeps it off the cursor.
    const swing = 1 - Math.min(1, Math.abs(offX) / GAPX);

    const goalX = tx + offX;
    const goalY = ty + offY + swing * 15;
    x += (goalX - x) * FOLLOW;
    y += (goalY - y) * FOLLOW;

    const flip = dir === 1 ? -1 : 1;         // face the way it swims
    const wantTilt = clamp(vy * 0.7, -18, 18);
    tilt += (wantTilt - tilt) * 0.1;

    fish.style.transform =
      'translate(' + (x - HALF_W) + 'px,' + (y - HALF_H) + 'px) rotate(' +
      (tilt * flip).toFixed(2) + 'deg) scaleX(' + flip + ')';

    requestAnimationFrame(loop);
  }

  function onLeave() { fish.classList.remove('is-on'); }
  function onEnter() { if (started) fish.classList.add('is-on'); }

  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);
  window.addEventListener('blur', onLeave);
})();
