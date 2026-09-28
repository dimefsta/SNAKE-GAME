/**
 * ============================================================================
 * SNAKE 2.0 // NEXT-GEN ARCADE ENGINE
 * Senior Frontend Architecture: State Machine, High-DPI Canvas, Web Audio API,
 * Anti-Collision Direction Queue, Particle Systems, and Touch Navigation.
 * ============================================================================
 */

'use strict';

// IIFE to isolate scope and prevent global namespace pollution
(() => {
  // --------------------------------------------------------------------------
  // Configuration & Constants
  // --------------------------------------------------------------------------
  const CONFIG = {
    gridSize: 20, // 20x20 tile board
    baseSpeedMs: 140, // Starting tick delay
    minSpeedMs: 55, // Max speed cap
    speedStepMs: 4, // Acceleration per level
    applesPerLevel: 5, // Food required to level up
    bonusFoodChance: 0.18, // 18% chance of spawning golden bonus food
    bonusDurationMs: 6500, // Golden food disappears after 6.5s
    storageKeyHigh: 'snake2_high_score',
    storageKeyMuted: 'snake2_sound_muted',
    storageKeyMode: 'snake2_boundary_mode',
  };

  const GAME_STATE = {
    IDLE: 'IDLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
  };

  const BOUNDARY_MODE = {
    CLASSIC: 'classic', // Hit wall = Game Over
    WRAP: 'wrap', // Pass through walls
  };

  const DIRECTIONS = {
    UP: { x: 0, y: -1, name: 'up' },
    DOWN: { x: 0, y: 1, name: 'down' },
    LEFT: { x: -1, y: 0, name: 'left' },
    RIGHT: { x: 1, y: 0, name: 'right' },
  };

  // --------------------------------------------------------------------------
  // DOM References
  // --------------------------------------------------------------------------
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const boardContainer = document.getElementById('board-container');

  // Stats displays
  const scoreDisplay = document.getElementById('score-display');
  const highScoreDisplay = document.getElementById('high-score-display');
  const levelDisplay = document.getElementById('level-display');

  // Overlays & Modals
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const overlayModeTag = document.getElementById('overlay-mode-tag');

  // Game over summary
  const summaryScore = document.getElementById('summary-score');
  const summaryApples = document.getElementById('summary-apples');
  const summaryLevel = document.getElementById('summary-level');
  const newHighScoreBanner = document.getElementById('new-high-score-banner');

  // Buttons
  const startBtn = document.getElementById('start-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const modeIcon = document.getElementById('mode-icon');
  const modeName = document.getElementById('mode-name');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOkBtn = document.getElementById('modal-ok-btn');

  // D-Pad buttons
  const dpadUp = document.getElementById('btn-up');
  const dpadDown = document.getElementById('btn-down');
  const dpadLeft = document.getElementById('btn-left');
  const dpadRight = document.getElementById('btn-right');
  const dpadCenter = document.getElementById('btn-center');

  // --------------------------------------------------------------------------
  // Audio Synthesizer (Native Web Audio API)
  // --------------------------------------------------------------------------
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.loadPreference();
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    loadPreference() {
      try {
        const saved = localStorage.getItem(CONFIG.storageKeyMuted);
        this.isMuted = saved === 'true';
      } catch (e) {
        this.isMuted = false;
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem(CONFIG.storageKeyMuted, this.isMuted.toString());
      } catch (e) {
        // Safe localStorage fallback
      }
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
        // Multi-frequency golden chime
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Crisp energetic bubble pop
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
  // Particle & Juice System
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

    draw(context) {
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.fillStyle = this.color;
      context.shadowBlur = 8;
      context.shadowColor = this.color;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
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

    draw(context) {
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.font = 'bold 14px "JetBrains Mono", monospace';
      context.fillStyle = this.color;
      context.shadowBlur = 6;
      context.shadowColor = this.color;
      context.textAlign = 'center';
      context.fillText(this.text, this.x, this.y);
      context.restore();
    }
  }

  // Defensive roundRect polyfill for older browsers/webviews
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii = 0) {
      const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // --------------------------------------------------------------------------
  // Main Game Engine
  // --------------------------------------------------------------------------
  class SnakeGame {
    constructor() {
      this.sound = new SoundFX();
      this.state = GAME_STATE.IDLE;
      this.boundaryMode = BOUNDARY_MODE.CLASSIC;

      // Score & Progression
      this.score = 0;
      this.highScore = 0;
      this.level = 1;
      this.applesEaten = 0;
      this.applesThisLevel = 0;

      // Entities
      this.snake = [];
      this.direction = DIRECTIONS.RIGHT;
      this.nextDirection = DIRECTIONS.RIGHT;
      this.inputQueue = []; // Double-buffer for rapid keypresses
      this.food = null;
      this.bonusFood = null;
      this.bonusTimer = null;

      // Visuals
      this.particles = [];
      this.floatingTexts = [];
      this.screenShake = 0;
      this.tileSize = 30; // Logical tile size calculated on resize

      // Timing Loop
      this.lastTickTime = 0;
      this.tickInterval = CONFIG.baseSpeedMs;
      this.animFrameId = null;

      // Setup
      this.loadSettings();
      this.setupCanvas();
      this.initIdleBoard();
      this.bindEvents();
      this.updateHud();
      this.updateModeUI();
      this.updateSoundUI();

      // Start animation render loop
      this.startRenderLoop();
    }

    initIdleBoard() {
      const startX = Math.floor(CONFIG.gridSize / 2);
      const startY = Math.floor(CONFIG.gridSize / 2);
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];
      this.food = { x: startX + 4, y: startY };
    }

    // ------------------------------------------------------------------------
    // Initialization & Storage
    // ------------------------------------------------------------------------
    loadSettings() {
      try {
        const savedHigh = localStorage.getItem(CONFIG.storageKeyHigh);
        if (savedHigh !== null) {
          this.highScore = parseInt(savedHigh, 10) || 0;
        }

        const savedMode = localStorage.getItem(CONFIG.storageKeyMode);
        if (savedMode === BOUNDARY_MODE.WRAP || savedMode === BOUNDARY_MODE.CLASSIC) {
          this.boundaryMode = savedMode;
        }
      } catch (e) {
        console.warn('Storage unavailable:', e);
      }
    }

    saveHighScore() {
      try {
        localStorage.setItem(CONFIG.storageKeyHigh, this.highScore.toString());
      } catch (e) {
        // Safe fallback
      }
    }

    saveMode() {
      try {
        localStorage.setItem(CONFIG.storageKeyMode, this.boundaryMode);
      } catch (e) {
        // Safe fallback
      }
    }

    setupCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width > 0 ? rect.width : 400;
      const displayHeight = rect.height > 0 ? rect.height : 400;
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);
      this.tileSize = canvas.width / CONFIG.gridSize;
    }

    // ------------------------------------------------------------------------
    // Game Lifecycle Management
    // ------------------------------------------------------------------------
    reset() {
      this.score = 0;
      this.level = 1;
      this.applesEaten = 0;
      this.applesThisLevel = 0;
      this.tickInterval = CONFIG.baseSpeedMs;

      // Spawn initial 3-segment snake centered
      const startX = Math.floor(CONFIG.gridSize / 2);
      const startY = Math.floor(CONFIG.gridSize / 2);
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];

      this.direction = DIRECTIONS.RIGHT;
      this.nextDirection = DIRECTIONS.RIGHT;
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
      this.state = GAME_STATE.PLAYING;
      this.lastTickTime = performance.now();

      // Hide Overlays
      startOverlay.classList.add('hidden');
      pauseOverlay.classList.add('hidden');
      gameOverOverlay.classList.add('hidden');
    }

    pause() {
      if (this.state === GAME_STATE.PLAYING) {
        this.state = GAME_STATE.PAUSED;
        pauseOverlay.classList.remove('hidden');
      }
    }

    resume() {
      if (this.state === GAME_STATE.PAUSED) {
        this.state = GAME_STATE.PLAYING;
        this.lastTickTime = performance.now();
        pauseOverlay.classList.add('hidden');
      }
    }

    togglePause() {
      if (this.state === GAME_STATE.PLAYING) {
        this.pause();
      } else if (this.state === GAME_STATE.PAUSED) {
        this.resume();
      } else if (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.GAME_OVER) {
        this.start();
      }
    }

    gameOver() {
      this.state = GAME_STATE.GAME_OVER;
      this.sound.playCrash();
      this.screenShake = 16;
      this.triggerHaptic([40, 30, 60]);

      // Spawn crash dispersion particles
      const head = this.snake[0];
      const px = head.x * this.tileSize + this.tileSize / 2;
      const py = head.y * this.tileSize + this.tileSize / 2;
      for (let i = 0; i < 28; i++) {
        this.particles.push(new Particle(px, py, '#F43F5E'));
      }

      // Check high score
      let isNewRecord = false;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore();
        isNewRecord = true;
      }

      // Populate Game Over overlay
      summaryScore.textContent = this.score.toString();
      summaryApples.textContent = this.applesEaten.toString();
      summaryLevel.textContent = this.level.toString();

      if (isNewRecord) {
        newHighScoreBanner.classList.remove('hidden');
      } else {
        newHighScoreBanner.classList.add('hidden');
      }

      this.updateHud();

      // Show Game Over modal after brief dramatic delay
      setTimeout(() => {
        if (this.state === GAME_STATE.GAME_OVER) {
          gameOverOverlay.classList.remove('hidden');
        }
      }, 350);
    }

    // ------------------------------------------------------------------------
    // Mechanics: Movement & Collisions
    // ------------------------------------------------------------------------
    updateGameLogic() {
      if (this.state !== GAME_STATE.PLAYING) return;

      // Dequeue next validated direction
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }

      // Compute next head position
      const currentHead = this.snake[0];
      let newX = currentHead.x + this.direction.x;
      let newY = currentHead.y + this.direction.y;

      // Handle Boundaries
      if (this.boundaryMode === BOUNDARY_MODE.WRAP) {
        // Portal Wrap-around
        if (newX < 0) newX = CONFIG.gridSize - 1;
        else if (newX >= CONFIG.gridSize) newX = 0;

        if (newY < 0) newY = CONFIG.gridSize - 1;
        else if (newY >= CONFIG.gridSize) newY = 0;
      } else {
        // Classic Wall Collision
        if (newX < 0 || newX >= CONFIG.gridSize || newY < 0 || newY >= CONFIG.gridSize) {
          this.gameOver();
          return;
        }
      }

      // Self-collision check (skip checking tail if snake won't grow this tick)
      const willEatFood = (newX === this.food.x && newY === this.food.y);
      const willEatBonus = this.bonusFood && (newX === this.bonusFood.x && newY === this.bonusFood.y);
      const bodyToCheck = (willEatFood || willEatBonus) ? this.snake : this.snake.slice(0, -1);

      if (bodyToCheck.some(seg => seg.x === newX && seg.y === newY)) {
        this.gameOver();
        return;
      }

      // Move Snake Head
      const newHead = { x: newX, y: newY };
      this.snake.unshift(newHead);

      // Check Food Eaten
      if (willEatFood) {
        this.onFoodEaten(false);
      } else if (willEatBonus) {
        this.onFoodEaten(true);
      } else {
        // Pop tail if no food eaten
        this.snake.pop();
      }
    }

    onFoodEaten(isBonus) {
      const points = isBonus ? 30 : 10;
      this.score += points;
      this.applesEaten++;
      this.triggerHaptic(20);

      const targetFood = isBonus ? this.bonusFood : this.food;
      const px = targetFood.x * this.tileSize + this.tileSize / 2;
      const py = targetFood.y * this.tileSize + this.tileSize / 2;

      // Sound & Visual Juice
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

        // Level Up Check
        if (this.applesThisLevel >= CONFIG.applesPerLevel) {
          this.levelUp();
        }

        // Generate new regular food
        this.food = this.generateFood();

        // Maybe spawn bonus golden food
        if (!this.bonusFood && Math.random() < CONFIG.bonusFoodChance) {
          this.spawnBonusFood();
        }
      }

      // Update High Score live if surpassed
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

      // Speed up game ticks smoothly
      this.tickInterval = Math.max(
        CONFIG.minSpeedMs,
        CONFIG.baseSpeedMs - (this.level - 1) * CONFIG.speedStepMs
      );

      const head = this.snake[0];
      const px = head.x * this.tileSize + this.tileSize / 2;
      const py = head.y * this.tileSize + this.tileSize / 2;
      this.floatingTexts.push(new FloatingText(`LEVEL ${this.level}!`, px, py - 20, '#06B6D4'));
    }

    // ------------------------------------------------------------------------
    // Entity Generation (Safe O(N) Algorithm)
    // ------------------------------------------------------------------------
    generateFood() {
      const occupied = new Set();
      this.snake.forEach(seg => occupied.add(`${seg.x},${seg.y}`));
      if (this.bonusFood) {
        occupied.add(`${this.bonusFood.x},${this.bonusFood.y}`);
      }

      const availableSpots = [];
      for (let x = 0; x < CONFIG.gridSize; x++) {
        for (let y = 0; y < CONFIG.gridSize; y++) {
          if (!occupied.has(`${x},${y}`)) {
            availableSpots.push({ x, y });
          }
        }
      }

      if (availableSpots.length === 0) {
        // Player filled the entire board! Victory!
        this.gameOver();
        return { x: 0, y: 0 };
      }

      const randomIdx = Math.floor(Math.random() * availableSpots.length);
      return availableSpots[randomIdx];
    }

    spawnBonusFood() {
      this.clearBonusFood();
      const pos = this.generateFood();
      this.bonusFood = {
        ...pos,
        spawnTime: performance.now(),
        duration: CONFIG.bonusDurationMs,
      };

      this.bonusTimer = setTimeout(() => {
        this.clearBonusFood();
      }, CONFIG.bonusDurationMs);
    }

    clearBonusFood() {
      if (this.bonusTimer) {
        clearTimeout(this.bonusTimer);
        this.bonusTimer = null;
      }
      this.bonusFood = null;
    }

    // ------------------------------------------------------------------------
    // Input Handling (Buffer & Anti-Suicide Guard)
    // ------------------------------------------------------------------------
    queueDirection(newDir) {
      if (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.GAME_OVER) {
        this.start();
        return;
      }
      if (this.state === GAME_STATE.PAUSED) {
        this.resume();
      }

      // Check against current queued directions or active direction
      const lastPlannedDir = this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;

      // Prevent 180° immediate reversal
      if (
        newDir.x === -lastPlannedDir.x &&
        newDir.y === -lastPlannedDir.y
      ) {
        return;
      }

      // Prevent duplicate queued direction
      if (
        newDir.x === lastPlannedDir.x &&
        newDir.y === lastPlannedDir.y
      ) {
        return;
      }

      // Buffer max 2 inputs to prevent queue lag
      if (this.inputQueue.length < 2) {
        this.inputQueue.push(newDir);
        this.triggerHaptic(8);
      }
    }

    triggerHaptic(pattern = 10) {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(pattern);
        } catch (e) {
          // Ignore vibration restrictions
        }
      }
    }

    // ------------------------------------------------------------------------
    // UI & Mode Updates
    // ------------------------------------------------------------------------
    updateHud() {
      scoreDisplay.textContent = this.score.toString().padStart(3, '0');
      highScoreDisplay.textContent = this.highScore.toString().padStart(3, '0');
      levelDisplay.textContent = this.level.toString().padStart(2, '0');
    }

    toggleBoundaryMode() {
      this.boundaryMode = this.boundaryMode === BOUNDARY_MODE.CLASSIC
        ? BOUNDARY_MODE.WRAP
        : BOUNDARY_MODE.CLASSIC;
      this.saveMode();
      this.updateModeUI();
    }

    updateModeUI() {
      const isWrap = this.boundaryMode === BOUNDARY_MODE.WRAP;
      modeIcon.textContent = isWrap ? '🌐' : '🛡️';
      modeName.textContent = isWrap ? 'Wrap' : 'Classic';
      overlayModeTag.textContent = isWrap ? '🌐 Wrap-around Portals' : '🛡️ Classic Wall Death';

      if (isWrap) {
        boardContainer.classList.add('wrap-mode');
      } else {
        boardContainer.classList.remove('wrap-mode');
      }
    }

    toggleSound() {
      const isMuted = this.sound.toggleMute();
      this.updateSoundUI();
    }

    updateSoundUI() {
      if (this.sound.isMuted) {
        soundIconOn.classList.add('hidden');
        soundIconOff.classList.remove('hidden');
      } else {
        soundIconOn.classList.remove('hidden');
        soundIconOff.classList.add('hidden');
      }
    }

    // ------------------------------------------------------------------------
    // Rendering & Animation Loop (60+ FPS)
    // ------------------------------------------------------------------------
    startRenderLoop() {
      const loop = (timestamp) => {
        // Handle Logic Ticks
        if (this.state === GAME_STATE.PLAYING) {
          if (timestamp - this.lastTickTime >= this.tickInterval) {
            this.updateGameLogic();
            this.lastTickTime = timestamp;
          }
        }

        // Render Frame
        this.render(timestamp);

        this.animFrameId = requestAnimationFrame(loop);
      };

      this.animFrameId = requestAnimationFrame(loop);
    }

    render(timestamp) {
      const width = canvas.width;
      const height = canvas.height;
      const ts = this.tileSize;

      ctx.save();

      // Screen Shake handling
      if (this.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        ctx.translate(sx, sy);
        this.screenShake *= 0.88;
        if (this.screenShake < 0.5) this.screenShake = 0;
      }

      // Background Clear
      ctx.fillStyle = '#080C14';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Matrix
      this.drawGrid(width, height, ts);

      // Draw Boundary Highlights
      this.drawBoundaries(width, height);

      // Draw Food Items
      this.drawFood(timestamp, ts);

      // Draw Snake
      this.drawSnake(ts);

      // Draw Particles & Floating Scores
      this.drawJuice();

      ctx.restore();
    }

    drawGrid(w, h, ts) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.beginPath();
      for (let x = ts; x < w; x += ts) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = ts; y < h; y += ts) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawBoundaries(w, h) {
      ctx.save();
      if (this.boundaryMode === BOUNDARY_MODE.WRAP) {
        // Portal neon lines
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06B6D4';
        ctx.strokeRect(1, 1, w - 2, h - 2);
      } else {
        // Classic solid wall border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeRect(1, 1, w - 2, h - 2);
      }
      ctx.restore();
    }

    drawFood(timestamp, ts) {
      // 1. Regular Apple Food
      if (this.food) {
        const fx = this.food.x * ts + ts / 2;
        const fy = this.food.y * ts + ts / 2;
        const pulse = Math.sin(timestamp * 0.007) * 2;
        const radius = (ts / 2) * 0.72 + pulse;

        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#F43F5E';

        // Radiant glow gradient
        const grad = ctx.createRadialGradient(fx - radius * 0.3, fy - radius * 0.3, 1, fx, fy, radius);
        grad.addColorStop(0, '#FDA4AF');
        grad.addColorStop(0.5, '#F43F5E');
        grad.addColorStop(1, '#BE123C');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx, fy, Math.max(3, radius), 0, Math.PI * 2);
        ctx.fill();

        // Apple Stem
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx + 2, fy - radius, 4, 0, Math.PI * 0.6);
        ctx.stroke();

        ctx.restore();
      }

      // 2. Golden Bonus Food
      if (this.bonusFood) {
        const bx = this.bonusFood.x * ts + ts / 2;
        const by = this.bonusFood.y * ts + ts / 2;
        const pulse = Math.sin(timestamp * 0.012) * 3;
        const radius = (ts / 2) * 0.78 + pulse;

        // Shrinking timer ring around bonus
        const elapsed = timestamp - this.bonusFood.spawnTime;
        const timeLeftRatio = Math.max(0, 1 - elapsed / this.bonusFood.duration);

        ctx.save();
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

        // Timer Arc
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, ts * 0.52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeLeftRatio);
        ctx.stroke();

        ctx.restore();
      }
    }

    drawSnake(ts) {
      if (this.snake.length === 0) return;

      const len = this.snake.length;

      // Draw body segments with smooth rounded connections
      for (let i = len - 1; i >= 0; i--) {
        const seg = this.snake[i];
        const cx = seg.x * ts + ts / 2;
        const cy = seg.y * ts + ts / 2;

        ctx.save();
        if (i === 0) {
          // Snake Head
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#10B981';

          const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.5);
          grad.addColorStop(0, '#6EE7B7');
          grad.addColorStop(1, '#059669');
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.roundRect(seg.x * ts + 2, seg.y * ts + 2, ts - 4, ts - 4, 8);
          ctx.fill();

          // Render directional eyes
          this.drawEyes(cx, cy, ts);
        } else {
          // Body Segment (Gradient from bright mint to deep emerald)
          const ratio = 1 - i / len;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.25)';

          // Smooth interpolation color
          const g = Math.round(180 + ratio * 35);
          ctx.fillStyle = `rgb(16, ${g}, ${Math.round(120 + ratio * 30)})`;

          const padding = 2 + (1 - ratio) * 2;
          ctx.beginPath();
          ctx.roundRect(
            seg.x * ts + padding,
            seg.y * ts + padding,
            ts - padding * 2,
            ts - padding * 2,
            6
          );
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawEyes(cx, cy, ts) {
      ctx.save();
      const eyeOffset = ts * 0.22;
      const eyeRadius = ts * 0.12;
      const pupilRadius = ts * 0.06;

      let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
      let pupilX = 0, pupilY = 0;

      // Position eyes based on movement direction
      if (this.direction === DIRECTIONS.UP) {
        leftEyeX = cx - eyeOffset;
        rightEyeX = cx + eyeOffset;
        leftEyeY = rightEyeY = cy - eyeOffset;
        pupilY = -1.5;
      } else if (this.direction === DIRECTIONS.DOWN) {
        leftEyeX = cx - eyeOffset;
        rightEyeX = cx + eyeOffset;
        leftEyeY = rightEyeY = cy + eyeOffset;
        pupilY = 1.5;
      } else if (this.direction === DIRECTIONS.LEFT) {
        leftEyeX = rightEyeX = cx - eyeOffset;
        leftEyeY = cy - eyeOffset;
        rightEyeY = cy + eyeOffset;
        pupilX = -1.5;
      } else {
        // RIGHT
        leftEyeX = rightEyeX = cx + eyeOffset;
        leftEyeY = cy - eyeOffset;
        rightEyeY = cy + eyeOffset;
        pupilX = 1.5;
      }

      // Eye Whites
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
      ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Dark Pupils
      ctx.fillStyle = '#064E3B';
      ctx.beginPath();
      ctx.arc(leftEyeX + pupilX, leftEyeY + pupilY, pupilRadius, 0, Math.PI * 2);
      ctx.arc(rightEyeX + pupilX, rightEyeY + pupilY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawJuice() {
      // Update & Draw Particles
      this.particles = this.particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw(ctx);
        return alive;
      });

      // Update & Draw Floating Score Popups
      this.floatingTexts = this.floatingTexts.filter(t => {
        const alive = t.update();
        if (alive) t.draw(ctx);
        return alive;
      });
    }

    // ------------------------------------------------------------------------
    // Event Listeners & Input Bindings
    // ------------------------------------------------------------------------
    bindEvents() {
      // Window Resize (keep canvas crisp)
      window.addEventListener('resize', () => {
        this.setupCanvas();
      });

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        const key = e.code || e.key;

        // Prevent browser scrolling on gaming keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
          e.preventDefault();
        }

        switch (key) {
          case 'ArrowUp':
          case 'KeyW':
            this.queueDirection(DIRECTIONS.UP);
            break;
          case 'ArrowDown':
          case 'KeyS':
            this.queueDirection(DIRECTIONS.DOWN);
            break;
          case 'ArrowLeft':
          case 'KeyA':
            this.queueDirection(DIRECTIONS.LEFT);
            break;
          case 'ArrowRight':
          case 'KeyD':
            this.queueDirection(DIRECTIONS.RIGHT);
            break;
          case 'Space':
            if (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.GAME_OVER) {
              this.start();
            } else if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED) {
              this.togglePause();
            }
            break;
          case 'KeyP':
          case 'Escape':
            this.togglePause();
            break;
          case 'KeyM':
            this.toggleSound();
            break;
        }
      });

      // Overlay Action Buttons
      startBtn.addEventListener('click', () => this.start());
      resumeBtn.addEventListener('click', () => this.resume());
      restartFromPauseBtn.addEventListener('click', () => this.start());
      playAgainBtn.addEventListener('click', () => this.start());

      // Header Actions
      modeToggleBtn.addEventListener('click', () => this.toggleBoundaryMode());
      soundToggleBtn.addEventListener('click', () => this.toggleSound());

      // Help Modal Dialog
      helpBtn.addEventListener('click', () => {
        if (typeof helpModal.showModal === 'function') {
          helpModal.showModal();
        } else {
          helpModal.setAttribute('open', '');
        }
      });

      const closeModal = () => {
        if (typeof helpModal.close === 'function') {
          helpModal.close();
        } else {
          helpModal.removeAttribute('open');
        }
      };

      closeModalBtn.addEventListener('click', closeModal);
      modalOkBtn.addEventListener('click', closeModal);
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) closeModal();
      });

      // Virtual D-Pad Touch Handlers
      const bindDpad = (element, dir) => {
        const handler = (e) => {
          e.preventDefault();
          this.queueDirection(dir);
          element.classList.add('active');
          setTimeout(() => element.classList.remove('active'), 150);
        };
        element.addEventListener('pointerdown', handler);
      };

      bindDpad(dpadUp, DIRECTIONS.UP);
      bindDpad(dpadDown, DIRECTIONS.DOWN);
      bindDpad(dpadLeft, DIRECTIONS.LEFT);
      bindDpad(dpadRight, DIRECTIONS.RIGHT);

      dpadCenter.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.togglePause();
      });

      // Mobile Touch Swipe Detection on Board Container
      let touchStartX = 0;
      let touchStartY = 0;
      const minSwipeDistance = 24;

      boardContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      boardContainer.addEventListener('touchmove', (e) => {
        // Prevent bounce scroll when interacting with game board
        if (e.cancelable) e.preventDefault();
      }, { passive: false });

      boardContainer.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        if (Math.max(absX, absY) > minSwipeDistance) {
          if (absX > absY) {
            // Horizontal Swipe
            if (diffX > 0) {
              this.queueDirection(DIRECTIONS.RIGHT);
            } else {
              this.queueDirection(DIRECTIONS.LEFT);
            }
          } else {
            // Vertical Swipe
            if (diffY > 0) {
              this.queueDirection(DIRECTIONS.DOWN);
            } else {
              this.queueDirection(DIRECTIONS.UP);
            }
          }
        } else {
          // Tap on board to start/pause
          if (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.GAME_OVER) {
            this.start();
          }
        }
      }, { passive: true });
    }
  }

  // --------------------------------------------------------------------------
  // Bootstrap Application on DOM Ready
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    window.snakeGameInstance = new SnakeGame();
  });
})();