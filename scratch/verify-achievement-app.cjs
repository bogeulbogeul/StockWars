const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
        await page.waitForFunction(() => window.stockWarsApp?.itemEngine);
        await page.evaluate(async () => {
            const app = window.stockWarsApp;
            app.titleScreen.hide();
            const { SideQuestEngine } = await import('/js/engine/SideQuestEngine.js');
            const quests = new SideQuestEngine(() => app.itemEngine.state, { cash: 0 });
            quests.record('labor', { score: 30, brokenCount: 0 });
            app.smartphoneUI.achievementAppModule.update(quests.list());
            app.smartphoneUI.showPhone();
        });
        await page.locator('#iconAchieveApp').click();
        await page.locator('#achievementApp.active').waitFor();
        assert.equal(await page.locator('.achieve-card').count(), 5);
        assert.equal(await page.locator('.achieve-card.is-earned').count(), 2);
        await page.locator('[data-achieve-filter="earned"]').click();
        assert.equal(await page.locator('.achieve-card').count(), 2);
        await page.locator('[data-achieve-filter="all"]').click();
        const overflow = await page.locator('.achieve-scroll').evaluate(el => el.scrollWidth > el.clientWidth);
        assert.equal(overflow, false);
        await page.waitForFunction(() => getComputedStyle(document.getElementById('achievementApp')).opacity === '1' && getComputedStyle(document.getElementById('homeScreen')).opacity === '0');
        await page.locator('.phone-shell').screenshot({ path: path.resolve(__dirname, 'achievement-phone.png') });
        await page.screenshot({ path: path.resolve(__dirname, 'achievement-app.png') });
        await page.locator('#btnPhysicalHome').click();
        await page.locator('#homeScreen.active').waitFor();
        await page.locator('#iconAchieveApp').click();
        await page.locator('[data-achieve-home]').click();
        await page.locator('#homeScreen.active').waitFor();
        await page.evaluate(() => window.stockWarsApp.smartphoneUI.achievementAppModule.update([]));
        await page.locator('#iconAchieveApp').click();
        await page.locator('[data-achieve-filter="earned"]').click();
        assert.equal(await page.locator('.achieve-empty').count(), 1);
        console.log('PASS: collection, earned filter, progress, empty state, no horizontal overflow, physical home and back navigation');
    } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
