const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || process.env.CHECK_GAME_ROOT || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8106, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/New_York' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await page.goto('http://127.0.0.1:8106/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.buildingClocks?.length === 1
            && window.stockWarsApp.townModelScene.status.hidden, null, { timeout: 90000 });
        await page.waitForFunction(()=>window.stockWarsApp.townModelScene.player?.root?.parent
            && window.stockWarsApp.townModelScene.sleepingAnna !== undefined,null,{timeout:90000});
        await page.evaluate(()=>{
            document.body.classList.add('town-model-mode','ui-paused');
            window.stockWarsApp.townStage.containerEl.classList.remove('hidden');
        });
        const report = await page.evaluate(async () => {
            const { koreaClockSeconds } = await import('/js/components/town3d/BuildingClock.js');
            const THREE = await import('/vendor/three/three.module.js');
            const s = window.stockWarsApp.townModelScene;
            const clock = s.buildingClocks[0];
            const checks = [];
            for (const [iso, seconds] of [['2026-10-18T15:00:00Z',0], ['2026-10-18T18:00:00Z',10800],
                ['2026-10-18T21:30:00Z',23400], ['2026-10-19T03:15:30Z',44130]]) {
                if (koreaClockSeconds(Date.parse(iso)) !== seconds) throw Error('KST conversion');
                clock.update(Date.parse(iso));
                for (const h of clock.hands) {
                    const positions = h.object.geometry.attributes.position;
                    let tip = new THREE.Vector3();
                    let longest = 0;
                    for (let i = 0; i < positions.count; i++) {
                        const v = new THREE.Vector3().fromBufferAttribute(positions, i);
                        const radius = v.x*v.x + v.y*v.y;
                        if (radius > longest) { longest = radius; tip = v; }
                    }
                    tip.applyQuaternion(h.object.quaternion);
                    const angle = 2*Math.PI*(seconds%h.period)/h.period;
                    const dot = new THREE.Vector2(tip.x, tip.y).normalize().dot(new THREE.Vector2(Math.sin(angle),Math.cos(angle)));
                    if (dot < .99) throw Error(`Hand direction ${h.name}: ${dot}`);
                }
                checks.push(iso);
            }
            const before = clock.hands[1].object.quaternion.clone();
            clock.update(Date.parse('2026-10-19T03:16:30Z'));
            if (before.angleTo(clock.hands[1].object.quaternion) < .1) throw Error('Clock did not advance');
            const player = s.town.playerController;
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='cipher_securities');
            player.charPosX = def.x; player.charPosY = def.y+50;
            const canStand = player.canStand(def.x, def.y+50);
            const blocked = !player.canStand(def.x,def.y);
            s.draw();
            const model = s.scene.getObjectByName('cipher_securities');
            const bounds = new THREE.Box3().setFromObject(model);
            const names=[];model.traverse(o=>names.push(o.name));
            const footprint=s.collisionFootprints.find(b=>b.maxY===def.y && b.minX<def.x && b.maxX>def.x);
            const overlap=s.collisionFootprints.slice(0,TOWN_MODEL_BUILDINGS.length).filter(b=>b!==footprint
                && b.minX<footprint.maxX && b.maxX>footprint.minX && b.minY<footprint.maxY && b.maxY>footprint.minY);
            return { checks, canStand, blocked, width: bounds.max.x-bounds.min.x,expectedWidth:def.width,
                noBuildingOverlap:overlap.length===0,
                cleanStairs:names.includes('Entry_Continuous_Three_Step_Solid') && !names.some(n=>n.startsWith('Grand_Entry_Step')),
                groundedBases:names.filter(n=>n.startsWith('Portico_Column_Plinth')).length===4
                    && names.filter(n=>n.startsWith('Wing_Corner_Foot')).length===8,
                tiles:names.some(n=>n.startsWith('Blue_Clay_Roof_Tile')),
                fascia:names.some(n=>n.startsWith('Continuous_Cream_Pediment_Frame')),
                windows:names.filter(n=>n.startsWith('Grand_Window_Fanlight_Transom')).length===8,
                columns:names.filter(n=>n.startsWith('Portico_Column') && !n.includes('Capital') && !n.includes('Plinth')).length===4,
                wings:names.filter(n=>n.startsWith('Single_Storey_Wing')).length===2,
                panelDoors:names.filter(n=>n.startsWith('Door_Panel_Leaf')).length===2
                    && names.filter(n=>n.startsWith('Door_Recessed_Panel_Inset')).length===4
                    && names.some(n=>n.startsWith('Door_Continuous_Arch_Frame'))
                    && names.filter(n=>n.startsWith('Door_Brass_Curved_Pull')).length===2,
                retiredRoof:!names.includes('Roof_Smooth_Blue'),
                handCount: clock.hands.length, source: model.getObjectByName('Clock_Face')?.name };
        });
        assert.equal(report.canStand, true);
        assert(Math.abs(report.width-report.expectedWidth)<1);
        for(const key of ['blocked','tiles','fascia','windows','columns','wings','panelDoors','cleanStairs','groundedBases','retiredRoof','noBuildingOverlap']) assert(report[key],key);
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'output/cipher-joints-ground-v6/game.png' });
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log('PASS', JSON.stringify(report), 'small viewport; no browser errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
