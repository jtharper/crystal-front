# Crystal Front

Browser RTS built with Three.js r128. Plays on desktop and mobile.

## Layout
- `index.html` – markup and script order
- `css/style.css` – all styling
- `js/` – classic scripts sharing one global scope, loaded in this order:
  - `core.js` – constants, factions, maps, unit/building data, shared state
  - `terrain.js` – height map, bridge decks, high-ground rules
  - `audio.js` – synthesized sound effects and announcer
  - `map.js` – map layouts and generation, terrain painting
  - `sim.js` – entities, pathfinding, units, economy
  - `ai.js` – computer opponents
  - `game.js` – match setup and flow
  - `input.js` – touch, mouse and keyboard
  - `hud.js` – build tray and HUD
  - `render.js` – renderer, materials, textures
  - `models.js` – faction emblems, units and buildings
  - `world.js` – terrain meshes, bridges, weather, per-frame sync
  - `main.js` – main loop and menu wiring
  - `glb.js` – loads the Blender models (`models/`)
  - `diag.js` – F3 performance overlay, GPU warning

Top-level code in a file may only call functions from the same or earlier files.

## Single-file build
`python3 tools/bundle.py` writes `dist/crystal-front.html` (everything inlined) for the iOS wrapper or offline play.

## Models
`blender/*.py` build the models headlessly in Blender (`blender -b -P blender/<script>.py`). Each writes a `.blend`
source plus the game asset `models/<name>.json` (embedded glTF) and baked ambient-occlusion maps `models/<name>_<part>_ao.jpg`.

## Deploying (Cloudflare Pages, automatic)
Every push to `main` rebuilds and publishes the site.

- Build command: `npm run build` (runs `tools/build-web.mjs`)
- Output directory: `dist/web`

The build copies only what the browser needs, converts the models to binary `.glb`, serves three.js from the site
itself (installed from npm, pinned to 0.128.0) and writes Cloudflare cache rules (`_headers`).

Try a build locally: `npm install && npm run build && npm run serve`, then open http://localhost:8080.

## Raspberry Pi hosting
`python3 tools/build_pi.py node_modules/three` writes `dist/crystal-front-pi.zip` (site + Caddy setup scripts).
See `tools/pi/README.md`.
