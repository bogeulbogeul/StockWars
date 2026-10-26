const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
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
    await new Promise(resolve => server.listen(8109, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        const failedAssets=[];
        page.on('pageerror', e=>errors.push(e.message));
        page.on('response', response=>{
            if(response.status()>=400 && /\/assets\//.test(response.url())) failedAssets.push(response.url());
        });
        await page.goto('http://127.0.0.1:8109/');
        await page.waitForFunction(()=>window.stockWarsExhibition?.scenes?.townModelScene?.sleepingAnna?.mixer,null,{timeout:90000});
        await page.evaluate(async()=>{ document.querySelector('.crayon-title')?.remove();const screen=document.createElement('section');screen.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(screen);const {playBusArrival}=await import('/js/app/arrival/BusArrival.js');const {createArrivalView}=await import('/js/app/arrival/BusArrivalView.js');screen.innerHTML='<div style="position:absolute;inset:0"></div>';const view=createArrivalView(screen.firstChild);await view.ready;view.render(18,1);window.arrivalView=view; });
        await page.screenshot({path:'scratch/arrival-new-models.png'});
        await page.evaluate(()=>window.arrivalView.dispose());
        const result=await page.evaluate(async()=>{const scene=window.stockWarsExhibition.scenes.townModelScene;const c=scene.town.playerController;const moa=scene.sleepingAnna;await scene.player.ready;const head=moa.root.getObjectByName('Head');await moa.setAwake(false);moa.update(.1);const q=head.quaternion.clone();for(let i=0;i<12;i++)moa.update(.1);return {sleepy:moa.expressions.id==='sleepy',sleeping:moa.root.userData.sleeping,nods:q.angleTo(head.quaternion)>.005,platformHeight:moa.root.position.y,playerX:c.charPosX,moaX:moa.root.position.x,moaMeshes:(()=>{const a=[];moa.root.traverse(o=>{if(o.isMesh)a.push(o.name)});return a;})(),borrowReleased:!scene.arrivalActive};});assert(result.sleepy && result.sleeping && result.nods && result.platformHeight>0);assert(result.playerX<result.moaX);assert(!result.moaMeshes.some(n=>/Vest/.test(n)));assert(result.borrowReleased);assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);console.log(JSON.stringify({errors,failedAssets,...result}));
    } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

