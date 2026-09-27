const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { PresenceClient } = require('./presence-client.cjs');
let win, presence;
let quitting = false;
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

function serverUrl() {
  const configRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const config = JSON.parse(fs.readFileSync(path.join(configRoot, 'server-config.json'), 'utf8'));
  const value = process.env.STOCKWARS_PRESENCE_URL || config.presenceUrl;
  if (!value) return '';
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('외부 테스트 서버 주소에는 HTTPS가 필요합니다.');
  return url.origin;
}

if (hasLock) app.whenReady().then(() => {
  let url = '';
  try { url = serverUrl(); } catch (error) { dialog.showErrorBox('서버 설정 오류', error.message); }
  presence = new PresenceClient({ url, tokenFile: path.join(app.getPath('userData'), 'presence-session.json') });
  presence.start();
  win = new BrowserWindow({ width: 1280, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const webRoot = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.resolve(__dirname, '../../web');
  const trusted = (event) => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame;
  ipcMain.handle('presence:state', (event) => trusted(event) ? presence.state() : { error: '접근 불가' });
  ipcMain.handle('presence:join', (event, id) => trusted(event) && id === 'town-1'
    ? presence.command('join', id) : { error: '잘못된 채널입니다.' });
  ipcMain.handle('presence:leave', (event) => trusted(event) ? presence.command('leave') : { error: '접근 불가' });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile(path.join(webRoot, 'index.html'));
});
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', event => {
  if (!presence || quitting) return;
  event.preventDefault();
  quitting = true;
  Promise.race([presence.stop(), new Promise(resolve => setTimeout(resolve, 1500))]).finally(() => app.quit());
});
