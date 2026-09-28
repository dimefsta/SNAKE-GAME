# 🐍 Snake Arcade // Classic vs Next-Gen

A modern, minimalist, and responsive multi-game arcade hub featuring **Classic Retro 1997 Snake (v1)** and **Next-Gen Cyber 2026 Snake (v2)** built with pure vanilla HTML5, CSS3, and JavaScript.

Live Preview: [snake-game-red.vercel.app](https://snake-game-red.vercel.app)

---

## 🕹️ Game Hub & Selection Menu

When launching the app, players are greeted by a sleek, minimalist dark-mode **Game Hub**:

1. **Option 1: Classic Snake (v1)**
   - Authentic 90s monochrome Nokia / GameBoy LCD green phosphor screen.
   - Chunky pixel block snake, classic blinking food, and retro `VT323` score displays.
   - Pure classic rules: fixed game speed and unforgiving wall collisions.
   - Cleaned up from original legacy bugs (no 180° instant suicide, safe inputs, persistent high score).

2. **Option 2: Next-Gen Snake (v2)**
   - High-DPI hardware-accelerated Canvas with smooth 60+ FPS animations.
   - **Boundary Modes**: 🛡️ Classic Wall Death vs 🌐 Portal Wrap-around Mode.
   - **Dynamic Progression**: Speed scaling and ascending levels every 5 apples.
   - **Golden Bonus Apples**: Rare timed fruits (+30 points) with shrinking circular timer ring.
   - **Visual Juice**: Directional snake eyes, neon particle bursts, floating score popups, and collision screen shake.
   - **Native Web Audio Synth**: Synthesized pops, chimes, and crash impacts with persistent mute toggle.

3. **Seamless In-Game Navigation ("← Back to Menu")**
   - Both game versions feature an elegant, non-intrusive "← Menu" button in the header.
   - Instantly return to the hub at any time without page reloads or broken state loops.
   - Dedicated high scores for both game modes are tracked and displayed on the Hub selection cards!

---

## 🎮 Universal Controls

| Action | Desktop Controls | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Up / Down / Left / Right** | <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>S</kbd><kbd>A</kbd><kbd>D</kbd> | Swipe gestures or on-screen D-Pad |
| **Start / Restart** | <kbd>Space</kbd> or <kbd>Enter</kbd> | Tap board / Tap Start button |
| **Pause / Resume (v2)** | <kbd>P</kbd> | Center D-Pad button / Overlay |
| **Return to Menu** | <kbd>Esc</kbd> or <kbd>B</kbd> | Tap "← Menu" button |
| **Toggle Mute (v2)** | <kbd>M</kbd> | Speaker Icon Button |
| **Toggle Boundary Mode (v2)** | Click Mode Pill | Header Button |

---

## 📁 Project Architecture

```
├── index.html       # Single-Page Architecture: Hub, Classic v1, and Next-Gen v2 views
├── style.css        # Unified Design System: Cyberpunk Dark Mode & Retro LCD CRT
├── styles.css       # Forwarding stylesheet for backwards compatibility
├── script.js        # Central Router, Classic v1 Engine, Next-Gen v2 Engine, and Web Audio Synth
└── logo.png         # Brand asset
```

---

## 🚀 Running Locally

Open `index.html` in any browser or launch a lightweight server:

```bash
# Using Python
python -m http.server 8000

# Using Node
npx serve .
```
