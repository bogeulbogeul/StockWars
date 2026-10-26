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

        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsExhibition?.arrival?.active&&window.stockWarsExhibition?.scenes?.townModelScene?.sleepingAnna);

        const result=await page.evaluate(async()=>{
            const app=window.stockWarsExhibition,scene=app.scenes.townModelScene,actor=scene.sleepingAnna;
            const {createArrivalView}=await import('/js/app/arrival/BusArrivalView.js');
            const effect=actor.root.getObjectByName('moa-sleep-zzzz');await actor.setAwake(false);
            const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:30000';document.body.append(host);
            const view=createArrivalView(host);await view.ready;view.render(10,1);actor.update(.1);
            const hiddenWithBus=!effect.visible;window.busTestView=view;window.busTestHost=host;
            return {hiddenWithBus,stillSleeping:actor.root.userData.sleeping};
        });
        await page.screenshot({path:'scratch/bus-no-sleep-effect.png'});
        const cleanup=await page.evaluate(async()=>{
            const scene=window.stockWarsExhibition.scenes.townModelScene,actor=scene.sleepingAnna,effect=actor.root.getObjectByName('moa-sleep-zzzz');
            window.busTestView.dispose();const restored=effect.visible;
            const {createArrivalView}=await import('/js/app/arrival/BusArrivalView.js');
            let view=createArrivalView(window.busTestHost);await view.ready;await actor.setAwake(true,{immediate:true});view.dispose();const awakeStaysHidden=!effect.visible;
            await actor.setAwake(false);view=createArrivalView(window.busTestHost);view.dispose();await view.ready;
            const earlySkipRestored=effect.visible&&!scene.arrivalActive;
            window.busTestHost.remove();return {restored,awakeStaysHidden,earlySkipRestored};
        });
        assert(result.hiddenWithBus&&result.stillSleeping&&cleanup.restored&&cleanup.awakeStaysHidden&&cleanup.earlySkipRestored);assert.deepEqual(errors,[]);console.log(JSON.stringify({result,cleanup,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
