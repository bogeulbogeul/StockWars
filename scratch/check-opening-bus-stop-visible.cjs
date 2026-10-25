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


        await page.evaluate(async()=>{
            const {playBusArrival}=await import('/js/app/arrival/BusArrival.js');
            const screen=document.createElement('section');screen.style.cssText='position:fixed;inset:0;z-index:30000';document.body.append(screen);
            window.captionSamples=[];window.stationSamples=[];
            const watch=new MutationObserver(()=>{const stage=screen.querySelector('.bus-arrival__stage'),caption=screen.querySelector('.bus-arrival__caption');if(caption)window.captionSamples.push({state:screen.dataset.arrivalState,hidden:caption.hidden,text:caption.textContent,busVisible:stage.dataset.busVisible,effectVisible:(window.stockWarsExhibition?.scenes?.townModelScene||window.stockWarsApp?.townModelScene).sleepingAnna.root.getObjectByName('moa-sleep-zzzz').visible,hasSkip:!!screen.querySelector('.opening-sequence__skip')});});
            watch.observe(screen,{subtree:true,attributes:true,childList:true,characterData:true});
            const stop=(window.stockWarsExhibition.scenes.townModelScene).scene.getObjectByName('village_bus_stop');const check=setInterval(()=>{if(!screen.dataset.arrivalState)return;let hidden=0,total=0;stop.traverse(m=>{if(m.isMesh){total++;if(!m.visible)hidden++;}});window.stationSamples.push({state:screen.dataset.arrivalState,hidden,total});},40);window.arrivalFinished=playBusArrival(screen).then(()=>{watch.disconnect();clearInterval(check);screen.remove();});
        });
        await page.waitForFunction(()=>document.querySelector('[data-arrival-state=departed]'),null,{timeout:60000});
        await page.screenshot({path:'scratch/opening-bus-stop-restored.png'});const shown=await page.evaluate(()=>{const c=document.querySelector('.bus-arrival__caption');return {hidden:c.hidden,text:c.textContent,busVisible:document.querySelector('.bus-arrival__stage').dataset.busVisible,effectVisible:(window.stockWarsExhibition?.scenes?.townModelScene||window.stockWarsApp?.townModelScene).sleepingAnna.root.getObjectByName('moa-sleep-zzzz').visible,hasSkip:!!document.querySelector('.opening-sequence__skip')};});
        assert(shown.effectVisible&&!shown.hasSkip);assert(!shown.hidden&&shown.text.includes('누군가')&&!shown.text.includes('모아')&&shown.busVisible==='false');
        await page.screenshot({path:'scratch/bus-departed-with-zzzz.png'});
        await page.evaluate(()=>window.arrivalFinished);
        const stationSamples=await page.evaluate(()=>window.stationSamples);assert(stationSamples.some(x=>x.state==='driving'));assert(stationSamples.some(x=>x.state==='stopped'));assert(stationSamples.every(x=>x.hidden===0),'Bus stop hidden during arrival');const samples=await page.evaluate(()=>window.captionSamples);
        assert(samples.some(s=>s.state==='stopped'&&s.hidden));assert(samples.some(s=>s.state==='departing'&&s.hidden));
        assert(!samples.some(s=>s.text.includes('누군가')&&s.busVisible!=='false'));
        assert(samples.filter(s=>['stopped','departing'].includes(s.state)).every(s=>!s.effectVisible&&s.hasSkip));assert.deepEqual(errors,[]);console.log(JSON.stringify({stationFrames:stationSamples.length,allStopMeshesVisible:true,shown,hiddenUntilDeparted:true,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
