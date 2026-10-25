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



(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r)); const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/');
 const results=await page.evaluate(async()=>{
 const {GLTFLoader}=await import('/vendor/three/GLTFLoader.js'); const {Vector3}=await import('/vendor/three/three.module.js');
 const {createExteriorDoor,EXTERIOR_DOORS,ExteriorDoorProximity}=await import('/js/components/town3d/ExteriorDoors.js');
 const {createBankDoor}=await import('/js/app/exhibition/BankEntry.js');
 const files=['Bank-clean.glb','Furniture-clean.glb','Pub-clean.glb','CipherSecurities-clock.glb','Bookstore-clean.glb','PostOffice.glb'];const rows=[];
 for(const [index,id] of Object.keys(EXTERIOR_DOORS).entries()){
 const b=(await new GLTFLoader().loadAsync('/assets/buildings/3d/'+files[index])).scene;
 b.name=id;b.position.set(1500,3,2000);b.scale.setScalar(100);b.rotation.y=.2;b.updateMatrixWorld(true);
 const originals=[];b.traverse(p=>{if(p.isMesh)originals.push({p,pos:p.getWorldPosition(new Vector3())})});
 const door=createExteriorDoor(b);if(id==='node_finance'&&createBankDoor(b)!==door)throw Error('bank cache mismatch');
 const pins=door.panels.flatMap(p=>p.pins);const pinCenters=pins.map(p=>{p.geometry.computeBoundingBox();return p.geometry.boundingBox.getCenter(new Vector3())});const pinPositions=pins.map((p,i)=>p.localToWorld(pinCenters[i].clone()));
 const initialError=Math.max(...originals.map(({p,pos})=>p.getWorldPosition(new Vector3()).distanceTo(pos)));
 await door.open();b.updateMatrixWorld(true);
 const pinDrift=Math.max(...pins.map((p,i)=>p.localToWorld(pinCenters[i].clone()).distanceTo(pinPositions[i])));
 const fixed=originals.filter(({p})=>!p.userData.dynamicDoor);
 const frameDrift=Math.max(...fixed.map(({p,pos})=>p.getWorldPosition(new Vector3()).distanceTo(pos)));
 const swing=Math.max(...originals.map(({p,pos})=>p.getWorldPosition(new Vector3()).distanceTo(pos)));
 const angles=door.panels.map(p=>p.pivot.rotation.y);
 await door.close();b.updateMatrixWorld(true);
 const restore=Math.max(...originals.map(({p,pos})=>p.getWorldPosition(new Vector3()).distanceTo(pos)));
 const manager=new ExteriorDoorProximity(b);manager.update(door.center.x,door.center.z+100);const nearOpens=door.isOpen;manager.update(door.center.x+1000,door.center.z+1000);await door.close();const farCloses=!door.isOpen;
 rows.push({id,leaves:door.panels.length,pins:pins.length,initialError,pinDrift,frameDrift,swing,angles,restore,nearOpens,farCloses,moving:originals.filter(({p})=>p.userData.dynamicDoor).map(({p})=>p.name)});
 }
 return rows;
 });
 for(const r of results){assert.equal(r.leaves,['data_ink_bookstore','post_office'].includes(r.id)?1:2,r.id);assert(r.pins>=2);assert(r.pinDrift<1e-5,r.id+' pins drift');assert(r.initialError<1e-5);assert(r.restore<1e-5);assert(r.frameDrift<1e-5);assert(r.swing>1);assert(r.nearOpens&&r.farCloses);if(r.leaves===2)assert(r.angles.some(a=>a<0)&&r.angles.some(a=>a>0))}
 fs.mkdirSync('output/all-exterior-door-hinges-v1',{recursive:true});fs.writeFileSync('output/all-exterior-door-hinges-v1/'+(root.includes('resources')?'executable':'web')+'-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({moving,...row})=>({...row,movingParts:moving.length})),null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
