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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);const result=await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.busy=true;a.view.panel.hidden=true;const {createIndoorOcclusion}=await import('/js/components/town3d/IndoorOcclusion.js');const {PerspectiveCamera,Vector3}=await import('/vendor/three/three.module.js');const result=[];for(const place of ['home','information','bank','store','stock']){const room=await a.scenes.prepareRoom(place);const rig=createIndoorOcclusion(room.room);const before=new Map();room.room.traverse(m=>{if(m.isMesh)before.set(m,m.visible)});const actor=room.player.root;actor.updateMatrixWorld(true);const target=actor.getWorldPosition(new Vector3());target.y+=60;const camera=new PerspectiveCamera(45,1.6,1,6000);let hidden=0;for(const [x,z] of [[0,-1000],[-1000,0],[1000,0]]){camera.position.set(target.x+x,200,target.z+z);camera.lookAt(target);hidden+=rig.update(camera,[actor]);rig.reset();}for(const [mesh,visible] of before)if(mesh.visible!==visible)throw new Error('visibility not restored '+place+' '+mesh.name);if(!hidden)throw new Error('no wall occlusion '+place);result.push({place,hidden,restored:true});}return result});assert.deepEqual(errors,[]);console.log(JSON.stringify({rooms:result,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
