const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.env.SOMANGI_WEB_ROOT || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.txt': 'text/plain' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [], missing = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
    page.on('request', req => requests.push(req.url()));
    try {
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(() => window.stockWarsExhibition?.arrival.active);
        await page.evaluate(async () => { await window.stockWarsApp.ready; await window.stockWarsApp.townModelScene.player.ready; });
        console.log('LOADED', await page.evaluate(() => {
            const p = window.stockWarsApp.townModelScene.player;
            return { state: p.state, variants: [...p.variants.keys()], faces: p.expressions.materials.size };
        }));
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.variants.size), 2);
        await page.keyboard.down('a'); await page.waitForTimeout(180);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.state), 'walk');
        await page.screenshot({ path: 'scratch/somangi-game-walk.png' });
        await page.keyboard.up('a'); await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.state), 'idle');
        const faces = 'smile happy neutral curious surprised worried teary pout determined shy relieved touched sleepy delicious'.split(' ');
        for (const id of faces) assert.equal(await page.evaluate(id => window.stockWarsApp.townModelScene.player.setExpression(id), id), true);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.setExpression('proud')), false);
        await page.evaluate(async () => {
            const p = window.stockWarsApp.townModelScene.player;
            await Promise.all([p.setExpression('happy'), p.setExpression('smile')]);
        });
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.expressionId), 'smile');
        await page.evaluate(() => { const s = window.stockWarsApp.townModelScene; s.player.faceCamera(s.camera); });
        await page.waitForTimeout(100); await page.screenshot({ path: 'scratch/somangi-game-town.png' });
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.play('eat', { scripted: true })), true);
        await page.waitForTimeout(1000); await page.screenshot({ path: 'scratch/somangi-game-eat.png' });
        await page.waitForFunction(() => window.stockWarsApp.townModelScene.player.state === 'idle', { timeout: 15000 });
        for (const place of ['home', 'store', 'information', 'bank', 'stock']) {
            await page.evaluate(async place => { window.stockWarsExhibition.arrival.stop(); await window.stockWarsApp.show(place); }, place);
            const data = await page.evaluate(async place => {
                const s = window.stockWarsApp.rooms.get(place); await s.player.ready; await s.player.setExpression('happy'); s.player.faceCamera(s.camera);
                const other = window.stockWarsApp.townModelScene.player;
                return { variants: s.player.variants.size, expression: s.player.expressionId, originalExpression: other.expressionId,
                    sharedSkeleton: s.player.variants.get('walk').model.getObjectByProperty('isSkinnedMesh', true).skeleton === other.variants.get('walk').model.getObjectByProperty('isSkinnedMesh', true).skeleton };
            }, place);
            assert.equal(data.variants, 2); assert.equal(data.expression, 'happy'); assert.equal(data.originalExpression, 'smile'); assert.equal(data.sharedSkeleton, false);
            await page.waitForTimeout(150); await page.screenshot({ path: `scratch/somangi-game-${place}.png` }); console.log('ROOM', place, data);
        }
        assert.deepEqual(errors, []); assert.deepEqual(missing, []);
        assert.equal(requests.some(url => /characters\/3d\/(moa|tori|bongbong)\//.test(url)), false);
        console.log('PASS: town walk, eat completion, 14 expressions, request race, five interiors, independent skeletons/materials, no missing assets/errors/retired NPC requests');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
