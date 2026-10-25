const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const p=await b.newPage({viewport:{width:1440,height:1000}});const root=path.resolve('web');
await p.route('**/*',async r=>{const u=new URL(r.request().url());if(u.pathname==='/inspect.html')return r.fulfill({contentType:'text/html',body:`<link rel="stylesheet" href="/css/style.css"><script type="module">import * as THREE from '/vendor/three/three.module.js';import {VivianModelScene} from '/js/components/store3d/VivianModelScene.js';window.THREE=THREE;window.s=new VivianModelScene(document.body,()=>{},()=>{});await s.ready;s.show();window.done=true;</script>`});try{const f=path.join(root,decodeURIComponent(u.pathname));await r.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});}catch{await r.fulfill({status:404,body:''})}});
p.on('pageerror',e=>console.log('ERROR',e.message));await p.goto('http://local/inspect.html');await p.waitForFunction(()=>window.done,{timeout:90000});
for(const [name,fixture,pattern,side] of [['cabinet-front','shelf','^Shelf_',1],['fridge-front','fridge','^Fridge_',-1]]) {
await p.evaluate(({fixture,pattern,side})=>{
 s.hide();s.layer.classList.remove('hidden');
 s.scene.background=new THREE.Color('#f4f0e7');
 s.scene.traverse(o=>{if(o.isMesh){let isProduct=false;for(let node=o;node;node=node.parent){if(node.userData.fixture){isProduct=node.userData.fixture===fixture;break;}}o.visible=isProduct||new RegExp(pattern).test(o.name);}});
 s.scene.updateMatrixWorld(true);
 const box=new THREE.Box3();s.scene.traverse(o=>{if(o.isMesh&&o.visible)box.union(new THREE.Box3().setFromObject(o));});
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const aspect=1440/1000,half=Math.max(size.y/2,size.z/(2*aspect))*1.15;
 const camera=new THREE.OrthographicCamera(-half*aspect,half*aspect,half,-half,.1,3000);
 camera.position.set(center.x+side*600,center.y,center.z);camera.lookAt(center);camera.updateProjectionMatrix();
 s.renderer.render(s.scene,camera);
}, {fixture,pattern,side});
await p.screenshot({path:`output/shop-items-game-v1/${name}.png`});
}
await b.close()})();
