// Kit Effets Spéciaux - Atelier Fond Vert : application de bureau (Electron)
// Charge la même appli web que la version en ligne (dossier app/).
const { app, BrowserWindow, session, shell, systemPreferences, Menu } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');

const APP_DIR = path.join(__dirname, '..', 'app');
const ALLOWED_PERMISSIONS = new Set(['media', 'clipboard-sanitized-write', 'fullscreen', 'screen-wake-lock']);

// Une seule fenêtre de l'appli à la fois : un second lancement remet la fenêtre existante au premier plan.
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function isLocal(url) {
  return url.startsWith('file:');
}

// Ouvre hors de l'appli ce qui n'en fait pas partie : PDF dans le lecteur du système (pour imprimer),
// liens web dans le navigateur, mailto: dans la messagerie.
function openOutside(url) {
  if (isLocal(url)) {
    shell.openPath(fileURLToPath(url));
  } else if (/^(https?|mailto):/i.test(url)) {
    shell.openExternal(url);
  }
}

async function askMediaAccess() {
  if (process.platform !== 'darwin') return;
  try {
    await systemPreferences.askForMediaAccess('camera');
    await systemPreferences.askForMediaAccess('microphone');
  } catch (e) {
    // L'utilisateur pourra autoriser plus tard dans Réglages > Confidentialité.
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    title: 'Kit Effets Spéciaux - Atelier Fond Vert',
    backgroundColor: '#edf1ee',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    if (isLocal(url) && url.split('#')[0].split('?')[0] === current.split('#')[0].split('?')[0]) return;
    event.preventDefault();
    openOutside(url);
  });

  win.loadFile(path.join(APP_DIR, 'index.html'));
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission) => ALLOWED_PERMISSIONS.has(permission));

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { label: 'Affichage', submenu: [{ role: 'reload', label: 'Recharger' }, { role: 'togglefullscreen', label: 'Plein écran' }] },
      { role: 'windowMenu' },
    ]));
  } else {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Affichage', submenu: [{ role: 'reload', label: 'Recharger' }, { role: 'togglefullscreen', label: 'Plein écran' }, { role: 'quit', label: 'Quitter' }] },
    ]));
  }

  await askMediaAccess();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
