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
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.exteriorDoors,{},{timeout:120000});
 await page.evaluate(async()=>{const a=window.stockWarsExhibition,t=a.scenes.townModelScene;a.arrival.stop();t.arrivalActive=false;t.entryActive=true;t.dialogueOcclusion.reset();t.renderer.setPixelRatio(1);const {createInformationDoor}=await import('/js/app/exhibition/InformationDoor.js');window.blackoutDoors=[...t.exteriorDoors.doors];for(const [id,opts] of [['settlement_information',{}],['home_office_tower',{id:'home',panelName:'Home_Arched_Wood_Door',hingeName:'Home_Door_Brass_Hinge',isPart:p=>p.name.startsWith('Home_Door_'),darkFill:p=>p.name==='Home_Door_Round_Window_Glass'}],['vivian_store',{id:'store',panelName:'Central_Arched_Wood_Door',isPart:p=>p.name.startsWith('Door_')&&p.name!=='Door_Continuous_Arch_Frame',darkFill:p=>p.name==='Door_Glass'}]])window.blackoutDoors.push(createInformationDoor(t.scene.getObjectByName(id),opts));});
 const output='output/doorway-blackout-v1';fs.mkdirSync(output,{recursive:true});const rows=[];
 for(let i=0;i<9;i++){
 const result=await page.evaluate(async index=>{const t=window.stockWarsExhibition.scenes.townModelScene,d=window.blackoutDoors[index];await d.open();const {Vector3,Box3,Raycaster}=await import('/vendor/three/three.module.js');t.scene.updateMatrixWorld(true);let mask; t.scene.traverse(o=>{if(o.name.includes('door-dark-interior')&&o.visible){const b=new Box3().setFromObject(o),c=b.getCenter(new Vector3());if(Math.hypot(c.x-d.center.x,c.z-d.center.z)<50)mask=o}});if(!mask)throw Error('missing mask '+index);mask.geometry.computeBoundingBox();const local=mask.geometry.boundingBox;const world=new Box3().setFromObject(mask),center=world.getCenter(new Vector3());t.landscape.center.value=center.z;const checks=[];const pictures=[];
 for(const offset of [0,80]){t.camera.position.set(center.x+offset,center.y+25,center.z+400);t.camera.lookAt(center);t.scene.updateMatrixWorld(true);t.camera.updateMatrixWorld(true);t.renderer.render(t.scene,t.camera);const canvas=document.createElement('canvas');canvas.width=t.renderer.domElement.width;canvas.height=t.renderer.domElement.height;const ctx=canvas.getContext('2d');ctx.drawImage(t.renderer.domElement,0,0);const misses=[];let checked=0,leaves=0;
 for(let iy=0;iy<9;iy++)for(let ix=0;ix<11;ix++){const pt=mask.localToWorld(new Vector3(local.min.x+(local.max.x-local.min.x)*(.15+ix*.07),local.min.y+(local.max.y-local.min.y)*(.1+iy*.065),0));const ray=new Raycaster(t.camera.position,pt.clone().sub(t.camera.position).normalize());const hits=ray.intersectObject(mask.parent,true).filter(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return !h.object.userData.renderOnly});const hit=hits[0];if(hit&&hit.object!==mask&&hit.object.userData.dynamicDoor){leaves++;continue}const pixel=pt.project(t.camera),x=Math.round((pixel.x+1)*canvas.width/2),y=Math.round((1-pixel.y)*canvas.height/2);const rgb=Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);checked++;if(Math.max(...rgb)>2){let edge=false;for(const dx of [-1,0,1])for(const dy of [-1,0,1]){ray.setFromCamera({x:((x+dx+.5)/canvas.width)*2-1,y:1-((y+dy+.5)/canvas.height)*2},t.camera);const h=ray.intersectObject(mask.parent,true).find(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return !h.object.userData.renderOnly});if(h&&h.object!==mask&&h.object.userData.dynamicDoor)edge=true;}if(edge){checked--;leaves++;}else misses.push({ix,iy,rgb,hit:hit?.object.name});}}
 checks.push({offset,checked,leaves,misses});pictures.push(t.renderer.domElement.toDataURL('image/png'));}
 await d.close();return {index,name:mask.name,checks,pictures,closedHidden:!mask.visible};},i);
 for(let j=0;j<result.pictures.length;j++)fs.writeFileSync(output+'/'+(root.includes('resources')?'executable':'web')+'-'+i+'-'+j+'.png',Buffer.from(result.pictures[j].split(',')[1],'base64'));delete result.pictures;rows.push(result);
 }
 fs.writeFileSync(output+'/'+(root.includes('resources')?'executable':'web')+'-checks.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({rows,errors},null,2));assert.deepEqual(errors,[]);for(const row of rows){assert(row.closedHidden);for(const c of row.checks){assert(c.checked>20);assert.equal(c.misses.length,0,row.name+' offset '+c.offset)}}
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
