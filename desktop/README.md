# Crystal Front: desktop app (Electron)

The desktop app is the same game as crystalfront.us, packaged as a program for Windows (and Linux). It is the build
to upload to Steam.

## Build it
From the repo root:

```
npm install
npm run build            # makes dist/web
cd desktop
npm install
npm run pack:win         # Windows x64 -> desktop/out/Crystal Front-win32-x64/
npm run pack:linux       # Linux x64   -> desktop/out/Crystal Front-linux-x64/
npm start                # run it directly from source (on a machine with a display)
```

`pack:*` copies `dist/web` into `desktop/app`, packages it with Electron, and drops unused Chromium locales.
Zip the output folder to share it; players unzip it and run `Crystal Front.exe`.

## How it works
- `main.js` serves the game from a private `app://crystalfront/` address, so models, textures, fonts and saved
  settings work offline, exactly as on the website.
- Online 1v1 uses the live relay at `wss://crystalfront.us` (`js/net.js` picks it when the game runs from `app://`).
  The app presents that connection as coming from crystalfront.us, so the relay needs no changes.
  Desktop and web players can play each other as long as both run the same build (the build ID must match).
- Always uses the graphics card. F11 toggles full screen, F12 opens developer tools.

## Not done yet (for Steam)
- Steam integration (achievements, overlay, friends) via steamworks.js.
- A Windows `.exe` icon (needs `--icon=icon.ico`; building that on Linux needs Wine) and code signing.
