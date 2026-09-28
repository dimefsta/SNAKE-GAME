# 🐍 Snake Arcade // Classic (v1) & Next-Gen (v2)

A modern, minimalist, and responsive multi-game arcade hub featuring your authentic **Original Classic Snake (v1)** and the upgraded **Next-Gen Cyber Snake (v2)** built with pure vanilla HTML5, CSS3, and JavaScript.

Live Preview: [snake-game-red.vercel.app](https://snake-game-red.vercel.app)

---

## 🕹️ Game Hub & Selection Menu

When launching the app, players are greeted by a sleek, minimalist dark-mode **Game Hub**:

1. **Option 1: Classic Snake (v1)**
   - Faithfully reconstructed from your original repository commits (`9b3f8ca`).
   - Authentic triple sage border stack:
     - Outer border: `#595f43 solid 10px` with inset box-shadow
     - Middle border: `#abb78a solid 8px`
     - Inner border: `#8b966c solid 30px`
   - Authentic board background `#c4cfa3`, centered `logo.png`, and `#instruction-text`.
   - Authentic snake blocks: `#414141` with `#5a5a5a 1px dotted` border.
   - Authentic food blocks: `#dedede` with `#999 5px solid` border.
   - Authentic scores in `VT323`: `#score` in `#abb78a` and `#highScore` in `#d8ddca`.
   - Enhanced with bug fixes: anti-suicide input double buffer, safe food generation, and `localStorage` high score persistence.

2. **Option 2: Next-Gen Cyber Snake (v2)**
   - High-DPI hardware-accelerated Canvas with smooth 60+ FPS animations.
   - **Boundary Modes**: 🛡️ Classic Wall Death vs 🌐 Portal Wrap-around Mode.
   - **Dynamic Progression**: Speed scaling and ascending levels every 5 apples.
   - **Golden Bonus Apples**: Rare timed fruits (+30 points) with shrinking circular countdown ring.
   - **Visual Juice**: Directional snake eyes, neon particle bursts, floating score popups, and collision screen shake.
   - **Native Web Audio Synth**: Synthesized pops, chimes, and crash impacts with persistent mute toggle.

3. **Seamless In-Game Navigation ("← Back to Menu")**
   - Both game versions feature an elegant, non-intrusive "← Menu" button.
   - Instantly return to the hub at any time without page reloads or broken state loops.
   - Dedicated high scores for both game modes are tracked and displayed on the Hub selection cards!

---

## 🎮 Universal Controls

| Action | Desktop Controls | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Up / Down / Left / Right** | <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>S</kbd><kbd>A</kbd><kbd>D</kbd> | Swipe gestures or on-screen D-Pad |
| **Start / Restart** | <kbd>Space</kbd> or <kbd>Enter</kbd> | Tap board / Tap Start button |
| **Pause / Resume (v2)** | <kbd>P</kbd> | Center D-Pad button / Overlay |
| **Return to Menu** | <kbd>Esc</kbd> | Tap "← Menu" button |
| **Toggle Mute (v2)** | <kbd>M</kbd> | Speaker Icon Button |
| **Toggle Boundary Mode (v2)** | Click Mode Pill | Header Button |

---

## 📁 Project Architecture

```
├── index.html       # Single-Page Architecture: Hub, Authentic v1, and Next-Gen v2 views
├── style.css        # Unified Design System: Authentic v1 Triple Borders & Next-Gen Cyber Dark
├── styles.css       # Forwarding stylesheet for backwards compatibility
├── script.js        # Central Router, Authentic v1 Engine, Next-Gen v2 Engine, and Web Audio Synth
└── logo.png         # Authentic snake logo
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
