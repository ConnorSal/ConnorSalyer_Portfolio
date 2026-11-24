/* Pac-Man — browser port of the WinForms Form1.cs (1014 x 736, 20 ms timer).
   Wall and pellet positions are copied from Form1.Designer.cs.
   Ghost.cs was not part of the upload, so the Ghost class below is a
   reconstruction: random wandering plus a "chase" mode toward the player. */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const overlay = Arcade.overlay(document.getElementById('overlay'));
  const sprites = Arcade.sprites('img/pacman', [
    'PacmanLeft', 'PacmanRight', 'PacmanUp', 'PacmanDown',
    'blinky', 'inky', 'clyde', 'pinky', 'Pellet'
  ]);

  const W = 1014, H = 736;

  // Tag == "wall"
  const walls = [
    [12, 448, 35, 276], [12, 12, 35, 276], [967, 12, 35, 276], [967, 448, 35, 276],
    [43, 695, 377, 29], [594, 695, 373, 29], [594, 12, 373, 29], [43, 12, 377, 29]
  ].map(function (r) { return { x: r[0], y: r[1], w: r[2], h: r[3] }; });

  // Tag == "dot" (20 x 20)
  const DOTS = [
    883,81, 883,117, 847,117, 847,81, 810,81, 774,81, 629,117, 629,81, 665,117, 665,81, 702,81, 738,81,
    774,189, 810,189, 847,153, 883,189, 883,153, 629,189, 629,153, 665,189, 665,153, 702,189, 738,189,
    883,517, 883,553, 847,517, 847,553, 810,517, 774,517, 629,625, 738,517, 702,517, 665,517, 665,553,
    629,517, 629,553, 883,589, 883,625, 847,589, 847,625, 810,625, 774,625, 738,625, 702,625, 665,589,
    665,625, 629,589,
    106,189, 106,153, 142,189, 142,153, 179,189, 215,189, 251,189, 287,189, 324,189, 324,153, 360,189,
    360,153, 106,117, 106,81, 142,117, 142,81, 179,81, 215,81, 251,81, 287,81, 324,117, 324,81, 360,117,
    360,81,
    106,625, 106,589, 142,625, 142,589, 179,625, 215,625, 251,625, 287,625, 324,625, 324,589, 360,625,
    360,589, 106,553, 106,517, 142,553, 142,517, 179,517, 215,517, 251,517, 287,517, 324,553, 324,517,
    360,553, 360,517,
    482,242, 847,189, 512,242, 512,268, 482,268, 400,314, 400,340, 400,370, 400,396, 594,314, 594,340,
    594,370, 594,396, 512,458, 512,432, 482,458, 482,432, 620,370, 620,340, 374,370, 374,340, 348,357,
    646,357, 497,216, 497,484
  ];
  const dots = [];
  for (let k = 0; k < DOTS.length; k += 2) {
    dots.push({ x: DOTS[k], y: DOTS[k + 1], w: 20, h: 20, visible: true });
  }

  const pacman = { x: 482, y: 340, w: 50, h: 50 };
  let face = 'Right';

  let goup = false, godown = false, goleft = false, goright = false;
  let noup = false, nodown = false, noleft = false, noright = false;
  const speed = 12;
  let score = 0;
  let totalScore = 0;
  let rounds = 0;
  let running = false;

  // ---------- Ghost (reconstructed) ----------
  const DIRECTIONS = ['left', 'right', 'up', 'down', 'chase'];
  // keep ghosts inside the outer walls
  const MIN_X = 47, MAX_X = 967 - 50, MIN_Y = 41, MAX_Y = 695 - 50;

  function Ghost(sprite, color, x, y) {
    this.sprite = sprite;
    this.color = color;
    this.startX = x;
    this.startY = y;
    this.x = x; this.y = y; this.w = 50; this.h = 50;
    this.speed = 8;
    this.direction = Arcade.pick(DIRECTIONS);
    this.change = 0;
  }
  Ghost.prototype.ghostMovement = function (p) {
    if (this.change > 0) {
      this.change--;
    } else {
      this.change = Arcade.next(20, 50);
      this.direction = Arcade.pick(DIRECTIONS);
    }
    switch (this.direction) {
      case 'left': this.x -= this.speed; break;
      case 'right': this.x += this.speed; break;
      case 'up': this.y -= this.speed; break;
      case 'down': this.y += this.speed; break;
      case 'chase':
        if (this.x > p.x) this.x -= this.speed; else if (this.x < p.x) this.x += this.speed;
        if (this.y > p.y) this.y -= this.speed; else if (this.y < p.y) this.y += this.speed;
        break;
    }
    if (this.x < MIN_X) { this.x = MIN_X; this.direction = 'right'; }
    if (this.x > MAX_X) { this.x = MAX_X; this.direction = 'left'; }
    if (this.y < MIN_Y) { this.y = MIN_Y; this.direction = 'down'; }
    if (this.y > MAX_Y) { this.y = MAX_Y; this.direction = 'up'; }
  };
  Ghost.prototype.changeDirection = function () {
    this.direction = Arcade.pick(DIRECTIONS);
  };
  Ghost.prototype.reset = function () { this.x = this.startX; this.y = this.startY; };

  // numbers determine ghost spawn positions (same as SetUp / StartButtonClick)
  const red = new Ghost('blinky', '#ff2a2a', 100, 100);
  const blue = new Ghost('inky', '#2ee6ff', 848, 597);
  const yellow = new Ghost('clyde', '#ffa53b', 132, 584);
  const pink = new Ghost('pinky', '#ff8ce0', 877, 130);
  const ghosts = [red, blue, yellow, pink];

  // ---------- input ----------
  function keyIsDown(e) {
    if (!running) return;
    if (e.key === 'ArrowLeft' && !noleft) {
      goright = godown = goup = false;
      noright = nodown = noup = false;
      goleft = true;
      face = 'Left';
    }
    if (e.key === 'ArrowRight' && !noright) {
      goleft = goup = godown = false;
      noleft = noup = nodown = false;
      goright = true;
      face = 'Right';
    }
    if (e.key === 'ArrowUp' && !noup) {
      goleft = goright = godown = false;
      // original cleared noup here; clearing nodown lets you reverse off the bottom wall
      noleft = noright = nodown = false;
      goup = true;
      face = 'Up';
    }
    if (e.key === 'ArrowDown' && !nodown) {
      goleft = goright = goup = false;
      noleft = noright = noup = false;
      godown = true;
      face = 'Down';
    }
  }
  Arcade.onKeys(keyIsDown, null);

  // ---------- game loop ----------
  function gameTimerEvent() {
    if (!running) return;

    playerMovements();
    walls.forEach(function (wall) { checkBoundaries(wall); });
    dots.forEach(function (dot) { collectingDots(dot); });

    if (score === dots.length) {
      showDots();
      score = 0;
      rounds++;
    }

    ghosts.forEach(function (g) { g.ghostMovement(pacman); });

    for (let k = 0; k < ghosts.length; k++) {
      if (Arcade.intersects(pacman, ghosts[k])) {
        gameOver();
        ghosts[k].changeDirection();
        break;
      }
    }
    updateHud();
  }

  function playerMovements() {
    if (goleft) pacman.x -= speed;
    if (goright) pacman.x += speed;
    if (goup) pacman.y -= speed;
    if (godown) pacman.y += speed;

    // wrap through the openings in the wall
    if (pacman.x < -30) pacman.x = W - pacman.w;
    if (pacman.x + pacman.w > W) pacman.x = -10;
    if (pacman.y < -30) pacman.y = H - pacman.h;
    if (pacman.y + pacman.w > H) pacman.y = -10;
  }

  function showDots() { dots.forEach(function (d) { d.visible = true; }); }

  function checkBoundaries(wall) {
    if (!Arcade.intersects(pacman, wall)) return;
    if (goleft) { noleft = true; goleft = false; pacman.x = wall.x + wall.w + 2; }
    if (goright) { noright = true; goright = false; pacman.x = wall.x - pacman.w - 2; }
    if (goup) { noup = true; goup = false; pacman.y = wall.y + wall.h + 2; }
    if (godown) { nodown = true; godown = false; pacman.y = wall.y - pacman.h - 2; }
  }

  function collectingDots(dot) {
    if (dot.visible && Arcade.intersects(pacman, dot)) {
      dot.visible = false;
      score++;
      totalScore++;
    }
  }

  function startButtonClick() {
    goleft = goright = goup = godown = false;
    noleft = noright = noup = nodown = false;
    score = 0;
    ghosts.forEach(function (g) { g.reset(); });
    running = true;
  }

  function gameOver() {
    running = false;
    showDots();
    pacman.x = 482; pacman.y = 340;
    const info = 'LOSER!\nTotal Dots Collected: ' + totalScore + '\nRounds Cleared: ' + rounds;
    score = 0;
    totalScore = 0;
    rounds = 0;
    overlay.show('Pac-Man', info, 'PLAY', startButtonClick);
  }

  function updateHud() {
    hud.textContent = 'DOTS ' + totalScore + '  ·  ROUNDS ' + rounds;
  }

  // ---------- drawing ----------
  function drawPlayer() {
    const img = sprites['Pacman' + face];
    if (img) { ctx.drawImage(img, pacman.x, pacman.y, pacman.w, pacman.h); return; }
    const cx = pacman.x + 25, cy = pacman.y + 25;
    ctx.save();
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // a single eye that shows which way you are heading
    const off = { Left: [-9, -8], Right: [9, -8], Up: [8, -10], Down: [8, 8] }[face];
    ctx.fillStyle = '#1a1200';
    ctx.beginPath();
    ctx.arc(cx + off[0], cy + off[1], 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGhost(g) {
    const img = sprites[g.sprite];
    if (img) { ctx.drawImage(img, g.x, g.y, g.w, g.h); return; }
    ctx.save();
    ctx.shadowColor = g.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.roundRect(g.x + 4, g.y + 4, 42, 42, 10);
    ctx.fill();
    ctx.restore();
    // eyes look at the player
    const dx = Math.sign(pacman.x - g.x) * 3, dy = Math.sign(pacman.y - g.y) * 3;
    [[g.x + 17, g.y + 20], [g.x + 33, g.y + 20]].forEach(function (e) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e[0], e[1], 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10104a';
      ctx.beginPath(); ctx.arc(e[0] + dx, e[1] + dy, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    walls.forEach(function (w) {
      ctx.fillStyle = 'rgb(0,0,64)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#2b2bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    });

    dots.forEach(function (d) {
      if (!d.visible) return;
      if (sprites.Pellet) { ctx.drawImage(sprites.Pellet, d.x, d.y, d.w, d.h); return; }
      ctx.fillStyle = '#ffd9b3';
      ctx.beginPath();
      ctx.arc(d.x + 10, d.y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    drawPlayer();
    ghosts.forEach(drawGhost);
  }

  updateHud();
  overlay.show('Pac-Man', 'UP / DOWN / LEFT / RIGHT', 'PLAY', startButtonClick);
  Arcade.loop(gameTimerEvent, render, 20);
})();
