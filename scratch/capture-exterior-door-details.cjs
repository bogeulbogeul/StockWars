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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.exteriorDoors,{},{timeout:120000});for(let i=0;i<6;i++){const data=await page.evaluate(async index=>{const a=window.stockWarsExhibition,t=a.scenes.townModelScene,d=t.exteriorDoors.doors[index];a.arrival.stop();t.arrivalActive=false;t.entryActive=true;t.dialogueOcclusion.reset();await d.open();t.renderer.setPixelRatio(1);t.scene.updateMatrixWorld(true);t.landscape.center.value=d.center.z;t.camera.position.set(d.center.x+80,d.floorY+130,d.center.z+380);t.camera.lookAt(d.center.x,d.floorY+55,d.center.z);t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/png')},i);fs.writeFileSync('output/all-exterior-door-hinges-v1/door-'+i+'-detail.png',Buffer.from(data.split(',')[1],'base64'))}console.log('Saved six doorway detail renders')}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
