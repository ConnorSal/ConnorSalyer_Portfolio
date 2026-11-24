/* Pong — browser port of the WinForms Form1.cs (800 x 450, 20 ms timer). */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const overlay = Arcade.overlay(document.getElementById('overlay'));
  const sprites = Arcade.sprites('img/pong', ['player', 'computer', 'ball']);

  const W = 800, H = 450; // ClientSize

  const Player = { x: 12, y: 173, w: 30, h: 120 };
  const Computer = { x: 758, y: 173, w: 30, h: 120 };
  const Ball = { x: 371, y: 173, w: 30, h: 30 };

  let ballXspeed = 4;
  let ballYspeed = 4;
  let speed = 2;
  let goDown = false, goUp = false;
  let computerSpeedChange = 50;
  let playerScore = 0;
  let computerScore = 0;
  const playerSpeed = 8;
  const i = [5, 6, 8, 9];        // computer speeds
  const j = [10, 9, 8, 11, 12];  // ball speeds after a paddle hit
  let running = false;

  function gameTimerEvent() {
    if (!running) return;

    Ball.y -= ballYspeed;
    Ball.x -= ballXspeed;

    if (Ball.y < 0 || Ball.y + Ball.h > H) {
      ballYspeed = -ballYspeed;
    }
    if (Ball.x < -2) {
      Ball.x = 300;
      ballXspeed = -ballXspeed;
      computerScore++;
    }
    if (Ball.x + Ball.w > W) {
      Ball.x = 300;
      ballXspeed = -ballXspeed;
      playerScore++;
    }

    if (Computer.y <= 1) {
      Computer.y = 0;
    } else if (Computer.y + Computer.h >= H) {
      Computer.y = H - Computer.h;
    }
    // makes computer follow ball
    if (Ball.y < Computer.y + Computer.h / 2 && Ball.x > 300) Computer.y -= speed;
    if (Ball.y > Computer.y + Computer.h / 2 && Ball.x > 300) Computer.y += speed;

    computerSpeedChange -= 1;
    if (computerSpeedChange < 0) {
      speed = Arcade.pick(i);
      computerSpeedChange = 50;
    }

    if (goDown && Player.y + Player.h < H) Player.y += playerSpeed;
    if (goUp && Player.y > 0) Player.y -= playerSpeed;

    checkCollision(Player, Player.x + Player.w + 5);
    checkCollision(Computer, Computer.x - 35);

    updateHud();

    if (computerScore > 5) gameOver('Sorry, you LOST!');
    else if (playerScore > 5) gameOver('You WON!');
  }

  function checkCollision(paddle, offset) {
    if (Arcade.intersects(Ball, paddle)) {
      Ball.x = offset;
      const x = Arcade.pick(j);
      const y = Arcade.pick(j);
      ballXspeed = ballXspeed < 0 ? x : -x;
      ballYspeed = ballYspeed < 0 ? -y : y;
    }
  }

  function gameOver(message) {
    running = false;
    overlay.show('GAME OVER', message, 'OK', function () {
      computerScore = 0;
      playerScore = 0;
      ballXspeed = ballYspeed = 4;
      computerSpeedChange = 50;
      updateHud();
      running = true;
    });
  }

  function updateHud() {
    hud.textContent = 'PLAYER ' + playerScore + '  —  CPU ' + computerScore;
  }

  Arcade.onKeys(
    function (e) {
      if (e.key === 'ArrowDown') goDown = true;
      if (e.key === 'ArrowUp') goUp = true;
    },
    function (e) {
      if (e.key === 'ArrowDown') goDown = false;
      if (e.key === 'ArrowUp') goUp = false;
    },
    function () { goDown = goUp = false; }
  );

  // ---------- drawing ----------
  function paddle(img, r, color) {
    if (img) { ctx.drawImage(img, r.x, r.y, r.w, r.h); return; }
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.fillRect(r.x + 4, r.y, r.w - 8, r.h);
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 16]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = Arcade.font(48);
    ctx.textAlign = 'center';
    ctx.fillText(playerScore, W / 2 - 80, 70);
    ctx.fillText(computerScore, W / 2 + 80, 70);

    paddle(sprites.player, Player, '#00eaff');
    paddle(sprites.computer, Computer, '#ff00cc');

    if (sprites.ball) {
      ctx.drawImage(sprites.ball, Ball.x, Ball.y, Ball.w, Ball.h);
    } else {
      ctx.save();
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(Ball.x + Ball.w / 2, Ball.y + Ball.h / 2, Ball.w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  updateHud();
  overlay.show('PONG', 'UP and DOWN arrows move your paddle.\nFirst to 6 points wins.', 'START', function () {
    running = true;
  });
  Arcade.loop(gameTimerEvent, render, 20);
})();
