const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),out=path.resolve('output/window-fit-v1');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(d)});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1264,height:742}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const label=root.includes('win-unpacked')?'packaged':'web';
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');
 await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.exteriorDoors,{},{timeout:120000});
 await page.evaluate(async()=>{const a=window.stockWarsExhibition;await a.scenes.ready;a.arrival.stop();document.querySelector('.crayon-title')?.remove();document.body.classList.remove('title-screen-active');await a.start({showArrivalGuide:true});const live=a.scenes.townModelScene;live.arrivalActive=false;live.resize();});
 const measure=()=>page.evaluate(()=>{const live=window.stockWarsExhibition.scenes.townModelScene,c=live.renderer.domElement,b=c.getBoundingClientRect();return {viewport:[live.viewport.clientWidth,live.viewport.clientHeight],canvas:[b.width,b.height],cache:[live.width,live.height],style:[c.style.width,c.style.height],visible:getComputedStyle(c).visibility,aspect:live.camera.aspect};});
 const checks=[];async function check(name){await page.waitForTimeout(150);const r=await measure();assert.deepEqual(r.canvas,r.viewport);assert.equal(r.aspect,r.viewport[0]/r.viewport[1]);checks.push({name,...r});}
 await check('initial');
 await page.evaluate(async()=>{const live=window.stockWarsExhibition.scenes.townModelScene;live.arrivalActive=true;const host=document.createElement('div');host.id='lease-test';document.body.append(host);const {acquireArrivalRenderer}=await import('/js/app/arrival/ArrivalRenderer.js');window.fitLease=acquireArrivalRenderer(host,live);});
 await page.setViewportSize({width:1920,height:990});await page.waitForTimeout(200);
 await page.evaluate(()=>{window.fitLease.dispose();document.querySelector('#lease-test').remove();window.stockWarsExhibition.scenes.townModelScene.arrivalActive=false;});
 await check('cinematic-return-after-maximize');
 await page.evaluate(()=>{const l=window.stockWarsExhibition.scenes.townModelScene;l.draw();});await page.waitForTimeout(600);
 await page.screenshot({path:out+'/'+label+'-maximized.png'});
 // Reproduce a stale renderer despite an already-current viewport cache.
 await page.evaluate(()=>{const l=window.stockWarsExhibition.scenes.townModelScene;l.renderer.setSize(1264,742);l.resize();});await check('stale-render-size-recovered');
 await page.evaluate(()=>{const l=window.stockWarsExhibition.scenes.townModelScene;l.renderer.domElement.style.width='1264px';l.resize();});await check('stale-css-size-recovered');
 await page.setViewportSize({width:1024,height:768});await check('shrink');await page.setViewportSize({width:1600,height:900});await check('grow-again');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+label+'-checks.json',JSON.stringify({checks,errors},null,2));console.log(label+' '+JSON.stringify(checks));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
