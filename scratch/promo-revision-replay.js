await new (Object.getPrototypeOf(async()=>{}).constructor)('env','with(env){'+fs.readFileSync('scratch/promo-replay.js','utf8')+'}')(env);
env.marks=[];
env.mark = name => { marks.push({name,time:(Date.now()-videoStart)/1000});fs.writeFileSync(out+'/marks.json',JSON.stringify(marks,null,2)); };
env.caption = async()=>{
 const id=(await inspect()).beat.id;
 await page.waitForFunction(()=>{let s=window.stockWarsExhibition.scenes;return s.receivingApplication||s.receivingItem});
 await page.locator('.exhibition-panel:not([hidden]) .exhibition-text').waitFor();
 mark(id+'-handoff-start');await wait(2600);
 mark(id+'-accept');await page.locator('.exhibition-panel:not([hidden]) .exhibition-text').click();
 await page.waitForFunction(()=>{let s=window.stockWarsExhibition.scenes;return !s.receivingApplication&&!s.receivingItem});
 await wait(1400);mark(id+'-handoff-end');await snap(id+'-handoff-completed');
};
steps[0][1]=async()=>{
 mark('title');await wait(8000);mark('title-end');await page.getByRole('button',{name:'시작하기',exact:true}).click();
 for(let n=1;n<=6;n++){
  await page.waitForFunction(n=>document.querySelector('.opening-sequence iframe')?.contentDocument?.URL.includes('scene-'+String(n).padStart(2,'0')+'-v1'),n);
  let f=page.frameLocator('.opening-sequence iframe');await f.locator('.caption').first().waitFor();let count=await f.locator('.caption').count();
  if(n<=2){mark('opening-'+n);await wait(n===1?6500:8200);await snap('opening-'+n);mark('opening-'+n+'-end');}
  for(let i=0;i<count;i++){await wait(300);await f.locator('.caption:visible').click();}
 }
 await page.locator('.bus-arrival__caption').filter({hasText:'포포리 마을이'}).waitFor();mark('village');await wait(4200);await page.locator('.bus-arrival__caption').click();await wait(3200);await page.locator('.bus-arrival__caption').click();await wait(2200);mark('village-end');await page.locator('.bus-arrival__caption').click();await wait(900);
};
steps[1][1]=async()=>{
 await walk({x:1040,z:2355/.4383711467890774},20);
 for(let i=0;i<3;i++){await page.keyboard.press('f');await wait(700);let d=page.locator('.moa-wake-dialogue:not(.hidden) .vn-dialogue-text');if(await d.count())await d.click();await wait(300);}
 await ready();mark('anna-dialogue');await say(3000);await say(3000);mark('anna-dialogue-end');await wait(1000);await enter('settlement_information');await page.keyboard.press('e');await ready();
};
steps[2][1]=async()=>{
 await say();await caption();await page.locator('#residence-name').waitFor();mark('application');await wait(1800);
 await page.locator('#residence-name').pressSequentially('소망',{delay:350});await wait(1800);await snap('application-name');await page.locator('.residence-submit').click();await wait(1600);await page.locator('.residence-narration').click();await wait(1200);mark('application-end');
 await say();await say();await caption();await page.locator('.exhibition-phone').click();await page.locator('.cozy-phone[open]').waitFor();await wait(800);await page.keyboard.press('Escape');await page.waitForFunction(()=>window.stockWarsExhibition.state.flags.openPhone);
 for(let i=0;i<6;i++)await say();await wait(1000);await page.keyboard.press('f');await ready();
};
let store=steps[4][1].toString();
store=store.replace("for(let n=0;n<3;n++){", "for(let n=0;n<3;n++){if(n===0){mark('one-box');await wait(2000);}");
store=store.replace('await wait(300);}', 'await wait(n===0?1100:100);}');
store=store.replace("await wait(900);if(n<2)", "await wait(n===0?2400:400);if(n===0){mark('one-box-end');await snap('one-box-completed');}if(n<2)");
steps[4][1]=new (Object.getPrototypeOf(async()=>{}).constructor)('env','with(env){return ('+store+')();}').bind(null,env);
steps[7][1]=async()=>{
 await page.locator('.moa-wake-dialogue:not(.hidden) .vn-dialogue-text').click();await wait(4000);await walk({x:-285,z:-80},22);await page.keyboard.press('f');await wait(5000);await walk({x:320,z:-170},20);await page.keyboard.press('f');await ready();await say();await say();await walk({x:0,z:195},22);await page.keyboard.press('e');await wait(1000);
 mark('broker-room');await wait(4500);await snap('broker-room');mark('broker-room-end');
 await page.keyboard.press('f');await page.locator('[data-stock="CLOUDBERRY"]').first().waitFor();await page.locator('[data-stock="CLOUDBERRY"]').first().click();
 mark('broker-company');await wait(4000);await page.locator('[data-lesson-next]').click();await wait(1600);await page.locator('[data-lesson-next]').click();mark('broker-company-end');
 await page.locator('[data-expand]').click();mark('broker-chart');await wait(2000);let b=await page.locator('svg.stock-chart').boundingBox();await page.mouse.move(b.x+b.width*.35,b.y+b.height*.5,{steps:25});await wait(2500);await page.mouse.move(b.x+b.width*.65,b.y+b.height*.45,{steps:30});await wait(2500);await snap('broker-chart-office-background');await page.mouse.move(20,1050);mark('broker-chart-end');
 await page.locator('[data-lesson-next]').click();await wait(1200);await page.locator('[data-lesson-next]').click();await page.locator('[data-lesson-next]').click();await wait(1200);await page.locator('[data-lesson-next]').click();
 mark('broker-order');await wait(4500);await snap('broker-order');await page.locator('[data-execute="buy"]').click();await wait(1800);mark('broker-order-end');
 fs.writeFileSync(out+'/capture-checks.json',JSON.stringify({errors,missing,state:await page.evaluate(()=>structuredClone(window.stockWarsExhibition.state)),chartBackground:'actual securities training room',handoffs:'offer reaches endpoint before acceptance; cut continues through completion'},null,2));
};
env.steps=steps.slice(0,8);env.stepIndex=0;
return steps.map(s=>s[0]);
