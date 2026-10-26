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
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        page.setDefaultTimeout(90000); const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.text().startsWith('WALK ')) console.log(message.text()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        await page.waitForFunction(() => window.stockWarsApp?.enterVivianModel);
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ });
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }
        for (const [id, method, roomKey] of [
            ['home_office_tower', 'enterOffice', 'homeModelScene'],
            ['settlement_information', 'enterInformationModel', 'informationModelScene'],
            ['node_finance', 'enterBankModel', 'bankModelScene'],
            ['vivian_store', 'enterVivianModel', 'vivianModelScene'],
            ['cipher_securities', null, 'cipherLobbyScene']
        ]) {
            if (process.env.WALK_ONLY && process.env.WALK_ONLY !== id) continue;
            console.log('START ' + id);
            await page.evaluate(async ({ id, method }) => {
                const a = window.stockWarsApp; await a.townModelScene.ready;
                const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
                const b = TOWN_MODEL_BUILDINGS.find(b => b.id === id), c = a.townStage.playerController;
                Object.assign(c, { charPosX: b.x + (b.entranceOffsetX || 0), charPosY: b.y + 110 });
                window.walkFrames = []; window.walkTimer = setInterval(() => {
                    const r = a.homeModelScene?.active ? a.homeModelScene : a.informationModelScene?.active ? a.informationModelScene
                        : a.bankModelScene?.active ? a.bankModelScene : a.vivianModelScene?.active ? a.vivianModelScene : a.cipherLobbyScene?.active ? a.cipherLobbyScene : null;
                    window.walkFrames.push({ x: c.charPosX, y: c.charPosY, walking: !!c.scriptedWalking,
                        indoor: r?.roomLabel || r?.layer.id, ix: r?.controller.charPosX, iy: r?.controller.charPosY,
                        iw: !!r?.controller.scriptedWalking });
                }, 25);
                console.log('WALK prepared ' + id + ' town=' + document.body.classList.contains('town-mode-active'));
                if (method) await a[method]();
                console.log('WALK entered ' + id);
            }, { id, method });
            if (!method) await page.keyboard.press('f');
            await page.waitForFunction(key => window.stockWarsApp[key]?.active, roomKey);
            const entry = await page.evaluate(() => window.walkFrames.filter(f => f.walking).length);
            assert(entry > 10, `${id} entry not walking (${entry})`);
            if (id === 'cipher_securities') {
                const rooms = await page.evaluate(async () => {
                    const a = window.stockWarsApp, lobby = a.cipherLobbyScene;
                    const { enterCipherTrainingShell } = await import('/js/app/CipherTrainingEntrance.js');
                    const { enterCipherSimulationShell } = await import('/js/app/CipherSimulationEntrance.js');
                    console.log('WALK side legality ' + JSON.stringify([-428,-420,-410,-400,-390,-380].map(x => [x,lobby.canStand(x,-100)])));
                    const timer = setInterval(() => console.log('WALK internal state ' + JSON.stringify({
                        x:lobby.controller.charPosX,y:lobby.controller.charPosY,active:lobby.active,
                        training:lobby.trainingRoomScene?.active,tx:lobby.trainingRoomScene?.controller.charPosX,
                        hidden:document.hidden })), 5000);
                    await enterCipherTrainingShell(lobby); clearInterval(timer); console.log('WALK training entered');
                    if (!lobby.trainingRoomScene.active) throw new Error('training not entered');
                    await lobby.trainingRoomScene.exit();
                    if (!lobby.active || lobby.controller.charPosX > -350) throw new Error('training return jumps to lobby spawn');
                    await enterCipherSimulationShell(lobby, a.cipherLobby.competitionRoom);
                    if (!lobby.simulationRoomScene.active) throw new Error('simulation not entered');
                    await lobby.simulationRoomScene.exit();
                    if (!lobby.active || lobby.controller.charPosX < 350) throw new Error('simulation return jumps to lobby spawn');
                    return true;
                });
                assert(rooms); console.log('PASS cipher room walking round trips');
            }
            await page.evaluate(async key => {
                const room = window.stockWarsApp[key]; await room.greetingReady;
                room.bongbongTalk?.hide();
                // Exit from the spawn or greeting location; the test never
                // places the player at the exit to conceal a missing walk.
                console.log('WALK exit ' + key); await room.exit(); console.log('WALK exited ' + key);
            }, roomKey);
            const result = await page.evaluate(() => {
                clearInterval(window.walkTimer);
                return { entry: window.walkFrames.filter(f => f.walking).length,
                    inside: window.walkFrames.filter(f => f.iw).length,
                    end: window.walkFrames.at(-1) };
            });
            assert(result.inside > 10, `${id} indoor exit not walking`);
            assert(result.entry > entry + 10, `${id} exterior exit not walking`);
            console.log(JSON.stringify({ id, ...result }));
        }
        assert.deepEqual(errors, []); console.log('PASS five building entrances and exits');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
