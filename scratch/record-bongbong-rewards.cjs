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
 try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');
 await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);
 await page.evaluate(async()=>{
 const a=window.stockWarsExhibition;a.arrival.stop();a.started=true;const s=a.scenes;await s.ready;const r=await s.prepareRoom('store');s.place='store';s.townStage.containerEl.classList.add('hidden');r.active=true;r.layer.classList.remove('hidden');r.resize();r.renderer.setPixelRatio(1);r.controller.charPosX=146;r.controller.charPosY=-77*.438371146789;r.shopkeeper.position.set(19/75,.025,-160/75);r.player.update(0);r.startLoop();Object.assign(a.state.flags,{packing:true,bank:true});a.state.cash=5000;a.state.stamina=2;a.state.nickname='소망이';a.state.cursor=a.plan.findIndex(b=>b.text==='고생했어요. 덕분에 주문을 모두 준비했네요.');window.hiddenRewardFrames=0;const render=r.renderer.render.bind(r.renderer);r.renderer.render=(...args)=>{if(!r.room.getObjectByName('Packing_Worktop').visible)window.hiddenRewardFrames++;return render(...args)};void a.render();
 });
 await page.waitForFunction(()=>!window.stockWarsExhibition.busy||window.stockWarsExhibition.scenes.receivingItem);await page.waitForTimeout(1400);
 const folder=path.resolve('scratch/bongbong-rewards-frames');fs.mkdirSync(folder,{recursive:true});
 const cdp=await page.context().newCDPSession(page),frames=[];
 cdp.on('Page.screencastFrame',event=>{const file=path.join(folder,String(frames.length).padStart(5,'0')+'.jpg');fs.writeFileSync(file,Buffer.from(event.data,'base64'));frames.push({file,time:event.metadata.timestamp});void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1280,maxHeight:800,everyNthFrame:1});
 for(let n=0;n<18;n++){
  const beat=await page.evaluate(()=>{const a=window.stockWarsExhibition;return a.plan[a.state.cursor]});
  if(beat.id==='wage'||beat.id==='envelope'){
   const title=beat.id==='wage'?'보수주머니를 받아보자':'소식봉투를 받아보자';
   await page.getByText(title,{exact:true}).waitFor();await page.waitForTimeout(1700);
   await page.screenshot({path:'scratch/bongbong-'+beat.id+'-visible-desk.png'});
   await page.keyboard.press('f');await page.waitForFunction(id=>!!window.stockWarsExhibition.state.flags[id],beat.id);await page.waitForFunction(()=>!window.stockWarsExhibition.busy||window.stockWarsExhibition.scenes.receivingItem);
   if(beat.id==='envelope'){await page.waitForTimeout(2300);break;}
  }else{await page.waitForTimeout(1700);await page.locator('.exhibition-panel .dialogue-next-triangle').click();await page.waitForFunction(()=>!window.stockWarsExhibition.busy||window.stockWarsExhibition.scenes.receivingItem);}
 }
 await cdp.send('Page.stopScreencast');
 const result=await page.evaluate(()=>({cash:window.stockWarsExhibition.state.cash,wage:window.stockWarsExhibition.state.flags.wage,envelope:window.stockWarsExhibition.state.flags.envelope,hiddenFrames:window.hiddenRewardFrames}));
 assert(result.wage&&result.envelope);assert.equal(result.cash,5500);assert.equal(result.hiddenFrames,0);assert.deepEqual(errors,[]);assert(frames.length>50);
 const lines=[];for(let i=0;i<frames.length;i++){lines.push("file '"+frames[i].file.replaceAll('\\','/')+"'");if(i<frames.length-1)lines.push('duration '+Math.max(.01,frames[i+1].time-frames[i].time).toFixed(6));}
 fs.writeFileSync('scratch/bongbong-rewards-video.txt',lines.join('\n')+'\n');fs.writeFileSync('scratch/bongbong-rewards-video-report.json',JSON.stringify({frames:frames.length,result,errors},null,2));console.log(JSON.stringify({frames:frames.length,result,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});


