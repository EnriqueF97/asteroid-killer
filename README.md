# 🚀 Asteroid Killer

A solo survival shooter made with **Three.js**, **jQuery**, good old **HTML/CSS**, and a mild caffeine dependency.

Made with love and built using **Three.js**, featuring:

- Game logic (boom boom stuff — coded from scratch)
- Fully custom visuals and responsive controls
- UI and immersive space vibes
- Textures enhanced with **normal maps** to simulate surface depth — yes, even space rocks deserve 3D detail

Your mission:  
**Blast asteroids, survive as long as you can, and try to beat my high score of 8,120. Good luck — you’ll need it.**

---

## 🎮 CONTROLS

| Key        | Action          |
| ---------- | --------------- |
| `WASD`     | Move the cannon |
| `LShift`   | Zoom in         |
| `SPACEBAR` | Fire the cannon |
| `ESC`      | Pause the game  |

Yes, it's a cannon that shoots lasers... in space. Don’t overthink it.

---

## 🌌 FEATURES & NOTES

-   Survive as long as you can against a wave of angry space rocks
-   The longer you last, the harder it gets (just like life)
-   Gorgeous starry atmosphere with planets like:
-   Saturn (yes, with rings!)
-   Mars, Earth, The Moon, and even the Sun
-   Built entirely using Three.js, because 2D space is for cowards

---

## 🔧 HOW TO PLAY (Setup Instructions)

To enjoy the galactic chaos, you need to launch the game from a local server (textures don’t like lazy loading from the file system).

### Option 1 — The Easy Way™ (VS Code + Live Server Extension)

1. Open the game folder in **Visual Studio Code**
2. Right-click `index.html`
3. Choose **“Open with Live Server”**
4. A browser tab opens — boom, you’re in space.

### Option 2 — Classic Python Server

1. Open your terminal or command prompt
2. Navigate to the game’s folder:
   ```bash
   cd asteroid-killer
   ```
3. Start a local server with Python 3:
   ```bash
   cd asteroid-killer
   python -m http.server 8000
   ```
4. Open your browser and go to **http://localhost:8000/**

### Option 3 — Node.js + http-server (Works Anywhere)

1. Install the http-server tool globally (only once):

   ```bash
   npm install -g http-server
   ```

2. Open a terminal in your game folder:

   ```bash
   cd /path/to/game/folder
   ```

3. Start the server:
   ```bash
   http-server -p 8000
   ```
4. In your browser, visit:
   ```bash
   http://localhost:8000/
   ```

All three methods will safely bypass CORS restrictions and load textures correctly.
Launch the server, get to know the controls and start blasting asteroids.


---
Made with stardust, coffee, and a bit of pride by
Enrique Favila Martínez
