const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const { resetTestStorage } = require('./test-reset.cjs');
const path = require('node:path');
const fs = require('node:fs');
const { PresenceClient } = require('./presence-client.cjs');
let win, presence;
let quitting = false;
let tutorialActive = false;
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

function serverConfig() {
  const configRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
  return JSON.parse(fs.readFileSync(path.join(configRoot, 'server-config.json'), 'utf8'));
}

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

if (hasLock) app.whenReady().then(async () => {
  // Testing starts clean on every process launch, while in-session refresh preserves progress.
  if (serverConfig().resetGameplayOnLaunch === true) {
    try { await resetTestStorage(session.defaultSession); }
    catch (error) { dialog.showErrorBox('테스트 초기화 실패', '기존 데이터 초기화를 확인하지 못해 실행을 중단합니다.'); app.quit(); return; }
  }
  let url = '';
  try { url = serverUrl(); } catch (error) { dialog.showErrorBox('서버 설정 오류', error.message); }
  presence = new PresenceClient({ url, tokenFile: path.join(app.getPath('userData'), 'presence-session.json') });
  if (serverConfig().deleteTestUserOnExit === true && presence.token) {
    try { await presence.stop({ deleteUser: true }); }
    catch (error) { dialog.showErrorBox('온라인 테스트 초기화 실패', error.message); quitting = true; app.quit(); return; }
  }
  // Stay offline at the title screen until the player selects a game mode.
  presence.localMode = true;
  presence.start();
  win = new BrowserWindow({ width: 1280, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const webRoot = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.resolve(__dirname, '../../web');
  const trusted = (event) => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame;
  ipcMain.handle('presence:local-mode', (event, enabled) => trusted(event) && typeof enabled === 'boolean'
    ? presence.setLocalMode(enabled) : { error: '잘못된 모드입니다.' });
  ipcMain.handle('presence:nickname', (event, nickname) => trusted(event) && typeof nickname === 'string' && nickname.length <= 100
    ? presence.command('nickname', undefined, { nickname }) : { error: '잘못된 닉네임입니다.' });
  ipcMain.handle('app:tutorial-active', (event, active) => {
    if (!trusted(event) || typeof active !== 'boolean') return { error: '접근 불가' };
    tutorialActive = active;
    return { success: true };
  });
  ipcMain.handle('app:quit', (event) => {
    if (!trusted(event)) return { error: '접근 불가' };
    if (tutorialActive) return { error: '튜토리얼 완료 후 게임을 종료할 수 있어요.' };
    app.quit();
    return { success: true };
  });
  ipcMain.handle('presence:state', (event) => trusted(event) ? presence.state() : { error: '접근 불가' });
  ipcMain.handle('presence:join', (event, id) => trusted(event) && id === 'town-1'
    ? presence.command('join', id) : { error: '잘못된 채널입니다.' });
  ipcMain.handle('presence:leave', (event) => trusted(event) ? presence.command('leave') : { error: '접근 불가' });
  ipcMain.handle('presence:position', (event, pose) => trusted(event) && pose && Number.isFinite(pose.x) && Number.isFinite(pose.y)
    ? presence.command('position', undefined, { location: pose.location, x: pose.x, y: pose.y, facing: pose.facing, resting: pose.resting, seatId: typeof pose.seatId==='string'?pose.seatId.slice(0,80):undefined, nickname: String(pose.nickname || '').slice(0, 24), level: pose.level, trait: pose.trait })
    : { error: '잘못된 위치입니다.' });
  ipcMain.handle('arena:request', (event, input) => trusted(event) && input && typeof input === 'object' && ['create','list','find','join','state','invite','decline','history','ack','ready','start','trade','leave'].includes(input.action) ? presence.arena(input) : { error: '잘못된 대결 요청입니다.' });
  ipcMain.handle('chat:list', (event) => trusted(event) ? presence.chat('list') : { error: '접근 불가' });
  ipcMain.handle('friends:command', (event, operation, targetId, options = {}) => trusted(event) && ['list', 'request', 'accept', 'reject', 'cancel', 'chat', 'gift', 'giftAck', 'search'].includes(operation)
    ? presence.chat('friends', undefined, { operation, targetId, giftId: options?.giftId, targetName: options?.targetName, query: options?.query, item: options?.item, ids: options?.ids }) : { error: '잘못된 요청입니다.' });
  ipcMain.handle('chat:room', (event, action, options) => trusted(event) && ['create', 'invite', 'leaveRoom', 'list', 'send', 'newsPublish', 'news', 'newsReact'].includes(action) && options && typeof options === 'object'
    ? presence.chat(action, options.text, { roomId: options.roomId, title: options.title, members: options.members, achievement: options.achievement, comment: options.comment, postId: options.postId, reaction: options.reaction }) : { error: '잘못된 요청입니다.' });
  ipcMain.handle('chat:send', (event, text) => trusted(event) && typeof text === 'string' && text.trim().length > 0 && text.length <= 500
    ? presence.chat('send', text) : { error: '메시지는 1~500자로 입력해 주세요.' });
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
  const cleanup = async () => {
    // Stop renderer writes before clearing its storage.
    if (win && !win.isDestroyed()) win.destroy();
    try { await presence.stop({ deleteUser: serverConfig().deleteTestUserOnExit === true }); }
    catch (error) { dialog.showErrorBox('온라인 테스트 기록 삭제 실패', error.message + '\n다음 실행 시 다시 삭제를 시도합니다.'); }
    if (serverConfig().resetGameplayOnLaunch === true) await resetTestStorage(session.defaultSession);
  };
  cleanup().catch(error => dialog.showErrorBox('테스트 초기화 실패', error.message)).finally(() => app.quit());
});
