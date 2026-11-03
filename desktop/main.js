'use strict';
/* Crystal Front desktop app (Electron).
   The web build (dist/web, copied into ./app when packaging) is served from a private app://crystalfront/ origin, so
   models, textures and saved settings work exactly as on the website. Online 1v1 goes through the live relay at
   crystalfront.us: the game picks that address itself when it runs from app://, and its connection is presented as
   coming from crystalfront.us so the relay accepts it. */
const { app, BrowserWindow, protocol, net, session, shell, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const SITE = 'https://crystalfront.us';
const ROOT = path.join(__dirname, 'app');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

// always use the graphics card: software WebGL makes the game unplayable
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');

function serveApp() {
  protocol.handle('app', req => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function relayOrigin() {
  // the relay only accepts connections from the game's own site
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['wss://crystalfront.us/*'] }, (d, cb) => {
    d.requestHeaders.Origin = SITE;
    cb({ requestHeaders: d.requestHeaders });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1024, minHeight: 600,
    backgroundColor: '#0a0f0d', title: 'Crystal Front', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // F11 toggles full screen; F12 opens developer tools (handy for bug reports)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // links to other sites open in the normal browser, never inside the game window
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.loadURL('app://crystalfront/index.html');
}

app.whenReady().then(() => { serveApp(); relayOrigin(); createWindow(); });
app.on('window-all-closed', () => app.quit());
