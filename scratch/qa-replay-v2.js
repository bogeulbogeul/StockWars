env.inspect = () => page.evaluate(() => { const a=window.stockWarsExhibition,s=a.scenes;return {cursor:a.state.cursor,beat:a.plan[a.state.cursor],place:s.place,busy:a.busy,flags:a.state.flags,waiting:{info:s.informationAwaitingTalk,bank:s.bankAwaitingTalk,store:s.storeAwaitingTalk,plaza:s.plazaAwaitingTalk,computer:s.computerAwaitingUse,exit:!!s.stockExitAwaiting},text:a.view.panel.innerText}; });
env.snap = name => page.screenshot({path:out+'/'+name+'.png'});
await new (Object.getPrototypeOf(async()=>{}).constructor)('env','with(env){'+fs.readFileSync('scratch/qa-helpers.js','utf8')+'}')(env);
env.wait = ms => page.waitForTimeout(ms);
env.ready = () => page.waitForFunction(()=>!window.stockWarsExhibition.busy,{},{timeout:90000});
env.say = async (ms=1200) => {await ready();await line(ms);};
env.caption = async () => {await page.locator('.exhibition-panel:not([hidden]) .exhibition-text').click();await wait(600);};
env.enter = async id => {await door(id);await wait(800);await page.keyboard.press('f');await wait(900);};
env.storeExit = async()=>{let g=await page.evaluate(async()=>{let{VIVIAN_EXIT_Z}=await import('/js/data/vivianModelRoom.js');return{x:0,z:VIVIAN_EXIT_Z-40}});await walk(g,20);await page.keyboard.press('f');await wait(1000);};
env.moaTalk = async()=>{let g=await page.evaluate(()=>{let p=window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.position;return{x:p.x,z:p.z+110}});await walk(g,20);await wait(500);await page.keyboard.press('f');await ready();};
env.steps = [
['opening',async()=>{
 await snap('01-title');await wait(1200);await page.getByRole('button',{name:'시작하기',exact:true}).click();
 for(let n=1;n<=6;n++){
  await page.waitForFunction(n=>document.querySelector('.opening-sequence iframe')?.contentDocument?.URL.includes('scene-'+String(n).padStart(2,'0')+'-v1'),n);
  let f=page.frameLocator('.opening-sequence iframe');await f.locator('.caption').first().waitFor();
  let count=await f.locator('.caption').count();
  if(n===2){await wait(4200);await snap('02-eyes-closed');await wait(2000);await snap('03-eyes-open');}
  for(let i=0;i<count;i++){await wait(1300);await f.locator('.caption:visible').click();}
 }
 await page.locator('.bus-arrival__caption').waitFor();for(let i=0;i<3;i++){await wait(2000);await page.locator('.bus-arrival__caption').click();}await wait(1000);
}],
['wake-information',async()=>{
 await walk({x:1040,z:2355/.4383711467890774},20);
 for(let i=0;i<3;i++){await page.keyboard.press('f');await wait(700);let d=page.locator('.moa-wake-dialogue:not(.hidden) .vn-dialogue-text');if(await d.count())await d.click();await wait(300);}
 await ready();await say();await say();await wait(1000);await enter('settlement_information');await page.keyboard.press('e');await ready();await snap('04-counter');
}],
['residence-phone-map',async()=>{
 await say();await caption();await page.locator('#residence-name').fill('소망');await page.locator('.residence-submit').click();await wait(600);await page.locator('.residence-narration').click();await say();await say();await caption();
 await page.locator('.exhibition-phone').click();await page.locator('.cozy-phone[open]').waitFor();await wait(1300);await page.keyboard.press('Escape');await page.waitForFunction(()=>window.stockWarsExhibition.state.flags.openPhone);
 for(let i=0;i<6;i++)await say();await wait(1000);await page.keyboard.press('f');await ready();await snap('05-home-dialogue');
}],
['bank',async()=>{
 for(let i=0;i<4;i++)await say();await wait(1000);await page.keyboard.press('f');await wait(1000);
 // Moa leaves the player beside the bank approach, so move toward the door first.
 await page.keyboard.down('a');await wait(160);await page.keyboard.up('a');await page.keyboard.press('f');await wait(1000);await walk({x:0,z:150});await page.keyboard.press('f');await ready();await say();
 await page.locator('.residence-submit').click();await wait(500);await page.locator('.bank-application-status').click();await say();await say();await page.locator('.bank-loan-confirm input').check();await wait(900);await page.locator('.residence-submit').click();await wait(500);await page.locator('.bank-application-status').click();await say();await say();await say();
 await page.getByRole('button',{name:'주민 부탁 들어주기',exact:true}).click();await say();await say();await wait(600);
}],
['store',async()=>{
 await walk({x:2150,z:2460/.4383711467890774},30);await walk({x:2150,z:1640/.4383711467890774},30);await enter('vivian_store');
 let g=await page.evaluate(async()=>{let r=window.stockWarsExhibition.scenes.rooms.get('store');let{Vector3}=await import('/vendor/three/three.module.js');let p=r.shopkeeper.getWorldPosition(new Vector3());return{x:p.x,z:p.z+105}});await walk(g,22);await page.keyboard.press('f');await ready();await snap('06-store-dialogue');await say();await page.getByRole('button',{name:'해볼게요',exact:true}).click();await say();await wait(3000);
 let d=page.locator('.moa-wake-dialogue:not(.hidden) .vn-dialogue-text');await d.waitFor();await d.click();await wait(1800);
 let top=await page.evaluate(async()=>{let{packingWorktopBounds}=await import('/js/components/store3d/PackingWorkstation.js');let b=packingWorktopBounds(window.stockWarsExhibition.scenes.rooms.get('store'));return{x:(b.min.x+b.max.x)/2,z:b.max.z+65}});await walk(top,18);await page.keyboard.press('f');await page.locator('.packing-game[open]').waitFor();
 for(let i=0;i<3;i++){await wait(1000);await page.locator('.packing-tutorial-dialogue:not(.hidden) .vn-dialogue-text').click();}
 for(let n=0;n<3;n++){
  let sol=await page.evaluate(async()=>{let g=window.stockWarsExhibition.activities.game;let{PACKING_PATTERNS}=await import('/js/components/packing/PackingData.js');let rows=PACKING_PATTERNS[g.order.patternIndex];return g.order.items.map(it=>{let y=rows.findIndex(r=>r.includes(it.id));return{id:it.id,x:rows[y].indexOf(it.id),y}})});
  for(let p of sol){await page.locator('.packing-item-card[data-item="'+p.id+'"]').click();await page.locator('.packing-cell[data-x="'+p.x+'"][data-y="'+p.y+'"]').click();await wait(300);}
  await page.locator('.packing-game [data-action="finish"]').click();await wait(900);if(n<2)await page.locator('.packing-game [data-action="next"]').click();
 }await snap('07-packing-done');await page.locator('.packing-result [data-action="close"]').click();
 await say();await caption();await say();await say();await caption();await say();await wait(500);await storeExit();
}],
['rumor',async()=>{
 await walk({x:2370,z:1660/.4383711467890774},25);await walk({x:1450,z:1740/.4383711467890774},25);await moaTalk();await snap('08-plaza-dialogue');await say();await page.keyboard.press('i');await page.locator('.li-item[data-id="exhibition-first-rumor"]').click();await page.locator('.li-use').click();await wait(1600);await page.locator('#btnRumorConfirm').click();await page.locator('.rumor-quiz-choice').nth(1).click();await wait(1000);await page.locator('#btnRumorConfirm').click();await say();await say();
}],
['stock-exam',async()=>{
 await enter('cipher_securities');
 let g=await page.evaluate(async()=>{let r=window.stockWarsExhibition.scenes.rooms.get('stock');let{Box3}=await import('/vendor/three/three.module.js');let b=new Box3().setFromObject(r.room.getObjectByName('cipher-cozy-desk'));return{x:(b.min.x+b.max.x)/2,z:b.max.z+100}});await walk(g,20);await page.keyboard.press('f');await ready();await say();await say();
 for(let i=0;i<3;i++){let ans=await page.evaluate(async()=>{let{examQuestions}=await import('/js/app/exhibition/Quiz.js');let s=window.stockWarsExhibition.state;return examQuestions(s)[s.answers.length].answer});await page.locator('.exam-options input[value="'+ans+'"]').check();await wait(1100);await page.locator('.exam-submit').click();await wait(1100);await page.locator('.exam-submit').click();}await wait(1000);await page.locator('.certificate-receive').click();
}],
['stock-lesson',async()=>{
 await page.locator('.moa-wake-dialogue:not(.hidden) .vn-dialogue-text').click();await wait(4000);await walk({x:-285,z:-80},22);await page.keyboard.press('f');await wait(5000);await walk({x:320,z:-170},20);await page.keyboard.press('f');await ready();await snap('09-training-dialogue');await say();await say();await walk({x:0,z:195},22);await page.keyboard.press('e');await wait(800);await page.keyboard.press('f');await page.locator('[data-stock="CLOUDBERRY"]').first().waitFor();await page.locator('[data-stock="CLOUDBERRY"]').first().click();await wait(1000);
 for(let i=0;i<6;i++){await page.locator('[data-lesson-next]').click();await wait(1000);}await snap('10-order-fixed');
 let b=await page.locator('[data-execute="buy"]').boundingBox(),d=await page.locator('.stock-lesson-dock').boundingBox();if(b.y+b.height>d.y)throw Error('Buy below lesson dock');await page.locator('[data-execute="buy"]').click();await say();await wait(700);
 await walk({x:385,z:-100},20);await page.keyboard.press('f');await wait(1000);await walk({x:0,z:226},20);await page.keyboard.press('f');await wait(1000);
}],
['gifts',async()=>{
 await walk({x:1450,z:1700/.4383711467890774},25);await moaTalk();await say();await say();await say();await caption();await say();await say();await caption();await say();await caption();await say();await say();await say();
}],
['home-finale',async()=>{
 await enter('vivian_store');await say();await say();await page.locator('.seed-pot-shop #btnVivianBuy').click();await say();await wait(700);await storeExit();await say();await enter('home_office_tower');
 // F after entering may already advance the home greeting.
 let s=await inspect();if(s.beat.kind==='line')await say();await page.keyboard.press('i');await page.locator('.li-item[data-id="exhibition-seed-pot"]').click();await page.locator('.li-use').click();let c=page.frameLocator('.first-day-animation iframe').locator('#caption');await c.waitFor();for(let i=0;i<4;i++){await wait(1400);await c.click();}await say();await page.keyboard.press('j');await page.locator('.diary-book[open] [data-write]').click();await wait(1000);await page.locator('.diary-book[open] [data-left]').click();await snap('11-diary');await wait(1300);await page.locator('.diary-book[open] [data-left]').click();
 await page.getByRole('button',{name:'잠자기',exact:true}).click();await wait(1300);await caption();await wait(1300);await caption();let cap=page.frameLocator('.opening-sequence iframe').locator('.caption:visible');await cap.waitFor();await wait(1500);await cap.click();await wait(1500);await cap.click();await page.locator('.demo-complete').waitFor();await snap('12-ending');await wait(1300);
 env.finalState=await page.evaluate(()=>structuredClone(window.stockWarsExhibition.state));fs.writeFileSync(out+'/qa-results.json',JSON.stringify({errors,missing,state:env.finalState},null,2));await page.getByRole('button',{name:'타이틀 화면으로 가기',exact:true}).click();await page.getByRole('button',{name:'시작하기',exact:true}).waitFor();await wait(1000);await snap('13-title-return');
}]
];
env.stepIndex=0;
env.run = async()=>{for(;env.stepIndex<steps.length;env.stepIndex++){let[id,fn]=steps[env.stepIndex];let start=Date.now()-videoStart;console.log('PLAY '+id);await fn();actions.push({id,start,end:Date.now()-videoStart});fs.writeFileSync(out+'/actions.json',JSON.stringify(actions,null,2));console.log('PASS '+id);}return {complete:true,errors,missing};};
return steps.map(s=>s[0]);
