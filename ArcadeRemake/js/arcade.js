/* Connor's Arcade — shared helpers for the browser ports of the WinForms games.
   Every game runs its logic on a fixed 20 ms tick, the same as the original
   System.Windows.Forms.Timer (Interval = 20), so speeds match the desktop builds. */
(function () {
  'use strict';

  // Keys the games use; stop them from scrolling the page while playing.
  const BLOCK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar']);

  const Arcade = {};

  // Same test as System.Drawing.Rectangle.IntersectsWith
  Arcade.intersects = function (a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  };

  // Same as Random.Next(min, max): max is exclusive. Next(max) also works.
  Arcade.next = function (min, max) {
    if (max === undefined) { max = min; min = 0; }
    return min + Math.floor(Math.random() * (max - min));
  };
  Arcade.pick = function (arr) { return arr[Arcade.next(arr.length)]; };

  // KeyDown / KeyUp, like the form events. onBlur lets a game release held keys.
  Arcade.onKeys = function (down, up, onBlur) {
    window.addEventListener('keydown', function (e) {
      if (BLOCK_KEYS.has(e.key)) e.preventDefault();
      if (down) down(e);
    });
    window.addEventListener('keyup', function (e) {
      if (BLOCK_KEYS.has(e.key)) e.preventDefault();
      if (up) up(e);
    });
    if (onBlur) window.addEventListener('blur', onBlur);
  };

  // Fixed-step loop: tick() runs every `interval` ms, render() every frame.
  Arcade.loop = function (tick, render, interval) {
    interval = interval || 20;
    let last = performance.now();
    let acc = 0;
    function frame(now) {
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= interval) { tick(); acc -= interval; }
      render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  // Optional sprite sheet: drop the PNGs from the WinForms Properties/Resources
  // folder into `folder` with the same names and the game uses them.
  // Anything that does not load falls back to the drawn version.
  Arcade.sprites = function (folder, names) {
    const out = {};
    names.forEach(function (name) {
      const img = new Image();
      img.onload = function () { out[name] = img; };
      img.src = folder + '/' + name + '.png';
    });
    return out;
  };

  // Stand-in for MessageBox.Show: an overlay with a title, text and one button.
  // Enter or a click closes it and runs the callback.
  Arcade.overlay = function (root) {
    const title = root.querySelector('.overlay-title');
    const text = root.querySelector('.overlay-text');
    const btn = root.querySelector('.overlay-btn');
    let cb = null;
    function close() {
      if (!cb) return;
      const f = cb;
      cb = null;
      root.classList.add('hidden');
      f();
    }
    btn.addEventListener('click', function () { btn.blur(); close(); });
    window.addEventListener('keydown', function (e) {
      if (cb && e.key === 'Enter') { e.preventDefault(); close(); }
    });
    return {
      show: function (t, body, label, onClose) {
        title.textContent = t;
        text.textContent = body;
        btn.textContent = label;
        cb = onClose || function () {};
        root.classList.remove('hidden');
      },
      get open() { return cb !== null; }
    };
  };

  Arcade.font = function (px) { return px + "px 'Press Start 2P', monospace"; };

  window.Arcade = Arcade;
})();
