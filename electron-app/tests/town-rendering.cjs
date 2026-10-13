const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'stockwars-town-render-')));
app.whenReady().then(async()=>{
 try {
  const win=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:true}});
  await win.loadFile(path.resolve(__dirname,'../../web/tests/townRendering.browser.html'));
  const result=await win.webContents.executeJavaScript(`new Promise(resolve=>{const start=Date.now();const timer=setInterval(()=>{if(window.townRenderResult||Date.now()-start>15000){clearInterval(timer);resolve(window.townRenderResult||{pass:false,error:'timeout'});}},50);})`);
  console.log(JSON.stringify(result,null,2));
  await win.webContents.executeJavaScript(`document.querySelector('#results').style.display='none'`);
  const capture=await win.webContents.capturePage();
  fs.mkdirSync(path.resolve(__dirname,'../../output/town-scale'),{recursive:true});
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/salon-render.png'),capture.toPNG());
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/render-result.json'),JSON.stringify(result,null,2));
  await win.loadFile(path.resolve(__dirname,'../../web/index.html'));
  const gameResult=await win.webContents.executeJavaScript(`new Promise(resolve=>{
   const start=Date.now();const timer=setInterval(()=>{
    const stage=window.stockWarsApp?.townStage;
    if(stage){clearInterval(timer);window.stockWarsApp.titleScreen.hide();document.querySelector('#titleScreen').style.display='none';window.stockWarsApp.officeStage?.hide();stage.show(undefined,'claire_apparel');
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const node=document.querySelector('#building_claire_apparel .building-artwork');
      const box=document.querySelector('#building_claire_apparel');
      const scale=node.getBoundingClientRect().height/Number(node.getAttribute('height'));
      resolve({url:location.href,name:box.dataset.buildingName,height:Number(node.getAttribute('height')),screenHeight:node.getBoundingClientRect().height,scale,src:node.querySelector('image').getAttribute('href'),pass:Number(node.getAttribute('height'))===405&&node.querySelector('image').getAttribute('href').includes('SalonDeTail-v2.png')});
     }));
    }else if(Date.now()-start>15000){clearInterval(timer);resolve({pass:false,error:'game startup timeout'});}
   },100);
  })`);
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/game-render-result.json'),JSON.stringify(gameResult,null,2));
  await new Promise(resolve=>setTimeout(resolve,500));
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/game-salon.png'),(await win.webContents.capturePage()).toPNG());
  const boardResult=await win.webContents.executeJavaScript(`(async()=>{
   const {TOWN_LANDSCAPE}=await import('./js/data/townLandscape.js');
   const board=TOWN_LANDSCAPE.find(p=>p.type==='billboard'),stage=window.stockWarsApp.townStage;
   stage.playerController.placeAt(board);stage.playerController.updateCamera(innerWidth/.72,innerHeight/.72,0,true);stage.update(0);
   const screen=document.querySelector('.town-information-screen'),body=screen.querySelector('.news-body-text'),ticker=screen.querySelector('.town-board-ticker');
   const bounds=screen.getBoundingClientRect(),r=ticker.getBoundingClientRect();
   return {bodyHeight:body.clientHeight,bodyFont:getComputedStyle(body).fontSize,tickerFont:getComputedStyle(ticker.querySelector('span')).fontSize,pass:body.clientHeight>=30&&r.bottom<=bounds.bottom};
  })()`);
  await new Promise(resolve=>setTimeout(resolve,250));
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/billboard.png'),(await win.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.resolve(__dirname,'../../output/town-scale/billboard-result.json'),JSON.stringify(boardResult,null,2));
  app.exit(result.pass&&gameResult.pass&&boardResult.pass?0:1);
 }catch(error){console.error(error);app.exit(1);}
});
