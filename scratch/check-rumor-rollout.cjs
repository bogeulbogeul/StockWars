const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/rumor-rollout-2026-10-25');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__rumor-check') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<!doctype html><html><head><link rel=stylesheet href=/css/style.css></head><body style="--game-vw:1vw;--game-vh:1vh"></body></html>'); }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.txt': 'text/plain; charset=utf-8' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.stockWarsExhibition || window.stockWarsApp, null, { timeout: 30000 });
        // Verify real bootstrap first, then inspect isolated components without title/scene overlays.
        await page.goto(`http://127.0.0.1:${server.address().port}/__rumor-check`, { waitUntil: 'load' });
        const result = await page.evaluate(async () => {
            const { AUTHORED_RUMOR_ITEMS } = await import('/js/data/rumorCatalog.js');
            const { RumorPopup } = await import('/js/components/inventory/RumorPopup.js');
            const { InventoryModal } = await import('/js/components/InventoryModal.js');
            const { ItemEngine } = await import('/js/engine/ItemEngine.js');
            const { INITIAL_STOCKS } = await import('/js/data/stocksData.js');
            const host = document.createElement('div'); document.body.append(host);
            let level = 1;
            const popup = new RumorPopup(host, { getAnalysisLevel: () => level });
            let checked = 0;
            for (const item of AUTHORED_RUMOR_ITEMS) {
                const holding = structuredClone(item);
                for (level = 1; level <= 10; level++) {
                    popup.open(holding);
                    if (popup.docText.textContent !== item.rumorStages[level - 1]) throw Error('본문 불일치 ' + item.rumorId);
                    if (!popup.analysisStatus.textContent.includes(`${level}/10`)) throw Error('단계 표시 불일치');
                    if (level < 4 && popup.stockName.textContent.includes(item.targetStockName)) throw Error('종목명 누출');
                    if (popup.changeBadge.textContent !== '미확인 현장 제보') throw Error('방향 누출');
                    const view = InventoryModal.prototype.getItemPresentation.call({ callbacks: { getAnalysisLevel: () => level } }, holding);
                    if (view.desc !== item.rumorStages[level - 1]) throw Error('인벤토리 표시 불일치');
                    checked++;
                }
                if (holding.price !== Math.max(100, Math.floor(item.price / 2))) throw Error('재열람 감가 오류');
            }
            const market = { cash: 100000, stocks: new Map(INITIAL_STOCKS.map(s => [s.id, { ...s }])) };
            const engine = new ItemEngine({ market, blackSwanEnabled: false });
            if (!engine.purchase('item_premium_rumor').success) throw Error('봉투 구매 실패');
            const opened = engine.use('item_premium_rumor');
            if (!opened.success || engine.state.reports.length) throw Error('봉투 연결 오류');
            const target = engine.state.inventory.find(i => i.id === opened.rumorId);
            engine.purchase('item_crypto_decoder');
            if (!engine.use('item_crypto_decoder', { rumorId: target.id }).success || target.interpretationLevel !== 2) throw Error('별가루 오류');
            engine.purchase('item_moon_powder');
            if (!engine.use('item_moon_powder', { rumorId: target.id }).success || target.interpretationLevel !== 10) throw Error('달가루 오류');
            const sample = AUTHORED_RUMOR_ITEMS.find(i => i.rumorId === 'R10_WINDHILL_P1');
            level = 1; popup.open(structuredClone(sample));
            window.rumorRolloutPreview = { popup, setLevel: n => { level = n; popup.open(structuredClone(sample)); } };
            return { events: AUTHORED_RUMOR_ITEMS.length, renderedStages: checked, engine: 'envelope/star/moon passed', boot: true, presentation: 'isolated components using production CSS after application bootstrap' };
        });
        await page.locator('#rumorSecretModal').waitFor({ state: 'visible' });
        await page.screenshot({ path: path.join(output, root.includes('win-unpacked') ? 'desktop-stage-1.png' : 'stage-1.png') });
        await page.evaluate(() => window.rumorRolloutPreview.setLevel(10));
        await page.screenshot({ path: path.join(output, root.includes('win-unpacked') ? 'desktop-stage-10.png' : 'stage-10.png') });
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, root.includes('win-unpacked') ? 'desktop-browser.json' : 'web-browser.json'), JSON.stringify({ ...result, errors }, null, 2));
        console.log(JSON.stringify({ ...result, errors }));
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
