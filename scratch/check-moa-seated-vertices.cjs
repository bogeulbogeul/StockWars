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
    await new Promise(resolve => server.listen(8111, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        const failedAssets=[];
        page.on('pageerror', e=>errors.push(e.message));
        page.on('response', response=>{
            if(response.status()>=400 && /\/assets\//.test(response.url())) failedAssets.push(response.url());
        });
        await page.goto('http://127.0.0.1:8111/?demo=standard');
        await page.waitForFunction(()=>(window.stockWarsExhibition?.scenes?.townModelScene || window.stockWarsApp?.townModelScene)?.sleepingAnna?.mixer,null,{timeout:90000});
        await page.evaluate(async()=>{ document.querySelector('.crayon-title')?.remove();const screen=document.createElement('section');screen.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(screen);const {playBusArrival}=await import('/js/app/arrival/BusArrival.js');const {createArrivalView}=await import('/js/app/arrival/BusArrivalView.js');screen.innerHTML='<div style="position:absolute;inset:0"></div>';const view=createArrivalView(screen.firstChild);await view.ready;view.render(18,1);window.arrivalView=view; });
        await page.screenshot({path:'scratch/moa-seated-corrected.png',clip:{x:470,y:180,width:470,height:390}});
        await page.evaluate(()=>window.arrivalView.dispose());
        const result=await page.evaluate(async()=>{const scene=(window.stockWarsExhibition?.scenes?.townModelScene || window.stockWarsApp?.townModelScene);const c=scene.town.playerController;const moa=scene.sleepingAnna;await scene.player.ready;const head=moa.root.getObjectByName('Head');await moa.setAwake(false);moa.update(.1);const q=head.quaternion.clone();for(let i=0;i<12;i++)moa.update(.1);const THREE=await import('/vendor/three/three.module.js');const sample=()=>{moa.root.updateMatrixWorld(true);let out={};moa.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();const ids=mesh.geometry.attributes.skinIndex,w=mesh.geometry.attributes.skinWeight;for(const name of ['Body','LegL','LegR']){const id=mesh.skeleton.bones.findIndex(b=>b.name===name);if(id<0)return;let pts=[];for(let i=0;i<ids.count;i++){let weight=0;for(let j=0;j<4;j++)if(ids.getComponent(i,j)===id)weight+=w.getComponent(i,j);if(weight>.8){let v=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);pts.push(v)}}if(!pts.length)continue;const b=new THREE.Box3().setFromPoints(pts);out[name]={min:b.min.toArray(),max:b.max.toArray()};}});return out;};const before=sample();const legs=['LegL','LegR'].map(n=>moa.root.getObjectByName(n));const rotations=legs.map(b=>b.quaternion.clone());for(const b of legs)b.rotateX(Math.PI*.84);const reversed=sample();legs.forEach((b,i)=>b.quaternion.copy(rotations[i]));return {before,reversed,sleepy:moa.expressions.id==='sleepy',sleeping:moa.root.userData.sleeping,nods:q.angleTo(head.quaternion)>.005,platformHeight:moa.root.position.y,seated:moa.root.userData.seated,seatTop:moa.root.userData.seatTop,groundY:moa.root.position.z*(await import('/js/data/townModelBuildings.js')).GROUND_PROJECTION,playerX:c.charPosX,moaX:moa.root.position.x,moaMeshes:(()=>{const a=[];moa.root.traverse(o=>{if(o.isMesh)a.push(o.name)});return a;})(),borrowReleased:!scene.arrivalActive};});for(const name of ['LegL','LegR']) {const leg=result.before[name],body=result.before.Body;assert(leg.max[2]>(body.min[2]+body.max[2])/2+10,'Feet must extend in front of body');assert(leg.max[1]-leg.min[1]<25,'Legs must be raised into seated pose');}assert(result.sleepy && result.sleeping && result.nods && result.platformHeight>0);assert(result.playerX<result.moaX);assert(!result.moaMeshes.some(n=>/Vest/.test(n)));assert(result.borrowReleased);assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);console.log(JSON.stringify({errors,failedAssets,...result}));
    } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

