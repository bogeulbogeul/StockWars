const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
app.whenReady().then(async () => {
    try {
        const win = new BrowserWindow({ show: false, width: 1600, height: 1100,
            webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: true } });
        await win.loadFile(path.join(__dirname, 'verify.html'));
        const result = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
            const start = Date.now();
            const timer = setInterval(() => {
                if (window.parkRestoreResult) { clearInterval(timer); resolve(window.parkRestoreResult); }
                else if (Date.now() - start > 10000) { clearInterval(timer); reject(new Error('warehouse timeout')); }
            }, 50);
        })`);
        fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(result, null, 2));
        fs.writeFileSync(path.join(__dirname, 'warehouse.png'), (await win.webContents.capturePage()).toPNG());
        console.log(JSON.stringify(result));
        app.exit(result.pass ? 0 : 1);
    } catch (error) { console.error(error); app.exit(1); }
});
