const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.sleepingAnna?.mixer, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true }); if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) { const skip = page.getByRole('button', { name: /건너뛰기/ }); if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); } }
        await page.evaluate(() => window.stockWarsApp.enterTown());
        const result = await page.evaluate(async () => {
            const app = window.stockWarsApp, actor = app.townModelScene.sleepingAnna;
            const meshes = []; actor.root.traverse(o => { if (o.isMesh) meshes.push(o.name); });
            for (const mood of ['calm', 'happy', 'sad', 'curious', 'surprised']) {
                if (!await actor.setMood(mood)) throw Error(`Mood rejected ${mood}`);
                actor.update(.1);
            }
            for (const face of 'smile happy neutral curious surprised worried teary pout determined shy relieved touched sleepy delicious'.split(' ')) {
                if (!await actor.expressions.set(face)) throw Error(`Face rejected ${face}`);
            }
            await actor.setMood('calm');
            const c = app.townStage.playerController;
            Object.assign(c, { charPosX: 1060, charPosY: 2370 });
            app.townModelScene.draw();
            return { meshes, moods: actor.actions.size, clips: actor.animations.map(a => a.name),
                townCollision: app.townModelScene.collisionFootprints.some(b => b.id === 'moa') };
        });
        assert.equal(result.moods, 5); assert(result.meshes.length >= 3);
        assert.equal(result.townCollision, true);
        assert(!result.meshes.some(name => /Vest|Binding|Food|Bread/.test(name)));
        await page.screenshot({ path: 'scratch/moa-game-town.png' });
        await page.evaluate(() => window.stockWarsApp.enterInformationModel());
        await page.evaluate(async () => { await window.stockWarsApp.informationModelScene.ready; });
        const interior = await page.evaluate(async () => {
            const app = window.stockWarsApp, scene = app.informationModelScene, actor = scene.room.userData.moa;
            await actor.ready; await actor.setMood('happy');
            const outside = app.townModelScene.sleepingAnna;
            const bones = a => { let bone; a.root.traverse(o => { if (o.isBone && /Leaf.*Base/.test(o.name)) bone = o; }); if (!bone) throw Error('Missing leaf base bone'); return bone; };
            const before = actor.mixer.time; scene.update(.05);
            return { separateBones: bones(actor) !== bones(outside), separateMaterials: [...actor.expressions.materials.keys()][0] !== [...outside.expressions.materials.keys()][0],
                updates: actor.mixer.time > before, collision: !scene.canStand(-190, -95), rootCount: scene.room.children.filter(o => o.name === 'moa-character').length };
        });
        assert.deepEqual(interior, { separateBones: true, separateMaterials: true, updates: true, collision: true, rootCount: 1 });
        await page.screenshot({ path: 'scratch/moa-game-information.png' });
        await page.evaluate(() => {
            const app = window.stockWarsApp, scene = app.informationModelScene;
            Object.assign(scene.controller, { charPosX: -120, charPosY: -95 * .62 });
            window.moaTalkCalls = 0; app.annaDialogueModal.show = () => window.moaTalkCalls++;
        });
        // Use the actual projection exported by the game rather than hard-code it.
        await page.evaluate(async () => { const { GROUND_PROJECTION } = await import('/js/data/townModelBuildings.js'); window.stockWarsApp.informationModelScene.controller.charPosY = -95 * GROUND_PROJECTION; });
        await page.keyboard.press('f');
        assert.equal(await page.evaluate(() => window.moaTalkCalls), 1);
        assert.deepEqual(errors, []);
        fs.writeFileSync(`output/moa-game-v1/browser-check${root.includes('win-unpacked') ? '-runtime' : ''}.json`, JSON.stringify({ root, result, interior, errors }, null, 2));
        console.log('PASS Moa: no clothes, 14 faces, 5 leaf moods, town + information, independent clones, collision and F dialogue');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
