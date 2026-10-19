const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file,(error,data) => {
        if(error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    let browser;
    try {
        browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
        const page = await browser.newPage({viewport:{width:1280,height:1000}});
        const errors=[]; page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
        await page.waitForFunction(()=>window.stockWarsApp?.itemEngine);
        await page.evaluate(async()=>{window.stockWarsApp.helpModal.open();});
        assert.equal(await page.locator('.help-tabs button').count(),7);
        for(let i=0;i<7;i++) {
            await page.locator('.help-tabs button').nth(i).click();
            assert.equal(await page.locator('.help-count').textContent(),`${i+1} / 7`);
            assert.ok((await page.locator('.help-next-action').textContent()).length>5);
            assert.equal(await page.locator('.help-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
        }
        await page.screenshot({path:path.resolve(__dirname,'help-rent.png')});
        await page.locator('.help-tabs button').nth(3).click();
        await page.waitForFunction(()=>[...document.querySelectorAll('.help-visual img')].every(img=>img.complete&&img.naturalWidth>0));
        await page.screenshot({path:path.resolve(__dirname,'help-recovery.png')});
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('.help-count').textContent(),'5 / 7');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.help-dialog').evaluate(el=>el.open),false);
        assert.deepEqual(errors,[]);
        console.log('PASS: seven help pages, content, no overflow, recovery image, keyboard navigation and close, no browser errors');
    } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

