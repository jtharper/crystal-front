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
  - `game.js` – match setup and flow, fixed-step simulation (`simStep`, `TICK`), state fingerprint (`simHash`)
  - `cmd.js` – player commands: every game-changing action is a command (`issue` → `applyCmd`)
  - `net.js` – online 1v1: lockstep turns, lobby, room codes
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

## Online 1v1
Lockstep: both browsers run the same deterministic simulation and exchange only commands.
- The simulation advances in fixed steps of 1/60 s. Only simulation code may use the game random stream `rng()`;
  cosmetic code uses `vr()`. Presentation may depend on `ME` (the local side), game rules never.
- Player actions go through `issue(cmd)`; offline they run on the next step, online they are sealed per turn
  (6 steps = 100 ms) and run `delay` turns later on both machines. A state fingerprint is compared every 10 turns.
- `server/` is the relay: a Cloudflare Worker (`crystal-front-mp`) with a Durable Object per room that forwards
  messages between the two players. The site reaches it at `/mp/room/<CODE>` through the Pages Function in
  `functions/`, using the `ROOMS` binding declared in `wrangler.toml`.

Local test: `cd server && npm install && npm run dev` (relay on :8787), serve the game, and open it with
`?mp=ws://127.0.0.1:8787` in two browser windows.

Cloudflare setup (once): Workers & Pages › Create › Import a repository › `jtharper/crystal-front`, root directory
`server`, deploy command `npx wrangler deploy` (Worker name `crystal-front-mp`). Then redeploy the Pages project
so it picks up the `ROOMS` binding.
