/**
 * ============================================================================
 * SNAKE ARCADE // MULTI-EDITION ROUTER & ENGINES
 *
 * 1. HubManager: Central Landing Menu & View Router (Hub <-> v1 <-> v2)
 * 2. ClassicSnakeGame (v1): Exact recreation of original commit 9b3f8ca
 *    - DOM-based grid elements: div.snake & div.food
 *    - Exact speed stepping, 1-20 grid boundaries, logo.png & instruction text
 *    - Fixed 180° suicide bug & added localStorage high score persistence
 * 3. NextGenSnakeGame (v2): Modern cyber-dark mode canvas engine
 * ============================================================================
 */

'use strict';

(() => {
  // Global Directions (1-based grid for v1, delta offsets for both)
  const DIRECTIONS = {
    UP: { x: 0, y: -1, name: 'up' },
    DOWN: { x: 0, y: 1, name: 'down' },
    LEFT: { x: -1, y: 0, name: 'left' },
    RIGHT: { x: 1, y: 0, name: 'right' },
  };

  const STORAGE_KEYS = {
    V1_HIGH: 'snake_v1_high_score',
    V2_HIGH: 'snake_v2_high_score',
    V2_MUTED: 'snake_v2_muted',
    V2_MODE: 'snake_v2_boundary_mode',
  };

  // Safe Haptic Feedback Helper
  function triggerHaptic(pattern = 10) {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // Web Audio Synthesizer (Native synth for Next-Gen v2)
  // --------------------------------------------------------------------------
  class WebAudioSynth {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      try {
        this.isMuted = localStorage.getItem(STORAGE_KEYS.V2_MUTED) === 'true';
      } catch (e) {
        this.isMuted = false;
      }
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem(STORAGE_KEYS.V2_MUTED, this.isMuted.toString());
      } catch (e) {}
      return this.isMuted;
    }

    playEat(isBonus = false) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isBonus ? 'triangle' : 'sine';
      if (isBonus) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    }

    playLevelUp() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.16);
      });
    }

    playCrash() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    }
  }

  // --------------------------------------------------------------------------
  // Particles & Floating Text (for Next-Gen v2)
  // --------------------------------------------------------------------------
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.color = color;
      this.radius = Math.random() * 2.5 + 1.5;
      this.alpha = 1;
      this.decay = Math.random() * 0.035 + 0.025;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.alpha -= this.decay;
      return this.alpha > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.alpha = 1;
      this.vy = -1.2;
    }

    update() {
      this.y += this.vy;
      this.alpha -= 0.025;
      return this.alpha > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // GAME ENGINE 1: AUTHENTIC CLASSIC SNAKE (v1)
  // Exact replication of author's original commit 9b3f8ca
  // --------------------------------------------------------------------------
  class ClassicSnakeGame {
    constructor() {
      this.board = document.getElementById('v1-game-board');
      this.instructionText = document.getElementById('v1-instruction-text');
      this.logo = document.getElementById('v1-logo');
      this.scoreText = document.getElementById('v1-score');
      this.highScoreText = document.getElementById('v1-highScore');
      this.boardWrapper = document.getElementById('v1-board-wrapper');

      this.gridSize = 20;
      this.snake = [{ x: 10, y: 10 }];
      this.food = this.generateFood();
      this.highScore = 0;
      this.direction = 'right';
      this.inputQueue = []; // Bug fix: queue to prevent 180° suicide
      this.gameInterval = null;
      this.gameSpeedDelay = 200;
      this.gameStarted = false;

      this.loadHighScore();
      this.bindInputs();
      this.draw();
    }

    loadHighScore() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.V1_HIGH);
        if (saved !== null) {
          this.highScore = parseInt(saved, 10) || 0;
          this.highScoreText.textContent = this.highScore.toString().padStart(3, '0');
        }
      } catch (e) {
        this.highScore = 0;
      }
    }

    saveHighScore() {
      try {
        localStorage.setItem(STORAGE_KEYS.V1_HIGH, this.highScore.toString());
      } catch (e) {}
    }

    // Exact draw from commit 9b3f8ca
    draw() {
      this.board.innerHTML = '';
      this.drawSnake();
      this.drawFood();
      this.updateScore();
    }

    drawSnake() {
      this.snake.forEach((segment) => {
        const snakeElement = this.createGameElement('div', 'snake');
        this.setPosition(snakeElement, segment);
        this.board.appendChild(snakeElement);
      });
    }

    createGameElement(tag, className) {
      const element = document.createElement(tag);
      element.className = className;
      return element;
    }

    setPosition(element, position) {
      element.style.gridColumn = position.x;
      element.style.gridRow = position.y;
    }

    drawFood() {
      if (this.gameStarted) {
        const foodElement = this.createGameElement('div', 'food');
        this.setPosition(foodElement, this.food);
        this.board.appendChild(foodElement);
      }
    }

    generateFood() {
      const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
      const freeSpots = [];
      for (let x = 1; x <= this.gridSize; x++) {
        for (let y = 1; y <= this.gridSize; y++) {
          if (!occupied.has(`${x},${y}`)) freeSpots.push({ x, y });
        }
      }
      if (freeSpots.length === 0) return { x: 1, y: 1 };
      return freeSpots[Math.floor(Math.random() * freeSpots.length)];
    }

    move() {
      // Process queued direction (fixes 180° suicide)
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }

      const head = { ...this.snake[0] };
      switch (this.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      this.snake.unshift(head);

      if (head.x === this.food.x && head.y === this.food.y) {
        this.food = this.generateFood();
        this.increaseSpeed();
        clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => {
          this.move();
          this.checkCollision();
          this.draw();
        }, this.gameSpeedDelay);
        triggerHaptic(15);
      } else {
        this.snake.pop();
      }
    }

    increaseSpeed() {
      if (this.gameSpeedDelay > 150) {
        this.gameSpeedDelay -= 5;
      } else if (this.gameSpeedDelay > 100) {
        this.gameSpeedDelay -= 3;
      } else if (this.gameSpeedDelay > 50) {
        this.gameSpeedDelay -= 2;
      } else if (this.gameSpeedDelay > 25) {
        this.gameSpeedDelay -= 1;
      }
    }

    checkCollision() {
      const head = this.snake[0];

      if (head.x < 1 || head.x > this.gridSize || head.y < 1 || head.y > this.gridSize) {
        this.resetGame();
        return;
      }

      for (let i = 1; i < this.snake.length; i++) {
        if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
          this.resetGame();
          return;
        }
      }
    }

    startGame() {
      this.gameStarted = true;
      this.instructionText.style.display = 'none';
      this.logo.style.display = 'none';
      clearInterval(this.gameInterval);
      this.gameInterval = setInterval(() => {
        this.move();
        this.checkCollision();
        this.draw();
      }, this.gameSpeedDelay);
    }

    resetGame() {
      this.updateHighScore();
      this.stopGame();
      this.snake = [{ x: 10, y: 10 }];
      this.food = this.generateFood();
      this.direction = 'right';
      this.inputQueue = [];
      this.gameSpeedDelay = 200;
      this.updateScore();
      triggerHaptic([30, 20, 50]);
    }

    stopGame() {
      clearInterval(this.gameInterval);
      this.gameStarted = false;
      this.instructionText.style.display = 'block';
      this.logo.style.display = 'block';
    }

    updateScore() {
      const currentScore = this.snake.length - 1;
      this.scoreText.textContent = currentScore.toString().padStart(3, '0');
    }

    updateHighScore() {
      const currentScore = this.snake.length - 1;
      if (currentScore > this.highScore) {
        this.highScore = currentScore;
        this.highScoreText.textContent = this.highScore.toString().padStart(3, '0');
        this.saveHighScore();
      }
      this.highScoreText.style.display = 'block';
    }

    queueDirection(newDir) {
      if (!this.gameStarted) {
        this.startGame();
        return;
      }

      const lastDir = this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;

      // Prevent 180° immediate reverse
      if (newDir === 'up' && lastDir === 'down') return;
      if (newDir === 'down' && lastDir === 'up') return;
      if (newDir === 'left' && lastDir === 'right') return;
      if (newDir === 'right' && lastDir === 'left') return;
      if (newDir === lastDir) return;

      if (this.inputQueue.length < 2) {
        this.inputQueue.push(newDir);
        triggerHaptic(8);
      }
    }

    bindInputs() {
      // Mobile Virtual D-Pad
      const bindBtn = (id, dir) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.queueDirection(dir);
          });
        }
      };
      bindBtn('v1-dpad-up', 'up');
      bindBtn('v1-dpad-down', 'down');
      bindBtn('v1-dpad-left', 'left');
      bindBtn('v1-dpad-right', 'right');

      const centerBtn = document.getElementById('v1-dpad-center');
      if (centerBtn) {
        centerBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!this.gameStarted) this.startGame();
        });
      }

      // Touch Swipes
      let touchStartX = 0;
      let touchStartY = 0;

      this.boardWrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.boardWrapper.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });

      this.boardWrapper.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 0) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        if (Math.max(absX, absY) > 20) {
          if (absX > absY) {
            this.queueDirection(diffX > 0 ? 'right' : 'left');
          } else {
            this.queueDirection(diffY > 0 ? 'down' : 'up');
          }
        } else {
          if (!this.gameStarted) this.startGame();
        }
      }, { passive: true });
    }
  }

  // --------------------------------------------------------------------------
  // GAME ENGINE 2: NEXT-GEN CYBER SNAKE (v2)
  // --------------------------------------------------------------------------
  class NextGenSnakeGame {
    constructor() {
      this.config = {
        gridSize: 20,
        baseSpeedMs: 140,
        minSpeedMs: 55,
        speedStepMs: 4,
        applesPerLevel: 5,
        bonusFoodChance: 0.18,
        bonusDurationMs: 6500,
      };

      this.canvas = document.getElementById('v2-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.boardContainer = document.getElementById('v2-board-container');

      this.scoreDisplay = document.getElementById('v2-score-display');
      this.highScoreDisplay = document.getElementById('v2-high-score-display');
      this.levelDisplay = document.getElementById('v2-level-display');

      this.startOverlay = document.getElementById('v2-start-overlay');
      this.pauseOverlay = document.getElementById('v2-pause-overlay');
      this.gameOverOverlay = document.getElementById('v2-game-over-overlay');
      this.overlayModeTag = document.getElementById('v2-overlay-mode-tag');

      this.summaryScore = document.getElementById('v2-summary-score');
      this.summaryApples = document.getElementById('v2-summary-apples');
      this.summaryLevel = document.getElementById('v2-summary-level');
      this.newHighScoreBanner = document.getElementById('v2-new-high-score-banner');

      this.startBtn = document.getElementById('v2-start-btn');
      this.resumeBtn = document.getElementById('v2-resume-btn');
      this.restartFromPauseBtn = document.getElementById('v2-restart-from-pause-btn');
      this.playAgainBtn = document.getElementById('v2-play-again-btn');

      this.modeToggleBtn = document.getElementById('v2-mode-toggle-btn');
      this.modeIcon = document.getElementById('v2-mode-icon');
      this.modeName = document.getElementById('v2-mode-name');

      this.soundToggleBtn = document.getElementById('v2-sound-toggle-btn');
      this.soundIconOn = document.getElementById('v2-sound-icon-on');
      this.soundIconOff = document.getElementById('v2-sound-icon-off');

      this.sound = new WebAudioSynth();
      this.state = 'IDLE';
      this.boundaryMode = 'classic';

      this.score = 0;
      this.highScore = 0;
      this.level = 1;
      this.applesEaten = 0;
      this.applesThisLevel = 0;

      this.snake = [];
      this.direction = DIRECTIONS.RIGHT;
      this.inputQueue = [];
      this.food = null;
      this.bonusFood = null;
      this.bonusTimer = null;

      this.particles = [];
      this.floatingTexts = [];
      this.screenShake = 0;
      this.tileSize = 30;

      this.lastTickTime = 0;
      this.tickInterval = this.config.baseSpeedMs;
      this.animFrameId = null;

      this.loadSettings();
      this.setupCanvas();
      this.initIdleBoard();
      this.bindEvents();
      this.updateHud();
      this.updateModeUI();
      this.updateSoundUI();
      this.startRenderLoop();
    }

    loadSettings() {
      try {
        const savedHigh = localStorage.getItem(STORAGE_KEYS.V2_HIGH);
        if (savedHigh) this.highScore = parseInt(savedHigh, 10) || 0;

        const savedMode = localStorage.getItem(STORAGE_KEYS.V2_MODE);
        if (savedMode === 'wrap' || savedMode === 'classic') this.boundaryMode = savedMode;
      } catch (e) {}
    }

    saveHighScore() {
      try {
        localStorage.setItem(STORAGE_KEYS.V2_HIGH, this.highScore.toString());
      } catch (e) {}
    }

    saveMode() {
      try {
        localStorage.setItem(STORAGE_KEYS.V2_MODE, this.boundaryMode);
      } catch (e) {}
    }

    setupCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const size = rect.width > 0 ? rect.width : 400;
      this.canvas.width = Math.round(size * dpr);
      this.canvas.height = Math.round(size * dpr);
      this.tileSize = this.canvas.width / this.config.gridSize;
    }

    initIdleBoard() {
      const startX = Math.floor(this.config.gridSize / 2);
      const startY = Math.floor(this.config.gridSize / 2);
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];
      this.food = { x: startX + 4, y: startY };
    }

    reset() {
      this.score = 0;
      this.level = 1;
      this.applesEaten = 0;
      this.applesThisLevel = 0;
      this.tickInterval = this.config.baseSpeedMs;

      const startX = Math.floor(this.config.gridSize / 2);
      const startY = Math.floor(this.config.gridSize / 2);
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];

      this.direction = DIRECTIONS.RIGHT;
      this.inputQueue = [];
      this.clearBonusFood();
      this.food = this.generateFood();
      this.particles = [];
      this.floatingTexts = [];
      this.screenShake = 0;
      this.updateHud();
    }

    start() {
      this.sound.init();
      this.reset();
      this.state = 'PLAYING';
      this.lastTickTime = performance.now();

      this.startOverlay.classList.add('hidden');
      this.pauseOverlay.classList.add('hidden');
      this.gameOverOverlay.classList.add('hidden');
    }

    pause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.pauseOverlay.classList.remove('hidden');
      }
    }

    resume() {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.lastTickTime = performance.now();
        this.pauseOverlay.classList.add('hidden');
      }
    }

    togglePause() {
      if (this.state === 'PLAYING') this.pause();
      else if (this.state === 'PAUSED') this.resume();
      else if (this.state === 'IDLE' || this.state === 'GAME_OVER') this.start();
    }

    stop() {
      this.state = 'IDLE';
      this.clearBonusFood();
      this.initIdleBoard();
      this.startOverlay.classList.remove('hidden');
      this.pauseOverlay.classList.add('hidden');
      this.gameOverOverlay.classList.add('hidden');
    }

    gameOver() {
      this.state = 'GAME_OVER';
      this.sound.playCrash();
      this.screenShake = 16;
      triggerHaptic([40, 30, 60]);

      const head = this.snake[0];
      const px = head.x * this.tileSize + this.tileSize / 2;
      const py = head.y * this.tileSize + this.tileSize / 2;
      for (let i = 0; i < 28; i++) {
        this.particles.push(new Particle(px, py, '#F43F5E'));
      }

      let isNewRecord = false;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore();
        isNewRecord = true;
      }

      this.summaryScore.textContent = this.score.toString();
      this.summaryApples.textContent = this.applesEaten.toString();
      this.summaryLevel.textContent = this.level.toString();

      if (isNewRecord) {
        this.newHighScoreBanner.classList.remove('hidden');
      } else {
        this.newHighScoreBanner.classList.add('hidden');
      }

      this.updateHud();

      setTimeout(() => {
        if (this.state === 'GAME_OVER') {
          this.gameOverOverlay.classList.remove('hidden');
        }
      }, 350);
    }

    updateGameLogic() {
      if (this.state !== 'PLAYING') return;

      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }

      const currentHead = this.snake[0];
      let newX = currentHead.x + this.direction.x;
      let newY = currentHead.y + this.direction.y;

      if (this.boundaryMode === 'wrap') {
        if (newX < 0) newX = this.config.gridSize - 1;
        else if (newX >= this.config.gridSize) newX = 0;

        if (newY < 0) newY = this.config.gridSize - 1;
        else if (newY >= this.config.gridSize) newY = 0;
      } else {
        if (newX < 0 || newX >= this.config.gridSize || newY < 0 || newY >= this.config.gridSize) {
          this.gameOver();
          return;
        }
      }

      const willEatFood = (newX === this.food.x && newY === this.food.y);
      const willEatBonus = this.bonusFood && (newX === this.bonusFood.x && newY === this.bonusFood.y);
      const bodyToCheck = (willEatFood || willEatBonus) ? this.snake : this.snake.slice(0, -1);

      if (bodyToCheck.some(seg => seg.x === newX && seg.y === newY)) {
        this.gameOver();
        return;
      }

      this.snake.unshift({ x: newX, y: newY });

      if (willEatFood) {
        this.onFoodEaten(false);
      } else if (willEatBonus) {
        this.onFoodEaten(true);
      } else {
        this.snake.pop();
      }
    }

    onFoodEaten(isBonus) {
      const points = isBonus ? 30 : 10;
      this.score += points;
      this.applesEaten++;
      triggerHaptic(20);

      const targetFood = isBonus ? this.bonusFood : this.food;
      const px = targetFood.x * this.tileSize + this.tileSize / 2;
      const py = targetFood.y * this.tileSize + this.tileSize / 2;

      this.sound.playEat(isBonus);
      const color = isBonus ? '#F59E0B' : '#34D399';
      for (let i = 0; i < (isBonus ? 20 : 12); i++) {
        this.particles.push(new Particle(px, py, color));
      }
      this.floatingTexts.push(new FloatingText(`+${points}`, px, py, color));

      if (isBonus) {
        this.clearBonusFood();
      } else {
        this.applesThisLevel++;
        if (this.applesThisLevel >= this.config.applesPerLevel) {
          this.levelUp();
        }
        this.food = this.generateFood();
        if (!this.bonusFood && Math.random() < this.config.bonusFoodChance) {
          this.spawnBonusFood();
        }
      }

      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore();
      }

      this.updateHud();
    }

    levelUp() {
      this.level++;
      this.applesThisLevel = 0;
      this.sound.playLevelUp();
      this.tickInterval = Math.max(
        this.config.minSpeedMs,
        this.config.baseSpeedMs - (this.level - 1) * this.config.speedStepMs
      );

      const head = this.snake[0];
      const px = head.x * this.tileSize + this.tileSize / 2;
      const py = head.y * this.tileSize + this.tileSize / 2;
      this.floatingTexts.push(new FloatingText(`LEVEL ${this.level}!`, px, py - 20, '#06B6D4'));
    }

    generateFood() {
      const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
      if (this.bonusFood) occupied.add(`${this.bonusFood.x},${this.bonusFood.y}`);

      const availableSpots = [];
      for (let x = 0; x < this.config.gridSize; x++) {
        for (let y = 0; y < this.config.gridSize; y++) {
          if (!occupied.has(`${x},${y}`)) availableSpots.push({ x, y });
        }
      }
      if (availableSpots.length === 0) {
        this.gameOver();
        return { x: 0, y: 0 };
      }
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    spawnBonusFood() {
      this.clearBonusFood();
      const pos = this.generateFood();
      this.bonusFood = {
        ...pos,
        spawnTime: performance.now(),
        duration: this.config.bonusDurationMs,
      };

      this.bonusTimer = setTimeout(() => {
        this.clearBonusFood();
      }, this.config.bonusDurationMs);
    }

    clearBonusFood() {
      if (this.bonusTimer) {
        clearTimeout(this.bonusTimer);
        this.bonusTimer = null;
      }
      this.bonusFood = null;
    }

    queueDirection(newDir) {
      if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
        this.start();
        return;
      }
      if (this.state === 'PAUSED') {
        this.resume();
      }

      const lastPlannedDir = this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;

      if (newDir.x === -lastPlannedDir.x && newDir.y === -lastPlannedDir.y) return;
      if (newDir.x === lastPlannedDir.x && newDir.y === lastPlannedDir.y) return;

      if (this.inputQueue.length < 2) {
        this.inputQueue.push(newDir);
        triggerHaptic(8);
      }
    }

    updateHud() {
      this.scoreDisplay.textContent = this.score.toString().padStart(3, '0');
      this.highScoreDisplay.textContent = this.highScore.toString().padStart(3, '0');
      this.levelDisplay.textContent = this.level.toString().padStart(2, '0');
    }

    toggleBoundaryMode() {
      this.boundaryMode = this.boundaryMode === 'classic' ? 'wrap' : 'classic';
      this.saveMode();
      this.updateModeUI();
    }

    updateModeUI() {
      const isWrap = this.boundaryMode === 'wrap';
      this.modeIcon.textContent = isWrap ? '🌐' : '🛡️';
      this.modeName.textContent = isWrap ? 'Wrap' : 'Classic';
      this.overlayModeTag.textContent = isWrap ? '🌐 Wrap-around Portals' : '🛡️ Classic Wall Death';

      if (isWrap) {
        this.boardContainer.classList.add('wrap-mode');
      } else {
        this.boardContainer.classList.remove('wrap-mode');
      }
    }

    toggleSound() {
      const isMuted = this.sound.toggleMute();
      this.updateSoundUI();
    }

    updateSoundUI() {
      if (this.sound.isMuted) {
        this.soundIconOn.classList.add('hidden');
        this.soundIconOff.classList.remove('hidden');
      } else {
        this.soundIconOn.classList.remove('hidden');
        this.soundIconOff.classList.add('hidden');
      }
    }

    startRenderLoop() {
      const loop = (timestamp) => {
        if (this.state === 'PLAYING') {
          if (timestamp - this.lastTickTime >= this.tickInterval) {
            this.updateGameLogic();
            this.lastTickTime = timestamp;
          }
        }
        this.render(timestamp);
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }

    render(timestamp) {
      const width = this.canvas.width;
      const height = this.canvas.height;
      const ts = this.tileSize;
      const ctx = this.ctx;

      ctx.save();

      if (this.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        ctx.translate(sx, sy);
        this.screenShake *= 0.88;
        if (this.screenShake < 0.5) this.screenShake = 0;
      }

      ctx.fillStyle = '#080C14';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.beginPath();
      for (let x = ts; x < width; x += ts) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = ts; y < height; y += ts) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Boundaries
      if (this.boundaryMode === 'wrap') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06B6D4';
        ctx.strokeRect(1, 1, width - 2, height - 2);
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeRect(1, 1, width - 2, height - 2);
      }

      // Food
      if (this.food) {
        const fx = this.food.x * ts + ts / 2;
        const fy = this.food.y * ts + ts / 2;
        const pulse = Math.sin(timestamp * 0.007) * 2;
        const radius = (ts / 2) * 0.72 + pulse;

        ctx.shadowBlur = 16;
        ctx.shadowColor = '#F43F5E';
        const grad = ctx.createRadialGradient(fx - radius * 0.3, fy - radius * 0.3, 1, fx, fy, radius);
        grad.addColorStop(0, '#FDA4AF');
        grad.addColorStop(0.5, '#F43F5E');
        grad.addColorStop(1, '#BE123C');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx, fy, Math.max(3, radius), 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx + 2, fy - radius, 4, 0, Math.PI * 0.6);
        ctx.stroke();
      }

      // Golden Bonus Food
      if (this.bonusFood) {
        const bx = this.bonusFood.x * ts + ts / 2;
        const by = this.bonusFood.y * ts + ts / 2;
        const pulse = Math.sin(timestamp * 0.012) * 3;
        const radius = (ts / 2) * 0.78 + pulse;
        const elapsed = timestamp - this.bonusFood.spawnTime;
        const timeLeftRatio = Math.max(0, 1 - elapsed / this.bonusFood.duration);

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#F59E0B';
        const grad = ctx.createRadialGradient(bx - radius * 0.3, by - radius * 0.3, 1, bx, by, radius);
        grad.addColorStop(0, '#FEF08A');
        grad.addColorStop(0.5, '#F59E0B');
        grad.addColorStop(1, '#B45309');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(3, radius), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, ts * 0.52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeLeftRatio);
        ctx.stroke();
      }

      // Snake
      if (this.snake.length > 0) {
        const len = this.snake.length;
        for (let i = len - 1; i >= 0; i--) {
          const seg = this.snake[i];
          const cx = seg.x * ts + ts / 2;
          const cy = seg.y * ts + ts / 2;

          ctx.save();
          if (i === 0) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#10B981';
            const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.5);
            grad.addColorStop(0, '#6EE7B7');
            grad.addColorStop(1, '#059669');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.roundRect(seg.x * ts + 2, seg.y * ts + 2, ts - 4, ts - 4, 8);
            ctx.fill();

            // Eyes
            const eyeOffset = ts * 0.22;
            const eyeRadius = ts * 0.12;
            const pupilRadius = ts * 0.06;
            let lx, ly, rx, ry, px = 0, py = 0;

            if (this.direction === DIRECTIONS.UP) {
              lx = cx - eyeOffset; rx = cx + eyeOffset; ly = ry = cy - eyeOffset; py = -1.5;
            } else if (this.direction === DIRECTIONS.DOWN) {
              lx = cx - eyeOffset; rx = cx + eyeOffset; ly = ry = cy + eyeOffset; py = 1.5;
            } else if (this.direction === DIRECTIONS.LEFT) {
              lx = rx = cx - eyeOffset; ly = cy - eyeOffset; ry = cy + eyeOffset; px = -1.5;
            } else {
              lx = rx = cx + eyeOffset; ly = cy - eyeOffset; ry = cy + eyeOffset; px = 1.5;
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(lx, ly, eyeRadius, 0, Math.PI * 2);
            ctx.arc(rx, ry, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#064E3B';
            ctx.beginPath();
            ctx.arc(lx + px, ly + py, pupilRadius, 0, Math.PI * 2);
            ctx.arc(rx + px, ry + py, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const ratio = 1 - i / len;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.25)';
            const g = Math.round(180 + ratio * 35);
            ctx.fillStyle = `rgb(16, ${g}, ${Math.round(120 + ratio * 30)})`;
            const p = 2 + (1 - ratio) * 2;
            ctx.beginPath();
            ctx.roundRect(seg.x * ts + p, seg.y * ts + p, ts - p * 2, ts - p * 2, 6);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Particles & Floating Text
      this.particles = this.particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw(ctx);
        return alive;
      });

      this.floatingTexts = this.floatingTexts.filter(t => {
        const alive = t.update();
        if (alive) t.draw(ctx);
        return alive;
      });

      ctx.restore();
    }

    bindEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.resumeBtn.addEventListener('click', () => this.resume());
      this.restartFromPauseBtn.addEventListener('click', () => this.start());
      this.playAgainBtn.addEventListener('click', () => this.start());

      this.modeToggleBtn.addEventListener('click', () => this.toggleBoundaryMode());
      this.soundToggleBtn.addEventListener('click', () => this.toggleSound());

      const bind = (id, dir) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.queueDirection(dir);
          el.classList.add('active');
          setTimeout(() => el.classList.remove('active'), 150);
        });
      };
      bind('v2-dpad-up', DIRECTIONS.UP);
      bind('v2-dpad-down', DIRECTIONS.DOWN);
      bind('v2-dpad-left', DIRECTIONS.LEFT);
      bind('v2-dpad-right', DIRECTIONS.RIGHT);

      document.getElementById('v2-dpad-center').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.togglePause();
      });

      // Swipe Gestures
      let sx = 0, sy = 0;
      this.boardContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        }
      }, { passive: true });

      this.boardContainer.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });

      this.boardContainer.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        if (Math.max(adx, ady) > 22) {
          if (adx > ady) {
            this.queueDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
          } else {
            this.queueDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
          }
        } else {
          if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
            this.start();
          }
        }
      }, { passive: true });
    }
  }

  // --------------------------------------------------------------------------
  // CENTRAL HUB MANAGER & ROUTER
  // --------------------------------------------------------------------------
  class HubManager {
    constructor() {
      this.activeView = 'hub'; // 'hub' | 'v1' | 'v2'

      this.hubView = document.getElementById('hub-view');
      this.v1View = document.getElementById('v1-view');
      this.v2View = document.getElementById('v2-view');

      this.v1Card = document.getElementById('select-v1-card');
      this.v2Card = document.getElementById('select-v2-card');

      this.hubV1Best = document.getElementById('hub-v1-best');
      this.hubV2Best = document.getElementById('hub-v2-best');

      this.v1BackBtn = document.getElementById('v1-back-btn');
      this.v2BackBtn = document.getElementById('v2-back-btn');

      // Shared Help Modal
      this.helpBtn = document.getElementById('v2-help-btn');
      this.helpModal = document.getElementById('help-modal');
      this.closeModalBtn = document.getElementById('close-modal-btn');
      this.modalOkBtn = document.getElementById('modal-ok-btn');

      // Initialize Engines
      this.classicGame = new ClassicSnakeGame();
      this.nextGenGame = new NextGenSnakeGame();

      this.bindRouter();
      this.updateHubScores();
    }

    updateHubScores() {
      try {
        const v1High = localStorage.getItem(STORAGE_KEYS.V1_HIGH) || '0';
        const v2High = localStorage.getItem(STORAGE_KEYS.V2_HIGH) || '0';
        this.hubV1Best.textContent = v1High.padStart(3, '0');
        this.hubV2Best.textContent = v2High.padStart(3, '0');
      } catch (e) {}
    }

    navigateTo(target) {
      if (this.activeView === target) return;

      // Clean up previous view
      if (this.activeView === 'v1') {
        this.classicGame.stopGame();
      } else if (this.activeView === 'v2') {
        this.nextGenGame.stop();
      }

      this.activeView = target;

      // Toggle views
      this.hubView.classList.toggle('hidden', target !== 'hub');
      this.v1View.classList.toggle('hidden', target !== 'v1');
      this.v2View.classList.toggle('hidden', target !== 'v2');

      // Apply body background switch for v1 vs hub/v2
      if (target === 'v1') {
        document.body.style.backgroundColor = 'var(--v1-body-bg)';
      } else {
        document.body.style.backgroundColor = 'var(--bg-dark)';
      }

      if (target === 'hub') {
        this.updateHubScores();
      } else if (target === 'v1') {
        this.classicGame.draw();
      } else if (target === 'v2') {
        this.nextGenGame.setupCanvas();
        this.nextGenGame.initIdleBoard();
      }
    }

    bindRouter() {
      // Card clicks
      this.v1Card.addEventListener('click', () => this.navigateTo('v1'));
      this.v2Card.addEventListener('click', () => this.navigateTo('v2'));

      // Keyboard navigation in hub
      this.v1Card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigateTo('v1');
        }
      });
      this.v2Card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigateTo('v2');
        }
      });

      // Back Buttons
      this.v1BackBtn.addEventListener('click', () => this.navigateTo('hub'));
      this.v2BackBtn.addEventListener('click', () => this.navigateTo('hub'));

      // Help Modal
      const openModal = () => {
        if (typeof this.helpModal.showModal === 'function') {
          this.helpModal.showModal();
        } else {
          this.helpModal.setAttribute('open', '');
        }
      };
      const closeModal = () => {
        if (typeof this.helpModal.close === 'function') {
          this.helpModal.close();
        } else {
          this.helpModal.removeAttribute('open');
        }
      };

      this.helpBtn.addEventListener('click', openModal);
      this.closeModalBtn.addEventListener('click', closeModal);
      this.modalOkBtn.addEventListener('click', closeModal);
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) closeModal();
      });

      // Window Resize Listener
      window.addEventListener('resize', () => {
        if (this.activeView === 'v2') this.nextGenGame.setupCanvas();
      });

      // Global Keyboard Router
      window.addEventListener('keydown', (e) => {
        const key = e.code || e.key;

        // Prevent scrolling on arrows/space
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
          e.preventDefault();
        }

        // Return to Hub with Escape
        if (key === 'Escape' && this.activeView !== 'hub') {
          this.navigateTo('hub');
          return;
        }

        // Route to Classic Snake (v1)
        if (this.activeView === 'v1') {
          if (!this.classicGame.gameStarted && (key === 'Space' || e.key === ' ')) {
            this.classicGame.startGame();
          } else {
            switch (key) {
              case 'ArrowUp': case 'KeyW': this.classicGame.queueDirection('up'); break;
              case 'ArrowDown': case 'KeyS': this.classicGame.queueDirection('down'); break;
              case 'ArrowLeft': case 'KeyA': this.classicGame.queueDirection('left'); break;
              case 'ArrowRight': case 'KeyD': this.classicGame.queueDirection('right'); break;
            }
          }
        }
        // Route to Next-Gen Snake (v2)
        else if (this.activeView === 'v2') {
          switch (key) {
            case 'ArrowUp': case 'KeyW': this.nextGenGame.queueDirection(DIRECTIONS.UP); break;
            case 'ArrowDown': case 'KeyS': this.nextGenGame.queueDirection(DIRECTIONS.DOWN); break;
            case 'ArrowLeft': case 'KeyA': this.nextGenGame.queueDirection(DIRECTIONS.LEFT); break;
            case 'ArrowRight': case 'KeyD': this.nextGenGame.queueDirection(DIRECTIONS.RIGHT); break;
            case 'Space':
              if (this.nextGenGame.state === 'IDLE' || this.nextGenGame.state === 'GAME_OVER') {
                this.nextGenGame.start();
              } else {
                this.nextGenGame.togglePause();
              }
              break;
            case 'KeyP': this.nextGenGame.togglePause(); break;
            case 'KeyM': this.nextGenGame.toggleSound(); break;
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Bootstrap Application
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    window.snakeArcadeHub = new HubManager();
  });
})();