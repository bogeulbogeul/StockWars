const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/phone-top-home-v3');
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
        const results=[];
        for(const viewport of [{width:1280,height:900},{width:390,height:844}]) {
            await page.setViewportSize(viewport);
            await page.evaluate(()=>window.stockWarsApp.phoneHome.open());
            for(const id of ['stock','news','achievements','messenger','tasks','profile','map','settings']) {
                await page.locator(`[data-phone-app="${id}"]`).click();
                assert.equal(await page.locator('.cozy-phone__detail').isVisible(),true,id);
                assert.equal(await page.locator('.cozy-phone__home-key').count(),0);
                const home=page.locator('.cozy-phone__back');
                assert.equal(await home.isVisible(),true,id);
                const box=await home.boundingBox(); assert(box.y>=0 && box.y+box.height<=viewport.height,id);
                if(id==='stock'||id==='news') await page.screenshot({path:path.join(out,`${prefix}-${id}-${viewport.width}.png`)});
                await home.click();
                assert.equal(await page.locator('.cozy-phone__home').isVisible(),true,id);
                results.push({app:id,width:viewport.width,homeVisible:true,returned:true});
            }
            await page.keyboard.press('KeyP');
        }
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(out,prefix+'-checks.json'),JSON.stringify({results,errors},null,2));
        console.log(prefix+' all eight apps home navigation passed at desktop and mobile sizes');
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
