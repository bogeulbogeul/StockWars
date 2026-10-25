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

        const seen=[];page.on('framenavigated',frame=>{if(/opening-scene-0[1-6]-v1\/scene.html/.test(frame.url()))seen.push(frame.url());});
        await page.addInitScript(()=>{const original=window.setTimeout.bind(window);window.setTimeout=(fn,delay,...args)=>original(fn,[16000,20000,24000,26000,30000].includes(delay)?200:delay,...args);});
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.getByRole('button',{name:'게임 시작',exact:true}).click();
        await page.waitForSelector('.opening-sequence iframe');
        await page.waitForSelector('.bus-arrival',{timeout:30000});
        assert.equal(new Set(seen).size,6);
        await page.locator('.opening-sequence__skip').click();
        await page.waitForSelector('.moa-movement-guide:not([hidden])',{timeout:30000});
        assert.equal(await page.locator('.crayon-title').count(),0);assert.deepEqual(errors,[]);
        console.log(JSON.stringify({openingScenes:new Set(seen).size,busAfterOpening:true,movementGuideAfterBus:true,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
