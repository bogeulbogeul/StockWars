const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const {PresenceRegistry}=await import('../Server/presence/registry.mjs');const {createPresenceServer}=await import('../Server/presence/server.mjs');
 let now=1000000;const registry=new PresenceRegistry({now:()=>now});
 const a=registry.session(),b=registry.session(),c=registry.session();for(const [s,n] of [[a,'방장테스터'],[b,'친구테스터'],[c,'오프라인친구']])registry.update(s.token,'nickname',undefined,{nickname:n});
 for(const s of [b,c]){registry.friends(a.token,{operation:'request',targetId:s.playerId});registry.friends(s.token,{operation:'accept',targetId:a.playerId});}registry.update(c.token,'disconnect');
 const api=createPresenceServer({registry});const root=process.cwd();const web=http.createServer((req,res)=>{
   if(req.url.startsWith('/api/')){api.emit('request',req,res);return;}
   const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
   fs.readFile(p,(e,body)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(e?'missing':body);});
 });await new Promise(resolve=>web.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const pages=[];
  for(const [s,name] of [[a,'방장테스터'],[b,'친구테스터']]){
   const context=await browser.newContext({viewport:{width:1600,height:1000}});const page=await context.newPage();page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
   await page.addInitScript(({token})=>{
    const request=async(url,input)=>{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(input)});return response.json();};
    window.stockWarsChat={friends:(operation,targetId,options={})=>request('/api/chat',{action:'friends',operation,targetId,...options}),list:()=>request('/api/chat',{action:'list'}),room:(action,options)=>request('/api/chat',{action,...options})};
    window.stockWarsArena={request:input=>request('/api/arena',input)};
    window.stockWarsPresence={claimNickname:nickname=>request('/api/presence',{action:'nickname',pose:{nickname}}).then(snapshot=>({snapshot})),join:channelId=>request('/api/presence',{action:'join',channelId}).then(snapshot=>({snapshot})),leave:()=>request('/api/presence',{action:'leave'}).then(snapshot=>({snapshot})),position:pose=>request('/api/presence',{action:'position',pose}).then(snapshot=>({snapshot}))};
   },{token:s.token});
   await page.goto(`http://127.0.0.1:${web.address().port}/web/index.html`);await page.waitForFunction(()=>window.stockWarsApp?.cipherLobby?.competitionRoom);
   await page.evaluate(name=>{const app=window.stockWarsApp;app.userProfile={nickname:name};app.titleScreen.hide();app.cipherLobby.competitionRoom.open();},name);pages.push(page);
  }
  const [host,guest]=pages;
  const form=host.locator('.cipher-arena [data-create]');await form.locator('[name=name]').fill('온라인검증방');await form.locator('[name=minutes]').selectOption('3');await form.locator('[name=cash]').selectOption('100000');await form.locator('[name=stake]').fill('0');await form.locator('[name=access]').selectOption('locked');await form.locator('[name=password]').fill('test1234');await form.locator('button').click();
  await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState?.phase==='waiting');
  await host.waitForFunction(()=>document.querySelector('[data-friends]').textContent.includes('친구테스터'));
  const rows=host.locator('.cipher-arena [data-friends]>div');const offline=rows.filter({hasText:'오프라인친구'});assert.equal(await offline.locator('button').isDisabled(),true);
  await rows.filter({hasText:'친구테스터'}).locator('button').click();
  await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.invites?.length===1);
  await guest.locator('.cipher-arena [data-public-rooms]>section').filter({hasText:'님의 초대'}).locator('button').click();
  await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState?.members.length===2);
  await host.screenshot({path:'scratch/online-arena-lobby.png'});
  await host.getByRole('button',{name:'준비',exact:true}).click();await guest.getByRole('button',{name:'준비',exact:true}).click();
  await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState?.members.every(p=>p.ready));
  await host.getByRole('button',{name:'온라인 대결 시작',exact:true}).click();
  await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineMatchId);
  const trade=host.locator('.cipher-training[open]:not(.cipher-arena)');await trade.locator('[data-buy]').click();
  await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState.market.portfolio.length===1);
  const guestCash=await guest.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState.market.cash);assert.equal(guestCash,100000);
  now+=10000;await host.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.refreshPublicRooms());await guest.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.refreshPublicRooms());
  const prices1=await host.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState.market.stocks.map(s=>s.price));const prices2=await guest.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState.market.stocks.map(s=>s.price));assert.deepEqual(prices1,prices2);
  await host.screenshot({path:'scratch/online-arena-host.png'});await guest.screenshot({path:'scratch/online-arena-guest.png'});
  now+=180000;await host.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.refreshPublicRooms());await guest.evaluate(()=>window.stockWarsApp.cipherLobby.competitionRoom.refreshPublicRooms());
  console.log('FINISH_STATE',await host.evaluate(()=>{const c=window.stockWarsApp.cipherLobby.competitionRoom;return{phase:c.onlineState?.phase,error:c.publicError,loading:c.publicLoading};}));
  await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.resultShown);await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.resultShown);
  assert.equal(await host.getByRole('dialog',{name:'온라인 대결 결과'}).isVisible(),true);assert.equal(await guest.getByRole('dialog',{name:'온라인 대결 결과'}).isVisible(),true);
  await host.getByRole('dialog',{name:'온라인 대결 결과'}).getByRole('button',{name:'확인',exact:true}).click(); assert.equal(await host.getByRole('dialog',{name:'온라인 대결 결과'}).isVisible(),true); await guest.getByRole('dialog',{name:'온라인 대결 결과'}).getByRole('button',{name:'확인',exact:true}).click(); await host.waitForFunction(()=>!window.stockWarsApp.cipherLobby.competitionRoom.onlineState);await guest.waitForFunction(()=>!window.stockWarsApp.cipherLobby.competitionRoom.onlineState);await host.getByRole('button',{name:'전적 보기',exact:true}).click();await host.waitForFunction(()=>[...document.querySelectorAll('dialog')].some(d=>d.getAttribute('aria-label')==='모의투자 전적'&&d.textContent.includes('온라인검증방')));await host.getByRole('dialog',{name:'모의투자 전적'}).getByRole('button',{name:'닫기',exact:true}).click();
  const aiForm=host.locator('.cipher-arena [data-create]');await aiForm.locator('[name=mode]').selectOption('ai');await aiForm.locator('[name=name]').fill('AI검증방');await aiForm.locator('[name=stake]').fill('0');await aiForm.locator('button').click();await host.getByRole('button',{name:'대결 시작',exact:true}).click();assert.equal(await host.locator('.cipher-training[open]:not(.cipher-arena)').count(),1);
  await host.evaluate(()=>{const a=window.stockWarsApp;a.cipherLobby.competitionRoom.match.close();a.cipherLobby.competitionRoom.close();a.annaTutorial.isActive=false;return a.enterTown();});
  await guest.evaluate(()=>{const a=window.stockWarsApp;a.cipherLobby.competitionRoom.close();a.annaTutorial.isActive=false;return a.enterTown();});
  await host.waitForFunction(()=>window.stockWarsApp.townStage.remotePlayers.size===1);
  await guest.evaluate(()=>{window.stockWarsApp.townStage.playerController.charPosX+=120;});
  await host.waitForFunction(()=>[...window.stockWarsApp.townStage.remotePlayers.values()].some(p=>p.targetX-p.fromX>50));
  const smooth=await host.evaluate(()=>{const p=[...window.stockWarsApp.townStage.remotePlayers.values()][0];return p.x>=p.fromX&&p.x<p.targetX;});assert.equal(smooth,true);
  await guest.evaluate(()=>window.stockWarsApp.cipherLobby.open());
  await host.waitForFunction(()=>window.stockWarsApp.townStage.remotePlayers.size===0);
  await host.evaluate(()=>window.stockWarsApp.cipherLobby.open());
  await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.remotePlayers?.length===1);
  await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.remotePlayers?.length===1);
  await guest.evaluate(()=>{window.stockWarsApp.cipherLobby.player.x-=130;});await host.waitForFunction(()=>window.stockWarsApp.cipherLobby.remotePlayers?.[0]?.x<950);await host.screenshot({path:'scratch/online-cipher-players.png'});
  await host.evaluate(()=>{const a=window.stockWarsApp;a.cipherLobby.close();a.openVivianStore();});await guest.evaluate(()=>{const a=window.stockWarsApp;a.cipherLobby.close();a.openVivianStore();});
  await host.waitForFunction(()=>[...window.stockWarsApp.onlineSocialSync.remotes.values()].some(p=>p.location==='vivian'&&p.element));
  await guest.evaluate(()=>{window.stockWarsApp.vivianStoreModal.player.x-=120;});await host.waitForFunction(()=>[...window.stockWarsApp.onlineSocialSync.remotes.values()].some(p=>p.x<1000));await host.screenshot({path:'scratch/online-vivian-players.png'});
  await host.evaluate(()=>window.stockWarsApp.vivianStoreModal.close());await guest.evaluate(()=>{window.stockWarsApp.vivianStoreModal.close();document.body.classList.add('phone-minimized');});
  const dm=await host.evaluate(async id=>window.stockWarsChat.friends('chat',id),b.playerId);
  await host.evaluate(async roomId=>window.stockWarsChat.room('send',{roomId,text:'백그라운드 알림 확인'}),dm.roomId);
  await guest.waitForFunction(()=>document.getElementById('onlineMessageBadge')&&!document.getElementById('onlineMessageBadge').hidden);
  assert.match(await guest.locator('#onlineMessageBadge').textContent(),/1/);
  await guest.evaluate(()=>document.body.classList.add('phone-view-active'));
  await host.evaluate(async()=>{const c=window.stockWarsApp.cipherLobby.competitionRoom;const state=await c.arenaRequest({action:'create',room:{name:'팝업초대방',minutes:3,cash:10000,stake:0,passwordHash:null}});await c.arenaRequest({action:'invite',id:state.room.id,targetName:'친구테스터'});});
  await guest.waitForFunction(()=>!window.stockWarsApp.onlineSocialSync.checking);
  await guest.evaluate(()=>window.stockWarsApp.onlineSocialSync.checkInvites());assert.equal(await guest.getByRole('dialog',{name:'모의투자 초대',exact:true}).count(),0);
  await guest.evaluate(()=>{document.body.classList.remove('phone-view-active');window.stockWarsApp.annaTutorial.isActive=true;});
  await guest.evaluate(()=>window.stockWarsApp.onlineSocialSync.checkInvites());assert.equal(await guest.getByRole('dialog',{name:'모의투자 초대',exact:true}).count(),0);
  await guest.evaluate(()=>window.stockWarsApp.annaTutorial.isActive=false);
  await guest.waitForFunction(()=>document.querySelector('dialog[aria-label="모의투자 초대"][open]'));
  await guest.getByRole('dialog',{name:'모의투자 초대',exact:true}).getByRole('button',{name:'취소',exact:true}).click();
  await guest.waitForFunction(()=>!document.querySelector('dialog[aria-label="모의투자 초대"]'));
  assert.equal((await guest.evaluate(()=>window.stockWarsArena.request({action:'list'}))).invitations.length,0);
  await host.evaluate(async()=>{const rooms=await window.stockWarsArena.request({action:'list'});await window.stockWarsArena.request({action:'invite',id:rooms.ownRooms[0].id,targetName:'친구테스터'});});
  await guest.waitForFunction(()=>document.querySelector('dialog[aria-label="모의투자 초대"][open]'));
  await guest.getByRole('dialog',{name:'모의투자 초대',exact:true}).getByRole('button',{name:'확인',exact:true}).click();
  await guest.waitForFunction(()=>window.stockWarsApp.cipherLobby.competitionRoom.onlineState?.room.name==='팝업초대방');
  console.log('PASS: smooth remote movement, building transitions, shared public interiors, background message badge, direct invitation popup');
  console.log('PASS: two actual clients, friend status, invite, ready, server trading, shared prices, final results, AI mode');
 }finally{if(browser)await browser.close();await new Promise(resolve=>web.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});