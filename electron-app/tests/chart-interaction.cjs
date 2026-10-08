// Isolated renderer regression test using the same Chromium as the desktop app.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
app.setPath('userData', require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(), 'stockwars-chart-test-')));
app.whenReady().then(async () => {
    const win = new BrowserWindow({ show: false, width: 1280, height: 800,
        webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, offscreen: true } });
    win.webContents.on('console-message', (_event, level, message) => console.log(`renderer ${level}: ${message}`));
    await win.loadFile(path.resolve(__dirname, '../../web/tests/chartInteraction.browser.html'));
    const result = await win.webContents.executeJavaScript(`new Promise(resolve => {
        const start = Date.now();
        const timer = setInterval(() => {
            const result = document.querySelector('#results').textContent;
            if (result || Date.now() - start > 15000) {
                clearInterval(timer);
                resolve(result || 'FAIL timeout');
            }
        }, 50);
    })`);
    const nativeResults = [];
    for (const zoom of [0.5, 0.75, 1, 1.25]) {
        const target = await win.webContents.executeJavaScript(`(async () => {
            const { chartViewportRect } = await import('../js/components/chart/ChartPointer.js');
            const chart = window.chartTest;
            document.documentElement.style.zoom = '${zoom}';
            document.documentElement.style.width = innerWidth / ${zoom} + 'px';
            document.documentElement.style.height = innerHeight / ${zoom} + 'px';
            document.documentElement.style.setProperty('--game-vw', innerWidth / ${zoom} / 100 + 'px');
            document.documentElement.style.setProperty('--game-vh', innerHeight / ${zoom} / 100 + 'px');
            chart.renderCanvasChart();
            chart.scrollWrapper.scrollLeft = chart.scrollWrapper.scrollWidth;
            const rect = chartViewportRect(chart.canvas), point = chart.points.at(-1);
            chart.clearChartPointer();
            return { x: Math.round(rect.left + (point.x + 2) / chart.chartWidth * rect.width),
                y: Math.round(rect.top + 100 * rect.height / 320), expected: point.x };
        })()`);
        win.webContents.sendInputEvent({ type:'mouseMove', x:target.x, y:target.y });
        const actual = await win.webContents.executeJavaScript(`new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve({
                x: parseFloat(window.chartTest.guideVertical.style.left),
                hidden: window.chartTest.crosshair.classList.contains('hidden')
            })));
        })`);
        nativeResults.push({ zoom, target, actual, pass: actual.x === target.expected && !actual.hidden });
    }
    console.log(JSON.stringify({ electron: process.versions.electron, chrome: process.versions.chrome, result, nativeResults }));
    app.exit(result.includes('FAIL') || nativeResults.some(r => !r.pass) ? 1 : 0);
}).catch(error => { console.error(error); app.exit(1); });
