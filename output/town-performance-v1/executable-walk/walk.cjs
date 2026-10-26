const fs = require('fs');
const path = require('path');
const {chromium} = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = __dirname;
const stats = values => {
  const a = [...values].sort((x,y)=>x-y), mean=a.reduce((x,y)=>x+y,0)/a.length;
  return {frames:a.length,meanMs:mean,fps:1000/mean,p95Ms:a[Math.floor(a.length*.95)],p99Ms:a[Math.floor(a.length*.99)],over33Ms:a.filter(v=>v>33.5).length,over50Ms:a.filter(v=>v>50).length};
};
(async()=>{
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9238');
  const page = browser.contexts()[0].pages().find(p=>p.url().includes('index.html'));
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try {
    const environment = await page.evaluate(async()=>{
      const app=window.stockWarsExhibition, s=app.scenes.townModelScene;
      await s.ready; app.arrival.stop(); app.scenes.tourActive=true; app.view.panel.hidden=true;
      await app.scenes.show('arrival');
      const c=s.town.playerController;
      const probe=window.__walkProbe={samples:[],draws:[],recording:false,c,s};
      let previous,lastX=c.charPosX,lastY=c.charPosY;
      const tick=now=>{
        
        if(probe.recording&&previous!==undefined)probe.samples.push({ms:now-previous,x:c.charPosX,y:c.charPosY,legal:c.canStand(c.charPosX,c.charPosY),moving:Math.hypot(c.charPosX-lastX,c.charPosY-lastY)>.001,playerState:s.player.state,calls:s.renderer.info.render.calls,triangles:s.renderer.info.render.triangles,hidden:document.hidden});
        lastX=c.charPosX;lastY=c.charPosY;previous=now;if(probe.goal){const g=probe.goal;const value=g.axis==='x'?c.charPosX:c.charPosY;if((g.sign>0&&value>=g.target)||(g.sign<0&&value<=g.target)){window.dispatchEvent(new KeyboardEvent('keyup',{code:'Key'+g.key.toUpperCase(),key:g.key,bubbles:true}));probe.recording=false;probe.goal=null;probe.completed=true;}}probe.frame=requestAnimationFrame(tick);
      };
      probe.frame=requestAnimationFrame(tick);
      probe.originalDraw=s.draw;
      s.draw=function(){const t=performance.now();probe.originalDraw.call(this);if(probe.recording)probe.draws.push(performance.now()-t);};
      const gl=s.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
      return {ua:navigator.userAgent,url:location.href,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,hidden:document.hidden,gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),music:s.music.currentStage};
    });
    console.log('ENV',JSON.stringify(environment));
    const routes=[{name:'entry',x:1960,y:2290,key:'w',back:'s',dx:0,dy:-1},{name:'plaza',x:1450,y:1750,key:'d',back:'a',dx:1,dy:0},{name:'north',x:1300,y:1160,key:'d',back:'a',dx:1,dy:0}];
    const runs=[];
    for(const [pass,enabled]of [false,true,true,false].entries()){
      for(const route of routes){
        await page.evaluate(({route,enabled})=>{const p=window.__walkProbe;p.recording=false;p.samples=[];p.draws=[];Object.assign(p.c,{charPosX:route.x,charPosY:route.y});p.c.facing=route.key==='w'?'up':'right';p.s.player.storyTarget=p.s.player.storyCamera=null;p.s.renderCulling.enabled=enabled;}, {route,enabled});
        await page.waitForTimeout(700);
        await page.evaluate(route=>{const p=window.__walkProbe;p.completed=false;p.goal={axis:route.dx?'x':'y',sign:route.dx||route.dy,target:(route.dx?route.x:route.y)+(route.dx||route.dy)*600,key:route.key};p.recording=true;},route);
        await page.keyboard.down(route.key);await page.waitForFunction(()=>window.__walkProbe.completed,null,{timeout:15000});await page.keyboard.up(route.key);
        const turn=await page.evaluate(()=>{const p=window.__walkProbe;p.recording=false;return {x:p.c.charPosX,y:p.c.charPosY};});
        await page.waitForTimeout(120);
        await page.evaluate(route=>{const p=window.__walkProbe;p.completed=false;p.goal={axis:route.dx?'x':'y',sign:-(route.dx||route.dy),target:route.dx?route.x:route.y,key:route.back};p.recording=true;},route);
        await page.keyboard.down(route.back);await page.waitForFunction(()=>window.__walkProbe.completed,null,{timeout:15000});await page.keyboard.up(route.back);
        const data=await page.evaluate(()=>{const p=window.__walkProbe;p.recording=false;return {samples:p.samples,draws:p.draws,end:{x:p.c.charPosX,y:p.c.charPosY}};});
        const result={pass,enabled,route:route.name,start:{x:route.x,y:route.y},turn,end:data.end,frame:stats(data.samples.map(s=>s.ms)),draw:stats(data.draws),illegalFrames:data.samples.filter(s=>!s.legal).length,hiddenFrames:data.samples.filter(s=>s.hidden).length,movingFrames:data.samples.filter(s=>s.moving).length,meanCalls:data.samples.reduce((a,s)=>a+s.calls,0)/data.samples.length,meanTriangles:data.samples.reduce((a,s)=>a+s.triangles,0)/data.samples.length};
        runs.push({...result,samples:data.samples});console.log('RUN',JSON.stringify(result));
        fs.writeFileSync(path.join(out,'walk-results.json'),JSON.stringify({environment,runs,errors},null,2));
        if(enabled&&pass===1)await page.screenshot({path:path.join(out,route.name+'-walk.png')});
      }
    }
    const summary=[];
    for(const route of routes)for(const enabled of [false,true]){
      const subset=runs.filter(r=>r.route===route.name&&r.enabled===enabled);
      summary.push({route:route.name,enabled,frame:stats(subset.flatMap(r=>r.samples.map(s=>s.ms))),meanCalls:subset.reduce((a,r)=>a+r.meanCalls,0)/subset.length,illegalFrames:subset.reduce((a,r)=>a+r.illegalFrames,0),hiddenFrames:subset.reduce((a,r)=>a+r.hiddenFrames,0)});
    }
    fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({environment,summary,errors},null,2));console.log('SUMMARY',JSON.stringify(summary));
  } finally {
    await page.keyboard.up('w');await page.keyboard.up('s');await page.keyboard.up('a');await page.keyboard.up('d');
    await page.evaluate(()=>{const p=window.__walkProbe;if(!p)return;p.recording=false;cancelAnimationFrame(p.frame);p.s.draw=p.originalDraw;p.s.renderCulling.enabled=true;window.stockWarsExhibition.scenes.tourActive=false;delete window.__walkProbe;});
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
