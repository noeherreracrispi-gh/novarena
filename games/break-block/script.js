const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const blocksLeftElement = document.getElementById("blocks-left");
const overlay = document.getElementById("overlay");
const gameShell = document.querySelector(".game-shell");
const hud = document.querySelector(".hud");
const controls = document.querySelector(".controls");
const canvasWrap = document.querySelector(".canvas-wrap");

const CONFIG = {
  width: canvas.width,
  height: canvas.height,
  paddle: {
    width: 150,
    height: 16,
    speed: 540,
    yOffset: 42,
    maxWidth: 240
  },
  ball: {
    radius: 10,
    speed: 320,
    levelStep: 35,
    maxSpeed: 640
  },
  bricks: {
    rows: 6,
    cols: 10,
    width: 74,
    height: 24,
    gap: 10,
    top: 72,
    left: 42,
    score: 100,
    hardBonus: 60,
    hardHitScore: 25,
    powerBlockCount: 5,
    tntChance: 0.035
  },
  powerUp: {
    size: 24,
    speed: 140,
    chance: 0.08,
    duration: 9000
  },
  explosion: {
    duration: 1200,
    radius: 96
  },
  lives: 3
};

const POWER_UP_TYPES = ["expand", "speed", "multiball"];

const state = {
  running: false,
  gameOver: false,
  score: 0,
  level: 1,
  lives: CONFIG.lives,
  keys: {
    left: false,
    right: false
  },
  paddle: null,
  balls: [],
  bricks: [],
  powerUps: [],
  explosions: [],
  effects: {
    expandUntil: 0
  },
  lastTime: 0
};

function createPaddle() {
  return {
    x: CONFIG.width / 2 - CONFIG.paddle.width / 2,
    y: CONFIG.height - CONFIG.paddle.yOffset,
    width: CONFIG.paddle.width,
    height: CONFIG.paddle.height,
    speed: CONFIG.paddle.speed
  };
}

function getBaseBallSpeed() {
  return Math.min(
    CONFIG.ball.maxSpeed,
    CONFIG.ball.speed + (state.level - 1) * CONFIG.ball.levelStep
  );
}

function createBall(x = CONFIG.width / 2, y = CONFIG.height - 90, direction = 1) {
  const baseSpeed = getBaseBallSpeed();

  return {
    x,
    y,
    radius: CONFIG.ball.radius,
    vx: baseSpeed * 0.75 * direction,
    vy: -baseSpeed
  };
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function createBricks() {
  const bricks = [];
  const hardChance = Math.min(0.22, 0.08 + (state.level - 1) * 0.018);

  for (let row = 0; row < CONFIG.bricks.rows; row += 1) {
    for (let col = 0; col < CONFIG.bricks.cols; col += 1) {
      const isTnt = Math.random() < CONFIG.bricks.tntChance;
      const isHard = !isTnt && Math.random() < hardChance;

      bricks.push({
        row,
        col,
        x: CONFIG.bricks.left + col * (CONFIG.bricks.width + CONFIG.bricks.gap),
        y: CONFIG.bricks.top + row * (CONFIG.bricks.height + CONFIG.bricks.gap),
        width: CONFIG.bricks.width,
        height: CONFIG.bricks.height,
        active: true,
        durability: isHard ? 2 : 1,
        maxDurability: isHard ? 2 : 1,
        tnt: isTnt,
        powerUpType: null,
        color: `hsl(${30 + row * 34}, 85%, ${62 - row * 4}%)`
      });
    }
  }

  const availableForPower = shuffle(bricks.filter((brick) => !brick.tnt));
  const powerCount = Math.min(CONFIG.bricks.powerBlockCount, availableForPower.length);

  for (let i = 0; i < powerCount; i += 1) {
    availableForPower[i].powerUpType = POWER_UP_TYPES[i % POWER_UP_TYPES.length];
  }

  return bricks;
}

function resetGame() {
  state.running = false;
  state.gameOver = false;
  state.score = 0;
  state.level = 1;
  state.lives = CONFIG.lives;
  state.paddle = createPaddle();
  state.balls = [createBall()];
  state.bricks = createBricks();
  state.powerUps = [];
  state.explosions = [];
  state.effects.expandUntil = 0;
  state.lastTime = 0;
  if (window.NovarenaBreakBlockBridge) {
    window.NovarenaBreakBlockBridge.resetRound();
  }
  updateHud();
  showOverlay(
    "Break Block",
    "Trenca tots els blocs. Alguns seran mes durs, alguns tindran power-ups i uns pocs seran TNT.",
    "Comencar"
  );
}

function startGame() {
  if (state.gameOver) {
    resetGame();
  }

  state.running = true;
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

function showOverlay(title, message, buttonLabel) {
  overlay.innerHTML = `
    <div>
      <h1>${title}</h1>
      <p>${message}</p>
      <p>Mou la barra amb les tecles esquerra i dreta.</p>
      <button id="startButton" type="button">${buttonLabel}</button>
    </div>
  `;
  overlay.classList.remove("hidden");
  document.getElementById("startButton").addEventListener("click", startGame, { once: true });
}

function updateHud() {
  scoreElement.textContent = state.score;
  levelElement.textContent = state.level;
  livesElement.textContent = state.lives;
  blocksLeftElement.textContent = state.bricks.filter((brick) => brick.active).length;
}

function startNextLevel() {
  state.running = false;
  state.level += 1;
  state.paddle = createPaddle();
  state.balls = [createBall()];
  state.bricks = createBricks();
  state.powerUps = [];
  state.explosions = [];
  state.effects.expandUntil = 0;
  state.lastTime = 0;
  if (window.NovarenaBreakBlockBridge) {
    window.NovarenaBreakBlockBridge.resetRound();
  }
  updateHud();
  showOverlay(
    "Has passat de nivell",
    "Ara les pilotes aniran mes rapid. Els blocs tambe seran una mica mes exigents.",
    "Seguent nivell"
  );
}

function resizeGameLayout() {
  const bodyStyles = window.getComputedStyle(document.body);
  const bodyPaddingY = parseFloat(bodyStyles.paddingTop) + parseFloat(bodyStyles.paddingBottom);
  const bodyPaddingX = parseFloat(bodyStyles.paddingLeft) + parseFloat(bodyStyles.paddingRight);
  const gap = 32;

  const availableWidth = Math.max(320, Math.min(gameShell.clientWidth, window.innerWidth - bodyPaddingX));
  const reservedHeight = hud.offsetHeight + controls.offsetHeight + bodyPaddingY + gap;
  const availableHeight = Math.max(220, window.innerHeight - reservedHeight);
  const scale = Math.min(1, availableWidth / CONFIG.width, availableHeight / CONFIG.height);
  const scaledWidth = Math.floor(CONFIG.width * scale);
  const scaledHeight = Math.floor(CONFIG.height * scale);

  canvas.style.width = `${scaledWidth}px`;
  canvas.style.height = `${scaledHeight}px`;
  canvasWrap.style.width = `${scaledWidth}px`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleRectCollision(ball, rect) {
  const closestX = clamp(ball.x, rect.x, rect.x + rect.width);
  const closestY = clamp(ball.y, rect.y, rect.y + rect.height);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > ball.radius * ball.radius) {
    return null;
  }

  const rectCenterX = rect.x + rect.width / 2;
  const rectCenterY = rect.y + rect.height / 2;
  const distX = ball.x - rectCenterX;
  const distY = ball.y - rectCenterY;
  const overlapX = rect.width / 2 + ball.radius - Math.abs(distX);
  const overlapY = rect.height / 2 + ball.radius - Math.abs(distY);

  return {
    overlapX,
    overlapY,
    distX,
    distY
  };
}

function bounceBallFromRect(ball, collision) {
  if (collision.overlapX < collision.overlapY) {
    ball.vx *= -1;
    ball.x += collision.distX > 0 ? collision.overlapX : -collision.overlapX;
  } else {
    ball.vy *= -1;
    ball.y += collision.distY > 0 ? collision.overlapY : -collision.overlapY;
  }
}

function updatePaddle(deltaTime) {
  if (state.keys.left) {
    state.paddle.x -= state.paddle.speed * deltaTime;
  }

  if (state.keys.right) {
    state.paddle.x += state.paddle.speed * deltaTime;
  }

  state.paddle.x = clamp(state.paddle.x, 0, CONFIG.width - state.paddle.width);

  if (Date.now() > state.effects.expandUntil && state.paddle.width !== CONFIG.paddle.width) {
    state.paddle.width = CONFIG.paddle.width;
    state.paddle.x = clamp(state.paddle.x, 0, CONFIG.width - state.paddle.width);
  }
}

function spawnPowerUp(brick, forcedType = null) {
  const type = forcedType || POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];

  state.powerUps.push({
    type,
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    size: CONFIG.powerUp.size,
    speed: CONFIG.powerUp.speed,
    phase: Math.random() * Math.PI * 2
  });
}

function destroyBrick(brick, options = {}) {
  if (!brick.active) {
    return;
  }

  brick.active = false;
  state.score += options.score ?? CONFIG.bricks.score;

  if (options.spawnPowerUp) {
    if (brick.powerUpType) {
      spawnPowerUp(brick, brick.powerUpType);
    } else if (Math.random() < CONFIG.powerUp.chance) {
      spawnPowerUp(brick);
    }
  }
}

function explodeTnt(originBrick) {
  state.explosions.push({
    x: originBrick.x + originBrick.width / 2,
    y: originBrick.y + originBrick.height / 2,
    startTime: performance.now(),
    duration: CONFIG.explosion.duration,
    radius: CONFIG.explosion.radius
  });

  const queue = [originBrick];
  const seen = new Set([`${originBrick.row}-${originBrick.col}`]);

  while (queue.length > 0) {
    const source = queue.shift();

    state.bricks.forEach((target) => {
      if (!target.active) {
        return;
      }

      const nearSource = Math.abs(target.row - source.row) <= 1 && Math.abs(target.col - source.col) <= 1;
      if (!nearSource) {
        return;
      }

      if (target.tnt) {
        const key = `${target.row}-${target.col}`;
        destroyBrick(target, { score: Math.floor(CONFIG.bricks.score * 0.8), spawnPowerUp: false });

        if (!seen.has(key)) {
          seen.add(key);
          queue.push(target);
        }

        return;
      }

      destroyBrick(target, {
        score: Math.floor(CONFIG.bricks.score * 0.8),
        spawnPowerUp: true
      });
    });
  }
}

function hitBrick(brick) {
  if (brick.tnt) {
    destroyBrick(brick, { score: CONFIG.bricks.score + 40, spawnPowerUp: false });
    explodeTnt(brick);
    return;
  }

  if (brick.durability > 1) {
    brick.durability -= 1;
    state.score += CONFIG.bricks.hardHitScore;
    return;
  }

  destroyBrick(brick, {
    score: CONFIG.bricks.score + (brick.maxDurability > 1 ? CONFIG.bricks.hardBonus : 0),
    spawnPowerUp: true
  });
}

function updateBalls(deltaTime) {
  const lostBalls = [];

  state.balls.forEach((ball, index) => {
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime;

    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CONFIG.width) {
      ball.vx *= -1;
      ball.x = clamp(ball.x, ball.radius, CONFIG.width - ball.radius);
    }

    if (ball.y - ball.radius <= 0) {
      ball.vy *= -1;
      ball.y = ball.radius;
    }

    const paddleCollision = circleRectCollision(ball, state.paddle);
    if (paddleCollision && ball.vy > 0) {
      const hitPosition = (ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
      const angleFactor = clamp(hitPosition, -1, 1);
      const speed = Math.min(CONFIG.ball.maxSpeed, Math.hypot(ball.vx, ball.vy) + 12);

      ball.vx = speed * angleFactor;
      ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, 180 * 180));
      ball.y = state.paddle.y - ball.radius;
    }

    for (const brick of state.bricks) {
      if (!brick.active) {
        continue;
      }

      const collision = circleRectCollision(ball, brick);
      if (!collision) {
        continue;
      }

      bounceBallFromRect(ball, collision);
      hitBrick(brick);
      break;
    }

    if (ball.y - ball.radius > CONFIG.height) {
      lostBalls.push(index);
    }
  });

  if (state.bricks.every((brick) => !brick.active)) {
    startNextLevel();
    return;
  }

  if (lostBalls.length > 0) {
    state.balls = state.balls.filter((_, index) => !lostBalls.includes(index));
  }

  if (state.balls.length === 0) {
    state.lives -= 1;
    updateHud();

    if (state.lives <= 0) {
      finishGame();
      return;
    }

    state.running = false;
    state.balls = [createBall()];
    showOverlay("Has perdut una vida", "Encara tens opcions. Torna-ho a intentar.", "Continuar");
  }
}

function applyPowerUp(type) {
  if (type === "expand") {
    state.paddle.width = Math.min(CONFIG.paddle.maxWidth, state.paddle.width + 60);
    state.effects.expandUntil = Date.now() + CONFIG.powerUp.duration;
  }

  if (type === "speed") {
    state.balls.forEach((ball) => {
      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      const nextSpeed = Math.min(CONFIG.ball.maxSpeed, currentSpeed + 80);
      const ratio = nextSpeed / currentSpeed;
      ball.vx *= ratio;
      ball.vy *= ratio;
    });
  }

  if (type === "multiball" && state.balls.length < 3) {
    const sourceBall = state.balls[0] || createBall();
    state.balls.push({
      ...createBall(sourceBall.x, sourceBall.y, -1),
      vx: -sourceBall.vx || -getBaseBallSpeed() * 0.75,
      vy: sourceBall.vy
    });
  }
}

function updatePowerUps(deltaTime) {
  state.powerUps.forEach((powerUp) => {
    powerUp.y += powerUp.speed * deltaTime;
  });

  state.powerUps = state.powerUps.filter((powerUp) => {
    const rect = {
      x: powerUp.x - powerUp.size / 2,
      y: powerUp.y - powerUp.size / 2,
      width: powerUp.size,
      height: powerUp.size
    };

    const caught = circleRectCollision(
      {
        x: powerUp.x,
        y: powerUp.y,
        radius: powerUp.size / 2
      },
      state.paddle
    );

    if (caught) {
      applyPowerUp(powerUp.type);
      return false;
    }

    return rect.y <= CONFIG.height;
  });
}

function updateExplosions(timestamp) {
  state.explosions = state.explosions.filter((explosion) => {
    return timestamp - explosion.startTime < explosion.duration;
  });
}

function finishGame() {
  state.running = false;
  state.gameOver = true;
  if (window.NovarenaBreakBlockBridge) {
    window.NovarenaBreakBlockBridge.submitScore(state.score);
  }
  showOverlay("Game Over", "Has quedat sense vides. Torna a provar.", "Reiniciar");
}

function drawBackground() {
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";

  for (let i = 0; i < 32; i += 1) {
    const x = (i * 73) % CONFIG.width;
    const y = (i * 53) % CONFIG.height;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < CONFIG.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPaddle() {
  ctx.save();
  ctx.fillStyle = "#f8fafc";
  ctx.shadowColor = "rgba(248, 250, 252, 0.4)";
  ctx.shadowBlur = 14;
  roundRect(ctx, state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, 10);
  ctx.fill();
  ctx.restore();
}

function drawBalls() {
  state.balls.forEach((ball) => {
    ctx.save();
    ctx.fillStyle = "#fde68a";
    ctx.shadowColor = "rgba(253, 224, 71, 0.75)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBrickCore(brick, fillStyle, borderStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = borderStyle;
  ctx.lineWidth = 2;
  roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPowerBrickBadge(brick) {
  const badgeX = brick.x + brick.width - 16;
  const badgeY = brick.y + 12;
  const colors = {
    expand: "#22c55e",
    speed: "#38bdf8",
    multiball: "#fb7185"
  };

  ctx.save();
  ctx.fillStyle = colors[brick.powerUpType];
  ctx.shadowColor = colors[brick.powerUpType];
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTntBrick(brick) {
  const pulse = (Math.sin(Date.now() / 150) + 1) * 0.5;

  drawBrickCore(brick, "#7f1d1d", "rgba(254, 202, 202, 0.5)");

  ctx.save();
  roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 8);
  ctx.clip();

  ctx.fillStyle = `rgba(255, 214, 102, ${0.18 + pulse * 0.18})`;
  for (let x = brick.x - brick.height; x < brick.x + brick.width + brick.height; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, brick.y + brick.height);
    ctx.lineTo(x + 10, brick.y + brick.height);
    ctx.lineTo(x + brick.height, brick.y);
    ctx.lineTo(x + brick.height - 10, brick.y);
    ctx.closePath();
    ctx.fill();
  }

  const warningGlow = ctx.createRadialGradient(
    brick.x + brick.width / 2,
    brick.y + brick.height / 2,
    2,
    brick.x + brick.width / 2,
    brick.y + brick.height / 2,
    brick.width * 0.8
  );
  warningGlow.addColorStop(0, `rgba(254, 240, 138, ${0.22 + pulse * 0.12})`);
  warningGlow.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = warningGlow;
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

  ctx.restore();

  ctx.save();
  ctx.fillStyle = `rgba(255, 245, 157, ${0.7 + pulse * 0.3})`;
  ctx.shadowColor = `rgba(255, 200, 80, ${0.45 + pulse * 0.35})`;
  ctx.shadowBlur = 8 + pulse * 8;
  ctx.beginPath();
  ctx.arc(brick.x + brick.width - 12, brick.y + 8, 3 + pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 241, 118, 0.9)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(brick.x + brick.width - 20, brick.y + 5);
  ctx.quadraticCurveTo(brick.x + brick.width - 16, brick.y + 1, brick.x + brick.width - 12, brick.y + 5);
  ctx.stroke();

  ctx.fillStyle = "#fee2e2";
  ctx.font = "bold 11px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TNT", brick.x + brick.width / 2, brick.y + brick.height / 2 + 1);

  ctx.strokeStyle = `rgba(255, 251, 235, ${0.35 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  roundRect(ctx, brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4, 6);
  ctx.stroke();
  ctx.restore();
}

function drawHardBrick(brick) {
  const base = brick.durability === 2 ? "#c2410c" : "#b45309";
  drawBrickCore(brick, base, "rgba(254, 215, 170, 0.5)");

  ctx.save();
  roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 8);
  ctx.clip();

  const brickRows = 3;
  const mortar = 2;
  const miniBrickHeight = brick.height / brickRows;
  const miniBrickWidth = brick.width / 2;

  ctx.fillStyle = "rgba(124, 45, 18, 0.18)";
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

  for (let row = 0; row < brickRows; row += 1) {
    const offset = row % 2 === 0 ? 0 : miniBrickWidth / 2;
    const top = brick.y + row * miniBrickHeight;

    for (let startX = brick.x - offset; startX < brick.x + brick.width; startX += miniBrickWidth) {
      const pieceX = startX + mortar / 2;
      const pieceY = top + mortar / 2;
      const pieceWidth = miniBrickWidth - mortar;
      const pieceHeight = miniBrickHeight - mortar;

      if (pieceX + pieceWidth <= brick.x || pieceX >= brick.x + brick.width) {
        continue;
      }

      const gradient = ctx.createLinearGradient(pieceX, pieceY, pieceX, pieceY + pieceHeight);
      gradient.addColorStop(0, brick.durability === 2 ? "#fb923c" : "#f59e0b");
      gradient.addColorStop(1, brick.durability === 2 ? "#c2410c" : "#b45309");

      ctx.fillStyle = gradient;
      roundRect(ctx, pieceX, pieceY, pieceWidth, pieceHeight, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 237, 213, 0.35)";
      roundRect(ctx, pieceX + 3, pieceY + 2, pieceWidth - 6, Math.max(3, pieceHeight * 0.18), 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(255, 237, 213, 0.65)";
  ctx.lineWidth = 2;
  roundRect(ctx, brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2, 7);
  ctx.stroke();

  if (brick.durability === 1) {
    drawHardBrickCracks(brick);
  }

  ctx.restore();
}

function drawHardBrickCracks(brick) {
  ctx.save();
  ctx.strokeStyle = "rgba(124, 45, 18, 0.82)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(brick.x + brick.width * 0.26, brick.y + brick.height * 0.16);
  ctx.lineTo(brick.x + brick.width * 0.38, brick.y + brick.height * 0.38);
  ctx.lineTo(brick.x + brick.width * 0.3, brick.y + brick.height * 0.6);
  ctx.lineTo(brick.x + brick.width * 0.42, brick.y + brick.height * 0.84);

  ctx.moveTo(brick.x + brick.width * 0.62, brick.y + brick.height * 0.12);
  ctx.lineTo(brick.x + brick.width * 0.56, brick.y + brick.height * 0.34);
  ctx.lineTo(brick.x + brick.width * 0.68, brick.y + brick.height * 0.55);
  ctx.lineTo(brick.x + brick.width * 0.6, brick.y + brick.height * 0.82);

  ctx.moveTo(brick.x + brick.width * 0.38, brick.y + brick.height * 0.38);
  ctx.lineTo(brick.x + brick.width * 0.54, brick.y + brick.height * 0.46);
  ctx.lineTo(brick.x + brick.width * 0.68, brick.y + brick.height * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawNormalBrick(brick) {
  drawBrickCore(brick, brick.color, "rgba(255, 255, 255, 0.2)");

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  roundRect(ctx, brick.x + 6, brick.y + 4, brick.width - 12, 5, 4);
  ctx.fill();
  ctx.restore();
}

function drawBricks() {
  state.bricks.forEach((brick) => {
    if (!brick.active) {
      return;
    }

    if (brick.tnt) {
      drawTntBrick(brick);
    } else if (brick.maxDurability > 1) {
      drawHardBrick(brick);
    } else {
      drawNormalBrick(brick);
    }

    if (brick.powerUpType && !brick.tnt) {
      drawPowerBrickBadge(brick);
    }
  });
}

function drawPowerUps() {
  state.powerUps.forEach((powerUp) => {
    const visuals = {
      expand: {
        primary: "#22c55e",
        secondary: "#86efac",
        glow: "rgba(34, 197, 94, 0.4)"
      },
      speed: {
        primary: "#38bdf8",
        secondary: "#bae6fd",
        glow: "rgba(56, 189, 248, 0.4)"
      },
      multiball: {
        primary: "#fb7185",
        secondary: "#fecdd3",
        glow: "rgba(251, 113, 133, 0.4)"
      }
    };

    const visual = visuals[powerUp.type];
    const now = Date.now();
    const pulse = 1 + Math.sin(now / 180 + powerUp.phase) * 0.08;
    const floatOffset = Math.sin(now / 220 + powerUp.phase) * 3;
    const size = powerUp.size * pulse;

    ctx.save();
    ctx.translate(powerUp.x, powerUp.y + floatOffset);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.55);
    ctx.lineTo(0, size * 0.9);
    ctx.stroke();

    ctx.fillStyle = visual.glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = visual.glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#0f172a";
    roundRect(ctx, -size * 0.62, -size * 0.62, size * 1.24, size * 1.24, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = visual.primary;
    roundRect(ctx, -size * 0.62, -size * 0.62, size * 1.24, size * 1.24, 8);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(-size * 0.5, -size * 0.5, size * 0.5, size * 0.5);
    gradient.addColorStop(0, visual.secondary);
    gradient.addColorStop(1, visual.primary);
    ctx.fillStyle = gradient;
    roundRect(ctx, -size * 0.44, -size * 0.44, size * 0.88, size * 0.88, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    roundRect(ctx, -size * 0.32, -size * 0.36, size * 0.64, size * 0.16, 4);
    ctx.fill();

    ctx.strokeStyle = "#082f49";
    ctx.fillStyle = "#082f49";
    ctx.lineWidth = 2.6;

    if (powerUp.type === "expand") {
      drawExpandIcon(size);
    } else if (powerUp.type === "speed") {
      drawSpeedIcon(size);
    } else {
      drawMultiballIcon(size);
    }

    ctx.restore();
  });
}

function drawExplosions(timestamp) {
  state.explosions.forEach((explosion) => {
    const progress = clamp((timestamp - explosion.startTime) / explosion.duration, 0, 1);
    const outerRadius = explosion.radius * progress;
    const innerRadius = outerRadius * 0.45;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const glow = ctx.createRadialGradient(
      explosion.x,
      explosion.y,
      innerRadius * 0.2,
      explosion.x,
      explosion.y,
      Math.max(outerRadius, 1)
    );
    glow.addColorStop(0, `rgba(255, 245, 157, ${0.95 * alpha})`);
    glow.addColorStop(0.35, `rgba(251, 191, 36, ${0.85 * alpha})`);
    glow.addColorStop(0.7, `rgba(249, 115, 22, ${0.55 * alpha})`);
    glow.addColorStop(1, "rgba(239, 68, 68, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, Math.max(outerRadius, 1), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 251, 235, ${0.8 * alpha})`;
    ctx.lineWidth = 3 + (1 - progress) * 8;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, Math.max(outerRadius * 0.75, 1), 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10 + progress * 1.6;
      const sparkStart = outerRadius * 0.25;
      const sparkEnd = outerRadius * (0.7 + (i % 3) * 0.12);

      ctx.strokeStyle = `rgba(254, 215, 170, ${0.7 * alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        explosion.x + Math.cos(angle) * sparkStart,
        explosion.y + Math.sin(angle) * sparkStart
      );
      ctx.lineTo(
        explosion.x + Math.cos(angle) * sparkEnd,
        explosion.y + Math.sin(angle) * sparkEnd
      );
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawExpandIcon(size) {
  ctx.beginPath();
  ctx.moveTo(-size * 0.24, 0);
  ctx.lineTo(size * 0.24, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.4, 0);
  ctx.lineTo(-size * 0.24, -size * 0.16);
  ctx.lineTo(-size * 0.24, size * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.4, 0);
  ctx.lineTo(size * 0.24, -size * 0.16);
  ctx.lineTo(size * 0.24, size * 0.16);
  ctx.closePath();
  ctx.fill();
}

function drawSpeedIcon(size) {
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.26);
  ctx.lineTo(size * 0.03, -size * 0.04);
  ctx.lineTo(-size * 0.05, -size * 0.04);
  ctx.lineTo(size * 0.18, size * 0.26);
  ctx.lineTo(-size * 0.02, size * 0.03);
  ctx.lineTo(size * 0.05, size * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size * 0.36, -size * 0.17);
  ctx.lineTo(-size * 0.2, 0);
  ctx.lineTo(-size * 0.36, size * 0.17);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.26, -size * 0.17);
  ctx.lineTo(size * 0.42, 0);
  ctx.lineTo(size * 0.26, size * 0.17);
  ctx.stroke();
}

function drawMultiballIcon(size) {
  const orbitBalls = [
    { x: 0, y: 0, r: size * 0.16 },
    { x: -size * 0.22, y: size * 0.16, r: size * 0.12 },
    { x: size * 0.22, y: size * 0.16, r: size * 0.12 }
  ];

  orbitBalls.forEach((ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, size * 0.07);
  ctx.lineTo(-size * 0.18, size * 0.12);
  ctx.moveTo(size * 0.1, size * 0.07);
  ctx.lineTo(size * 0.18, size * 0.12);
  ctx.stroke();
}

function drawMessage() {
  if (state.running || state.gameOver) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "18px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("Prem el boto o la barra espaiadora per comencar", CONFIG.width / 2, CONFIG.height - 18);
  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function render(timestamp = performance.now()) {
  drawBackground();
  drawBricks();
  drawExplosions(timestamp);
  drawPowerUps();
  drawPaddle();
  drawBalls();
  drawMessage();
}

function loop(timestamp) {
  if (!state.running) {
    render();
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.02);
  state.lastTime = timestamp;

  updatePaddle(deltaTime);
  updateBalls(deltaTime);
  updatePowerUps(deltaTime);
  updateExplosions(timestamp);
  updateHud();
  render(timestamp);

  if (state.running) {
    requestAnimationFrame(loop);
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    state.keys.left = true;
  }

  if (event.key === "ArrowRight") {
    state.keys.right = true;
  }

  if (event.key === " " && !state.running) {
    startGame();
  }

  if (event.key.toLowerCase() === "r") {
    resetGame();
    render();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    state.keys.left = false;
  }

  if (event.key === "ArrowRight") {
    state.keys.right = false;
  }
});

window.addEventListener("resize", resizeGameLayout);

resizeGameLayout();
resetGame();
render();


