const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
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
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.stack || error.message));
        page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('favicon.ico')) errors.push(`${response.status()} ${response.url()}`); });
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.stockWarsExhibition || window.stockWarsApp?.townModelScene, null, { timeout: 20000 })
            .catch(error => { throw new Error(error.message + '\n' + errors.join('\n')); });
        const result = await page.evaluate(async () => {
            let app = window.stockWarsExhibition;
            const fullExhibition = !!app;
            if (!app) {
                const { loadScript } = await import('/js/app/exhibition/Script.js');
                const { buildPlan } = await import('/js/app/exhibition/Plan.js');
                const { ExhibitionView } = await import('/js/app/exhibition/View.js');
                app = { plan: buildPlan(await loadScript()), view: new ExhibitionView(() => {}), state: {} };
                app.render = async () => {
                    app.view.state = { nickname: '소망이' };
                    app.view.location.textContent = '토리 증권사 앞';
                    app.view.line(app.plan[app.state.cursor], () => {});
                };
            }
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const { getSmartphoneShellHtml } = await import('/js/components/smartphone/SmartphoneShellTemplate.js');
            const { AGENT_K_WELCOME } = await import('/js/components/CipherAgentKDialogue.js');
            const tour = app.plan.filter(beat => beat.chapter === 3);
            app.state.cursor = app.plan.findIndex(beat => beat.chapter === 3 && beat.place === 'stockOutside');
            await app.render();
            return { fullExhibition, buildings: TOWN_MODEL_BUILDINGS.map(b => b.name),
                tour: tour.map(beat => beat.text), location: app.view.location.textContent,
                dialogue: app.view.panel.textContent, phone: getSmartphoneShellHtml(),
                welcome: AGENT_K_WELCOME };
        });
        assert.deepEqual(result.buildings, ['소망이네 집', '모아 안내소', '봉봉 잡화점', '우디 가구점', '토리 증권사', '차곡 은행', '도란 쉼터', '소담 서점']);
        for (const name of [...result.buildings, '두리 우체국']) assert.ok(result.tour.some(line => line.includes(name)), name);
        assert.ok(result.location.includes('토리 증권사'), result.location);
        assert.ok(result.dialogue.includes('토리 증권사'), result.dialogue);
        assert.ok(result.phone.includes('토리 증권사'));
        assert.ok(result.welcome[0].includes('토리 증권사'));
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log(JSON.stringify({ root, fullExhibition: result.fullExhibition, buildings: result.buildings, tourLines: result.tour.length,
            location: result.location, dialogue: result.dialogue, errors }, null, 2));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
