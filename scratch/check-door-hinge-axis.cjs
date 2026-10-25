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
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 const page=await browser.newPage(); await page.goto('http://127.0.0.1:'+server.address().port+'/');
 const results=await page.evaluate(async()=>{
 const {GLTFLoader}=await import('/vendor/three/GLTFLoader.js');
 const {Vector3}=await import('/vendor/three/three.module.js');
 const {createInformationDoor}=await import('/js/app/exhibition/InformationDoor.js');
 const defs=[['Information-clean.glb',{}],['Home-inset-window.glb',{id:'home',panelName:'Home_Arched_Wood_Door',hingeName:'Home_Door_Brass_Hinge',isPart:p=>p.name.startsWith('Home_Door_')}],['VivianStore-clean.glb',{id:'store',panelName:'Central_Arched_Wood_Door',isPart:p=>p.name.startsWith('Door_')&&p.name!=='Door_Continuous_Arch_Frame'}]];
 const output=[];
 for(const [file,opts] of defs){
 const b=(await new GLTFLoader().loadAsync('/assets/buildings/3d/'+file)).scene;
 b.position.set(1500,3,2000);b.scale.setScalar(100);b.rotation.y=.2;b.updateMatrixWorld(true);
 const hinges=[];b.traverse(p=>{if(p.name.startsWith(opts.hingeName||'Door_Brass_Hinge'))hinges.push(p)});
 const before=hinges.map(p=>p.getWorldPosition(new Vector3()));
 const door=createInformationDoor(b,opts),pivot=b.getObjectByName((opts.id||'information')+'-opening-door');
 const parts=pivot.children.map(p=>({p,pos:p.getWorldPosition(new Vector3())}));
 await door.open();b.updateMatrixWorld(true);
 const drift=Math.max(...hinges.map((p,i)=>p.getWorldPosition(new Vector3()).distanceTo(before[i])));
 const angle=pivot.rotation.y;
 await door.close();b.updateMatrixWorld(true);
 const restore=Math.max(...parts.map(({p,pos})=>p.getWorldPosition(new Vector3()).distanceTo(pos)));
 output.push({file,hinges:hinges.length,drift,angle,restore,parts:parts.length});
 }
 return output;
 });
 for(const r of results){assert.equal(r.hinges,2);assert(r.drift<1e-5);assert(r.angle>0);assert(r.restore<1e-5)}
 console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
