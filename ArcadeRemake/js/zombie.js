/* Zombie Shootout — browser port of the WinForms Form1.cs + Bullet.cs (924 x 661, 20 ms timer). */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = Arcade.overlay(document.getElementById('overlay'));
  const sprites = Arcade.sprites('img/zombie', [
    'up', 'down', 'left', 'right', 'dead', 'zup', 'zdown', 'zleft', 'zright', 'ammo_Image'
  ]);

  const W = 924, H = 661;
  const ZOMBIE_SIZE = 71;   // PictureBox AutoSize took the size of the zombie image
  const AMMO_W = 46, AMMO_H = 32;

  const player = { x: 411, y: 323, w: 71, h: 100, image: 'up' };
  let goLeft = false, goRight = false, goUp = false, goDown = false, gameOver = false;
  let facing = 'up';
  let playerHealth = 100;
  let healthBar = 100;
  const speed = 10;
  let ammo = 10;
  const zombieSpeed = 3;
  let score = 0;
  let zombiesList = [];
  let bullets = [];
  let ammoDrops = [];
  let running = false;

  function mainTimerEvent() {
    if (!running) return;

    if (playerHealth > 1) {
      healthBar = playerHealth;
    } else {
      gameOver = true;
      player.image = 'dead';
      running = false;
      overlay.show('YOU DIED', 'Kills: ' + score + '\nPress Enter to play again', 'RESTART', restartGame);
      return;
    }

    if (goLeft && player.x > 0) player.x -= speed;
    if (goRight && player.x + player.w < W) player.x += speed;
    if (goUp && player.y > 60) player.y -= speed;   // 60 = top bounds for the "gui"
    if (goDown && player.y + player.h < H) player.y += speed;

    // ammo pickups
    ammoDrops = ammoDrops.filter(function (a) {
      if (Arcade.intersects(player, a)) { ammo += 5; return false; }
      return true;
    });

    // zombie AI
    zombiesList.slice().forEach(function (z) {
      if (Arcade.intersects(player, z)) playerHealth -= 1;

      let mx = 0, my = 0;
      if (z.x > player.x) { z.x -= zombieSpeed; z.image = 'zleft'; mx = -1; }
      if (z.x < player.x) { z.x += zombieSpeed; z.image = 'zright'; mx = 1; }
      if (z.y > player.y) { z.y -= zombieSpeed; z.image = 'zdown'; my = -1; }
      if (z.y < player.y) { z.y += zombieSpeed; z.image = 'zup'; my = 1; }
      if (my) z.facing = my < 0 ? 'up' : 'down';
      else if (mx) z.facing = mx < 0 ? 'left' : 'right';

      for (let k = 0; k < bullets.length; k++) {
        if (Arcade.intersects(z, bullets[k])) {
          score++;
          bullets.splice(k, 1);
          zombiesList.splice(zombiesList.indexOf(z), 1);
          makeZombies();
          break;
        }
      }
    });

    // Bullet.cs BulletTimerEvent
    bullets = bullets.filter(function (b) {
      if (b.direction === 'left') b.x -= 20;
      if (b.direction === 'right') b.x += 20;
      if (b.direction === 'up') b.y -= 20;
      if (b.direction === 'down') b.y += 20;
      return !(b.x < 10 || b.x > 860 || b.y < 10 || b.y > 600);
    });
  }

  function keyIsDown(e) {
    if (gameOver || !running) return;
    if (e.key === 'ArrowLeft') { goLeft = true; facing = 'left'; player.image = 'left'; }
    if (e.key === 'ArrowRight') { goRight = true; facing = 'right'; player.image = 'right'; }
    if (e.key === 'ArrowUp') { goUp = true; facing = 'up'; player.image = 'up'; }
    if (e.key === 'ArrowDown') { goDown = true; facing = 'down'; player.image = 'down'; }
  }

  function keyIsUp(e) {
    if (e.key === 'ArrowLeft') goLeft = false;
    if (e.key === 'ArrowRight') goRight = false;
    if (e.key === 'ArrowUp') goUp = false;
    if (e.key === 'ArrowDown') goDown = false;

    if (e.key === ' ' && ammo > 0 && !gameOver && running) {
      ammo--;
      shootBullet(facing);
      if (ammo < 1) dropAmmo();
    }
  }

  Arcade.onKeys(keyIsDown, keyIsUp, function () { goLeft = goRight = goUp = goDown = false; });

  function shootBullet(direction) {
    bullets.push({
      x: player.x + Math.floor(player.w / 2),
      y: player.y + Math.floor(player.h / 2),
      w: 5, h: 5,
      direction: direction
    });
  }

  function makeZombies() {
    // same random range as the original, re-rolled if it lands on top of the player
    let x, y, tries = 0;
    do {
      x = Arcade.next(0, 900);
      y = Arcade.next(0, 800);
      tries++;
    } while (tries < 20 && Math.hypot(x - player.x, y - player.y) < 220);
    zombiesList.push({
      x: x,
      y: y,
      w: ZOMBIE_SIZE, h: ZOMBIE_SIZE,
      image: 'zdown', facing: 'down'
    });
  }

  function dropAmmo() {
    ammoDrops.push({
      x: Arcade.next(10, W - AMMO_W),
      y: Arcade.next(10, H - AMMO_H),
      w: AMMO_W, h: AMMO_H
    });
  }

  function restartGame() {
    player.image = 'up';
    zombiesList = [];
    bullets = [];
    for (let k = 0; k < 3; k++) makeZombies();
    goUp = goDown = goLeft = goRight = false;
    gameOver = false;
    playerHealth = 100;
    healthBar = 100;
    score = 0;
    ammo = 10;
    running = true;
  }

  // ---------- drawn fallbacks (top-down) ----------
  const ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

  function drawSoldier(r, dir, dead) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (dead) {
      ctx.fillStyle = '#5c0b0b';
      ctx.beginPath(); ctx.ellipse(4, 6, 40, 26, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(Math.PI / 2.4);
    } else {
      ctx.rotate(ANGLE[dir]);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(3, 4, 18, 30, 0, 0, Math.PI * 2); ctx.fill();
    // rifle
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(4, 8, 40, 6);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-2, 7, 12, 8);
    // shoulders + arms
    ctx.fillStyle = dead ? '#5d6150' : '#5b6b2f';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a373';
    ctx.beginPath(); ctx.arc(18, 11, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, 14, 5, 0, Math.PI * 2); ctx.fill();
    // helmet
    ctx.fillStyle = dead ? '#3d4135' : '#3c4a1e';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 9, -1.2, 0.6); ctx.stroke();
    ctx.restore();
  }

  function drawZombie(z) {
    const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ANGLE[z.facing]);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(3, 4, 16, 27, 0, 0, Math.PI * 2); ctx.fill();
    // reaching arms
    ctx.fillStyle = '#86a86b';
    ctx.fillRect(2, -19, 28, 8);
    ctx.fillRect(2, 11, 26, 8);
    // torn shirt
    ctx.fillStyle = '#4a3b5c';
    ctx.beginPath(); ctx.ellipse(-2, 0, 13, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b1f1f';
    ctx.beginPath(); ctx.arc(-6, 10, 4, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = '#9cbf7e';
    ctx.beginPath(); ctx.arc(2, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2b2b';
    ctx.beginPath(); ctx.arc(10, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawAmmo(a) {
    if (sprites.ammo_Image) { ctx.drawImage(sprites.ammo_Image, a.x, a.y); return; }
    ctx.fillStyle = '#6d6230';
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.strokeStyle = '#bdb76b';
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x + 1, a.y + 1, a.w - 2, a.h - 2);
    ctx.fillStyle = '#f0e68c';
    ctx.font = Arcade.font(8);
    ctx.textAlign = 'center';
    ctx.fillText('AMMO', a.x + a.w / 2, a.y + a.h / 2 + 4);
  }

  function render() {
    ctx.fillStyle = 'rgb(64,64,64)';
    ctx.fillRect(0, 0, W, H);
    // faint floor tiles
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 66) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 66) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ammoDrops.forEach(drawAmmo);

    zombiesList.forEach(function (z) {
      const img = sprites[z.image];
      if (img) ctx.drawImage(img, z.x, z.y);
      else drawZombie(z);
    });

    ctx.fillStyle = '#fff';
    bullets.forEach(function (b) { ctx.fillRect(b.x, b.y, b.w, b.h); });

    const pImg = sprites[player.image];
    if (pImg) ctx.drawImage(pImg, player.x, player.y);
    else drawSoldier(player, facing, player.image === 'dead');

    // GUI
    ctx.textAlign = 'left';
    ctx.font = Arcade.font(20);
    ctx.fillStyle = '#bdb76b';
    ctx.fillText('Ammo: ' + ammo, 43, 48);
    ctx.fillStyle = '#c0392b';
    ctx.fillText('Kills: ' + score, 714, 48);
    ctx.fillStyle = '#2ecc40';
    ctx.font = Arcade.font(16);
    ctx.fillText('Health:', 373, 40);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(373, 52, 160, 23);
    ctx.fillStyle = healthBar > 30 ? '#06b025' : '#d9302c';
    ctx.fillRect(374, 53, 158 * healthBar / 100, 21);
  }

  restartGame();
  running = false;
  overlay.show('ZOMBIE SHOOTOUT', 'Arrows move · SPACE shoots the way you face.\nOut of ammo? Grab the crate that drops.', 'START', function () {
    running = true;
  });
  Arcade.loop(mainTimerEvent, render, 20);
})();
