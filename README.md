# 🐍 Snake 2.0 // Next-Gen Arcade

A modern, minimalist, and responsive reimagining of the classic Snake arcade game built with pure vanilla HTML5, CSS3, and JavaScript.

Live Preview: [snake-game-red.vercel.app](https://snake-game-red.vercel.app)

---

## ✨ Features in v2

### 1. Minimalist Cyber-Dark Aesthetics
- **Sleek Glassmorphism**: Translucent frosted panels with `backdrop-filter: blur(16px)` and subtle borders.
- **Neon Glows**: Dynamic lighting with cyber emerald, rose apple, and golden bonus accents.
- **Directional Eyes & Animated Snake**: The snake dynamically looks in the direction of travel with tapered tail rendering.
- **Responsive Layout**: High-DPI (`devicePixelRatio`) canvas that scales from 320px mobile screens up to 4K displays.

### 2. Dual Boundary Modes
- **🛡️ Classic Mode**: True to retro rules — crashing into outer walls causes an immediate game over.
- **🌐 Wrap-around Mode**: Outer walls turn into portals; passing through teleports the snake to the opposite side.
- Seamlessly toggleable at any time via the header bar or keyboard shortcut.

### 3. Dynamic Levels & Visual Juice
- **Progressive Speed Scaling**: Speeds up every 5 apples eaten with ascending level notifications.
- **Golden Bonus Fruits**: Timed bonus items with shrinking countdown rings that award +30 bonus points!
- **Particle System**: Burst effects upon eating food and dramatic collision shockwaves on game over.
- **Web Audio API Synth**: Native, zero-asset synthesized sound effects (pops, chimes, and crash impacts) with persistent mute toggle.
- **Persistent High Score**: Retained across browser sessions using `localStorage`.

### 4. Mobile & Touch Optimized
- **Intuitive Gestures**: Responsive swipe detection in all 4 directions.
- **Virtual D-Pad**: Tactile on-screen glassmorphism buttons with active feedback and haptic vibration (`navigator.vibrate`).
- Zero bounce-scroll interference on mobile viewports.

---

## 🎮 Controls

| Action | Desktop Controls | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Up** | <kbd>↑</kbd> or <kbd>W</kbd> | Swipe Up / D-Pad Up |
| **Move Down** | <kbd>↓</kbd> or <kbd>S</kbd> | Swipe Down / D-Pad Down |
| **Move Left** | <kbd>←</kbd> or <kbd>A</kbd> | Swipe Left / D-Pad Left |
| **Move Right** | <kbd>→</kbd> or <kbd>D</kbd> | Swipe Right / D-Pad Right |
| **Start / Restart** | <kbd>Space</kbd> / <kbd>Enter</kbd> | Tap Board / Start Button |
| **Pause / Resume** | <kbd>P</kbd> or <kbd>Esc</kbd> | Center D-Pad / Header |
| **Toggle Mute** | <kbd>M</kbd> | Speaker Icon Button |
| **Toggle Mode** | Click Mode Pill | Header Button |

---

## 📁 Project Structure

```
├── index.html       # Accessible semantic markup with glassmorphic overlays and D-Pad
├── style.css        # Modern CSS design system, neon dark-mode tokens, and responsive layout
├── script.js        # High-DPI Canvas engine, input buffer, state machine, particle & audio synth
├── styles.css       # Forwarding stylesheet for backwards compatibility
└── logo.png         # Legacy brand asset
```

---

## 🚀 Running Locally

No dependencies or build steps required. Simply open `index.html` in any modern web browser or serve via any static server:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```
