const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/ability-retirement-2026-10-25');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = `http://127.0.0.1:${server.address().port}/?demo=standard`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.stockWarsApp?.itemEngine, null, { timeout: 30000 });
        const result = await page.evaluate(() => {
            const app = window.stockWarsApp, engine = app.itemEngine;
            app.userProfile = { nickname: '성장 검수', firstTutorialCompleted: true, trait: { title: '공격적 자산가', bonusDesc: '이전 보너스 +2' } };
            engine.state.exp = 600;
            engine.state.baseStats = { analysis: 4, negotiation: 5, management: 5, recovery: 5 };
            engine.state.spentLevelPoints = 1;
            app.itemGameplay.start();
            const levelNotices = () => [...document.querySelectorAll('.toast')].filter(node => node.textContent.includes('레벨 업!'));
            const firstNotice = levelNotices().map(node => node.textContent);
            app.itemGameplay.sync(); app.itemGameplay.sync();
            const noticeCount = levelNotices().length;
            for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
            app.playerProfileModal.open();
            return { firstNotice, noticeCount, level: engine.playerLevel(), points: engine.pendingStatPoints(),
                stats: engine.stats(), slots: engine.portfolioSlots(), hearts: engine.maxStamina(),
                allocationDialogs: document.querySelectorAll('.level-up-dialog, .level-up-overlay, .level-up-card').length,
                profileText: app.playerProfileModal.dialog.textContent,
                saved: JSON.parse(localStorage.getItem('stockwars-item-gameplay-v1'))?.items };
        });
        assert.equal(result.level, 3); assert.equal(result.points, 0);
        assert.deepEqual(result.firstNotice, ['레벨 업! Lv. 3이 되었어요!']);
        assert.equal(result.noticeCount, 1);
        assert.equal(result.slots, 5); assert.equal(result.hearts, 3);
        assert.equal(result.allocationDialogs, 0);
        assert.doesNotMatch(result.profileText, /協|協商|협상력|운용력|회복력|이전 보너스/);
        assert.equal(result.saved.spentLevelPoints, 1);
        assert.equal(result.saved.baseStats.management, 5);
        await page.screenshot({ path: path.join(output, prefix + '-profile.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(output, prefix + '-profile-mobile.png') });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.stockWarsApp?.itemEngine, null, { timeout: 30000 });
        const restored = await page.evaluate(() => {
            const app = window.stockWarsApp;
            app.itemGameplay.start();
            return { level: app.itemEngine.playerLevel(), points: app.itemEngine.pendingStatPoints(),
                stats: app.itemEngine.stats(), spent: app.itemEngine.state.spentLevelPoints,
                management: app.itemEngine.state.baseStats.management,
                levelNotices: [...document.querySelectorAll('.toast')].filter(node => node.textContent.includes('레벨 업!')).length,
                allocationDialogs: document.querySelectorAll('.level-up-card').length };
        });
        assert.equal(restored.level, 3); assert.equal(restored.points, 0);
        assert.equal(restored.spent, 1); assert.equal(restored.management, 5);
        assert.equal(restored.allocationDialogs, 0);
        assert.equal(restored.levelNotices, 0);
        assert.deepEqual(errors, []);
        const report = { root, level: result.level, points: 0, slots: 5, hearts: 3, restored, errors };
        fs.writeFileSync(path.join(output, prefix + '-browser.json'), JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report));
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
