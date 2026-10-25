const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/achievements-app-game-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        await page.addInitScript(() => {
            window.settingsTestAudios = [];
            const Original = window.Audio;
            window.Audio = class extends Original { constructor(...args) { super(...args); window.settingsTestAudios.push(this); } };
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        const start = async () => {
            await page.getByRole('button', { name: '게임 시작', exact: true }).click();
            await page.locator('.opening-sequence__skip').click();
            await page.locator('.bus-arrival .opening-sequence__skip').click();
            await page.locator('.crayon-title').waitFor({ state: 'detached' });
        };
        await start();
        await page.evaluate(()=>{const a=window.stockWarsApp;a.itemEngine.state.exp=150;a.itemEngine.state.analysisGrowth={version:2,level:2,proficiency:0,awarded:{one:{amount:1}},quizzes:{}};a.phoneHome.open();a.phoneHome.openApp('achievements');});
        assert.equal(await page.locator('.phone-achieve-card').count(),6);
        await page.locator('.phone-achievements [data-filter="earned"]').click();
        assert.equal(await page.locator('.phone-achieve-card').count(),2);
        await page.locator('.phone-achievements [data-filter="progress"]').click();
        assert.equal(await page.locator('.phone-achieve-card').count(),4);
        await page.locator('[data-achievement="level5"]').click();
        assert.match(await page.locator('.phone-achieve-title').textContent(),/한 걸음/);
        assert.equal(await page.locator('.phone-achieve-detail progress').getAttribute('value'),'2');
        await page.locator('[data-action="back"]').click();
        await page.locator('.phone-achievements [data-filter="all"]').click();
        await page.screenshot({path:path.join(out,prefix+'-growth.png')});
        await page.locator('.cozy-phone__back').click();
        await page.goto(base+'/?skipOpening=1');
        await page.waitForFunction(()=>window.stockWarsExhibition?.view);
        await page.evaluate(()=>{const e=window.stockWarsExhibition;e.arrival.stop();e.state.flags.phone=true;Object.assign(e.state.flags,{nickname:true,bank:true,certificate:true});e.state.nickname='소망이';e.view.phonePromptAllowed=true;e.view.sync(e.state);window.achievementStoryBefore=JSON.stringify(e.state);e.view.openPhone();e.view.phoneHome.openApp('achievements');});
        assert.equal(await page.locator('.phone-achieve-card').count(),8);
        assert.equal(await page.locator('.phone-achieve-card.earned').count(),3);
        await page.screenshot({path:path.join(out,prefix+'-list.png')});
        await page.locator('[data-achievement="license"]').click();
        await page.screenshot({path:path.join(out,prefix+'-detail.png')});
        assert.match(await page.locator('.phone-achieve-state').textContent(),/달성 완료/);
        await page.locator('[data-action="back"]').click();
        await page.evaluate(()=>{window.stockWarsExhibition.state.flags.trade=true;});
        await page.waitForFunction(()=>document.querySelector('[data-achievement="first-share"]')?.classList.contains('earned'));
        await page.locator('.phone-achievements [data-filter="earned"]').click();
        assert.equal(await page.locator('.phone-achieve-card').count(),4);
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:path.join(out,prefix+'-mobile.png')});
        await page.locator('.cozy-phone__back').click();
        assert.equal(await page.locator('.cozy-phone__home').isVisible(),true);
        assert.equal(await page.evaluate(()=>{const old=JSON.parse(window.achievementStoryBefore);old.flags.trade=true;return JSON.stringify(old)===JSON.stringify(window.stockWarsExhibition.state);}),true);
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(out,prefix+'-checks.json'),JSON.stringify({actualLevel:true,actualAnalysisHistory:true,storyFlags:true,filters:true,detail:true,autoRefresh:true,readOnly:true,mobile:true,home:true,errors},null,2));
        console.log(prefix+' achievements actual progress checks passed');
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
