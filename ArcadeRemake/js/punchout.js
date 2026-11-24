/* Punch-Out!! — browser port of the WinForms Form1.cs (734 x 561).
   BoxerMoveTimer = 20 ms tick, BoxerAttackTimer = 500 ms (every 25 ticks). */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = Arcade.overlay(document.getElementById('overlay'));
  const sprites = Arcade.sprites('img/punchout', [
    'background', 'boxer_stand', 'boxer_left_punch', 'boxer_right_punch', 'boxer_block',
    'enemy_stand', 'enemy_punch1', 'enemy_punch2', 'enemy_block'
  ]);

  const W = 734, H = 561;

  const player = { x: 301, y: 409, w: 61, h: 153, image: 'boxer_stand' };
  const boxer = { x: 358, y: 329, w: 77, h: 185, image: 'enemy_stand' };

  let playerBlock = false;
  let enemyBlock = false;
  let enemySpeed = 5;
  let playerHealth = 100;
  let enemyHealth = 500;
  let playerBar = 100;   // ProgressBar values
  let boxerBar = 500;
  const enemyAttack = ['left', 'right', 'block'];
  let running = false;
  let attackTicks = 0;

  function boxerAttackTimerEvent() {
    switch (Arcade.pick(enemyAttack)) {
      case 'left':
        boxer.image = 'enemy_punch2';
        enemyBlock = false;
        if (Arcade.intersects(boxer, player) && !playerBlock) playerHealth -= 5;
        break;
      case 'right':
        boxer.image = 'enemy_punch1';
        enemyBlock = false;
        if (Arcade.intersects(boxer, player) && !playerBlock) playerHealth -= 5;
        break;
      case 'block':
        boxer.image = 'enemy_block';
        enemyBlock = true;
        break;
    }
  }

  function boxerMoveTimerEvent() {
    if (playerHealth > 1) playerBar = playerHealth;
    if (enemyHealth > 1) boxerBar = enemyHealth;

    boxer.x += enemySpeed;
    if (boxer.x > 430) enemySpeed = -5;
    if (boxer.x < 220) enemySpeed = 5;

    // check for the knockout
    if (enemyHealth < 1) {
      running = false;
      overlay.show('K.O.!', 'You Win! Click OK to Play Again', 'OK', resetGame);
    } else if (playerHealth < 1) {
      running = false;
      overlay.show('DOWN!', 'Tough Rob Wins!\nYou need to train some more...', 'OK', resetGame);
    }
  }

  function tick() {
    if (!running) return;
    attackTicks++;
    if (attackTicks >= 25) { attackTicks = 0; boxerAttackTimerEvent(); }
    boxerMoveTimerEvent();
  }

  function resetGame() {
    playerHealth = 100;
    enemyHealth = 500;
    boxer.x = 400;
    attackTicks = 0;
    running = true;
  }

  Arcade.onKeys(
    function (e) {
      if (!running) return;
      if (e.key === 'ArrowLeft') {
        player.image = 'boxer_left_punch';
        playerBlock = false;
        if (Arcade.intersects(player, boxer) && !enemyBlock) enemyHealth -= 5;
      }
      if (e.key === 'ArrowRight') {
        player.image = 'boxer_right_punch';
        playerBlock = false;
        if (Arcade.intersects(player, boxer) && !enemyBlock) enemyHealth -= 5;
      }
      if (e.key === 'ArrowDown') {
        player.image = 'boxer_block';
        playerBlock = true;
      }
    },
    function () {
      player.image = 'boxer_stand';
      playerBlock = false;
    },
    function () { player.image = 'boxer_stand'; playerBlock = false; }
  );

  // ---------- drawn fallbacks ----------
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  (function paintBackground() {
    const b = bg.getContext('2d');
    const sky = b.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#07020f');
    sky.addColorStop(1, '#1d0b33');
    b.fillStyle = sky;
    b.fillRect(0, 0, W, H);
    // crowd
    let seed = 7;
    const rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let row = 0; row < 6; row++) {
      for (let c = 0; c < 40; c++) {
        const x = c * 19 + (row % 2) * 9 + rnd() * 6;
        const y = 120 + row * 22 + rnd() * 6;
        const shade = 30 + row * 10 + rnd() * 25;
        b.fillStyle = 'rgb(' + (shade + 15) + ',' + shade * 0.6 + ',' + (shade + 30) + ')';
        b.beginPath(); b.arc(x, y, 7, 0, Math.PI * 2); b.fill();
        b.fillRect(x - 9, y + 6, 18, 14);
      }
    }
    // spotlights
    [[180, '#ff00cc'], [550, '#00eaff']].forEach(function (s) {
      const g = b.createRadialGradient(s[0], 0, 10, s[0], 0, 320);
      g.addColorStop(0, s[1] + '55');
      g.addColorStop(1, s[1] + '00');
      b.fillStyle = g;
      b.fillRect(0, 0, W, 330);
    });
    // ring mat
    const mat = b.createLinearGradient(0, 300, 0, H);
    mat.addColorStop(0, '#4f7fb3');
    mat.addColorStop(1, '#8db6dd');
    b.fillStyle = mat;
    b.beginPath();
    b.moveTo(90, 300); b.lineTo(644, 300); b.lineTo(W, H); b.lineTo(0, H);
    b.closePath(); b.fill();
    // posts
    b.fillStyle = '#d9d9d9';
    b.fillRect(84, 220, 10, 85);
    b.fillRect(640, 220, 10, 85);
    // ropes: back and sides
    const ropes = ['#e8283c', '#f2f2f2', '#2860e8'];
    ropes.forEach(function (col, k) {
      const y = 232 + k * 22;
      b.strokeStyle = col;
      b.lineWidth = 4;
      b.beginPath(); b.moveTo(89, y); b.lineTo(645, y); b.stroke();
      b.lineWidth = 6;
      b.beginPath(); b.moveTo(89, y); b.lineTo(-20, H - 120 + k * 40); b.stroke();
      b.beginPath(); b.moveTo(645, y); b.lineTo(W + 20, H - 120 + k * 40); b.stroke();
    });
  })();

  function limb(c, x1, y1, x2, y2, color, width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function glove(c, x, y, r, color) {
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2); c.fill();
  }

  // You, seen from behind
  function drawPlayer(x, y, pose) {
    const skin = '#e0a878', glv = '#21c45a';
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(30, 150, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin;
    ctx.fillRect(16, 118, 12, 34);
    ctx.fillRect(33, 118, 12, 34);
    ctx.fillStyle = '#123';
    ctx.fillRect(14, 146, 15, 7); ctx.fillRect(32, 146, 15, 7);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.roundRect(12, 38, 37, 60, 8); ctx.fill();
    ctx.fillStyle = '#119944';
    ctx.fillRect(11, 92, 39, 28);
    ctx.fillStyle = '#e6ffe9';
    ctx.fillRect(11, 92, 39, 5);
    ctx.fillStyle = '#2a1608';
    ctx.beginPath(); ctx.arc(30, 24, 14, 0, Math.PI * 2); ctx.fill();
    const L = { stand: [6, 40], left_punch: [20, 0], right_punch: [12, 46], block: [22, 22] }[pose];
    const R = { stand: [55, 40], left_punch: [50, 46], right_punch: [41, 0], block: [39, 22] }[pose];
    limb(ctx, 14, 44, L[0], L[1], skin, 9);
    limb(ctx, 47, 44, R[0], R[1], skin, 9);
    glove(ctx, L[0], L[1], pose === 'block' ? 11 : 10, glv);
    glove(ctx, R[0], R[1], pose === 'block' ? 11 : 10, glv);
    ctx.restore();
  }

  // Tough Rob, facing you
  function drawBoxer(x, y, pose) {
    const skin = '#c98a5a', glv = '#e8283c';
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = skin;
    ctx.fillRect(20, 138, 15, 44);
    ctx.fillRect(42, 138, 15, 44);
    ctx.fillStyle = '#222';
    ctx.fillRect(18, 176, 19, 9); ctx.fillRect(40, 176, 19, 9);
    ctx.beginPath(); ctx.roundRect(17, 46, 43, 70, 10); ctx.fillStyle = skin; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(38, 60); ctx.lineTo(38, 100); ctx.stroke();
    ctx.fillStyle = '#b3122a';
    ctx.fillRect(15, 110, 47, 30);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(15, 110, 47, 6);
    // head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(38, 28, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b0f05';
    ctx.beginPath(); ctx.arc(38, 18, 16, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(29, 25, 7, 5); ctx.fillRect(41, 25, 7, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(32, 26, 3, 4); ctx.fillRect(43, 26, 3, 4);
    limb(ctx, 27, 23, 36, 25, '#1b0f05', 2.5);
    limb(ctx, 49, 23, 40, 25, '#1b0f05', 2.5);
    limb(ctx, 32, 38, 44, 38, '#5a2b14', 3);
    // arms
    const L = { stand: [12, 66, 13], punch1: [22, 112, 17], punch2: [10, 74, 13], block: [29, 32, 14] }[pose];
    const R = { stand: [65, 66, 13], punch1: [67, 74, 13], punch2: [55, 112, 17], block: [48, 32, 14] }[pose];
    limb(ctx, 19, 52, L[0], L[1], skin, 10);
    limb(ctx, 58, 52, R[0], R[1], skin, 10);
    glove(ctx, L[0], L[1], L[2], glv);
    glove(ctx, R[0], R[1], R[2], glv);
    ctx.restore();
  }

  function bar(x, y, w, h, value, max, label, align) {
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#06b025';
    ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, value) / max, h - 2);
    ctx.strokeStyle = '#bcbcbc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.font = Arcade.font(12);
    ctx.fillStyle = '#fff';
    ctx.textAlign = align;
    ctx.fillText(label, align === 'left' ? x + 2 : x + w - 2, y - 10);
  }

  function render() {
    if (sprites.background) ctx.drawImage(sprites.background, 0, 0, W, H);
    else ctx.drawImage(bg, 0, 0);

    const bImg = sprites[boxer.image];
    if (bImg) ctx.drawImage(bImg, boxer.x, boxer.y);
    else drawBoxer(boxer.x, boxer.y, boxer.image.replace('enemy_', ''));

    const pImg = sprites[player.image];
    if (pImg) ctx.drawImage(pImg, player.x, player.y);
    else drawPlayer(player.x, player.y, player.image.replace('boxer_', ''));

    bar(3, 58, 423, 23, boxerBar, 500, 'TOUGH ROB', 'left');
    bar(499, 58, 223, 23, playerBar, 100, 'YOU', 'right');
  }

  overlay.show('PUNCH-OUT!!', 'LEFT / RIGHT arrows throw punches.\nDOWN blocks. Knock out Tough Rob!', 'FIGHT', resetGame);
  Arcade.loop(tick, render, 20);
})();
