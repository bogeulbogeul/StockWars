const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/information-map-insert-v2');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css',
            '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let sequence = 0; sequence < 3; sequence++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ });
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }

        const results=[];
        const inspect=async(key,label)=>{
          await page.evaluate(async key=>{await window.stockWarsApp[key].ready},key);
          await page.waitForTimeout(300);
          results.push(await page.evaluate(key=>{const s=window.stockWarsApp[key];return {key,exposure:s.renderer.toneMappingExposure,lights:s.scene.children.filter(o=>o.isLight).map(o=>[o.type,o.intensity]),profile:s.scene.userData.gameLighting}},key));
          await page.screenshot({path:'output/game-lighting/'+label+'.png'});
        };
        fs.mkdirSync('output/game-lighting',{recursive:true});
        await inspect('townModelScene','outdoor');
        for(const [method,key,label] of [['enterOffice','homeModelScene','home'],['enterVivianModel','vivianModelScene','store'],['enterBankModel','bankModelScene','bank'],['enterInformationModel','informationModelScene','information']]){
          await page.evaluate(method=>window.stockWarsApp[method](),method);
          await inspect(key,label);
          await page.evaluate(key=>window.stockWarsApp[key].exit(),key);
          await page.waitForTimeout(200);
        }
        await page.evaluate(()=>window.stockWarsApp.cipherLobby.open());
        await inspect('cipherLobbyScene','securities');
        for(const r of results){assert.equal(r.exposure,.72);assert.deepEqual(r.profile,results[0].profile);assert.deepEqual(r.lights,results[0].lights)}
        assert.deepEqual(errors,[]);
        fs.writeFileSync('output/game-lighting/validation.json',JSON.stringify({results,errors},null,2));
        console.log('PASS',results.map(r=>r.key));
    } finally { await browser.close();server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
