const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
function create() {
  const w = new BrowserWindow({ width: 1280, height: 760, backgroundColor: '#0d0906', title: 'Pixel Realm',
    icon: path.join(__dirname, '..', 'build', 'icon.png'), webPreferences: { contextIsolation: true } });
  Menu.setApplicationMenu(null);
  w.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  w.webContents.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && i.key === 'F11') w.setFullScreen(!w.isFullScreen()); });
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
