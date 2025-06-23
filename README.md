# 🚀 Asteroid Killer

A solo survival shooter made with **Three.js**, **jQuery**, good old **HTML/CSS**, and a mild caffeine dependency.

Built entirely using ThreeJS, including:
- Game logic (boom boom stuff)
- Visuals and controls
- UI and space vibes

Your mission:  
**Blast asteroids, survive as long as you can, and try to beat my high score of 8,120. Good luck — you’ll need it.**

---

## 🎮 CONTROLS

| Key        | Action                    |
|------------|---------------------------|
| `WASD`     | Move the cannon           |
| `LShift`   | Zoom in                   |
| `SPACEBAR` | Fire the cannon           |
| `ESC`      | Pause the game            |

Yes, it's a cannon that shoots lasers... in space. Don’t overthink it.

---

## 🔧 HOW TO PLAY (Setup Instructions)

To enjoy the galactic chaos, you need to launch the game from a local server (textures don’t like lazy loading from the file system).

### Option 1 — The Easy Way™ (VS Code + Live Server)

1. Open the game folder in **Visual Studio Code**
2. Right-click `asteroidKiller.html`
3. Choose **“Open with Live Server”**
4. A browser tab opens — boom, you’re in space.

### Option 2 — Classic Python Server

1. Open terminal or command prompt  
2. `cd` into the game's folder  
3. Run:  
   ```bash
   python -m SimpleHTTPServer 8000  # for Python 2
