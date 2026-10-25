const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 const output='output/first-day-full-play-v1';fs.mkdirSync(output,{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(6000);const errors=[],checkpoints=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text())});
 const click=async selector=>{const el=page.locator(selector).filter({visible:true}).first();if(await el.count()&&await el.isEnabled()){await el.click({timeout:3000});return true;}return false;};
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day'+(process.argv.includes('--replay')?'&skipOpening=1':''));await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna,null,{timeout:90000});
 await page.evaluate(()=>{const t=window.stockWarsExhibition.scenes.townModelScene;t.renderer.setPixelRatio(.45)});
 if(!process.argv.includes('--replay')){await page.getByRole('button',{name:'게임 시작',exact:true}).click();console.log('opening started, no skips');}else console.log('replay from arrival, cinematic already checked, no story-stage skips');await page.waitForFunction(()=>window.stockWarsExhibition.arrival.active,null,{timeout:300000});
 await page.evaluate(fs.readFileSync('scratch/full-play-navigation.js','utf8'));
 let commandModified=0;const commandFile='scratch/full-play-command.js';let last=-1,lastProgress=Date.now(),lastLog=0,navModified=fs.statSync('scratch/full-play-navigation.js').mtimeMs;
 for(let step=0;step<15000;step++){try{if(fs.existsSync(commandFile)&&fs.statSync(commandFile).mtimeMs>commandModified){commandModified=fs.statSync(commandFile).mtimeMs;console.log('QA_COMMAND',JSON.stringify(await page.evaluate(fs.readFileSync(commandFile,'utf8'))));}
  const modified=fs.statSync('scratch/full-play-navigation.js').mtimeMs;if(modified!==navModified){await page.evaluate(()=>window.fullPlay.stop());await page.evaluate(fs.readFileSync('scratch/full-play-navigation.js','utf8'));navModified=modified;console.log('navigation driver reloaded');}const s=await page.evaluate(()=>window.fullPlay.state());
  if(s.cursor!==last){last=s.cursor;lastProgress=Date.now();checkpoints.push({storyState:await page.evaluate(()=>structuredClone(window.stockWarsExhibition.state)),cursor:last,place:s.beat?.place,id:s.beat?.id,text:s.beat?.text,time:Date.now()});fs.writeFileSync(output+'/progress.json',JSON.stringify({checkpoints,errors},null,2));console.log('STEP',last,s.beat?.place,s.beat?.id||s.beat?.text?.slice(0,38));}
  if(Date.now()-lastLog>20000){console.log('LIVE',JSON.stringify({cursor:s.cursor,busy:s.busy,guide:s.guide,goal:s.goal,dist:s.dist,context:s.context,seated:s.seated}));lastLog=Date.now();}
  if(Date.now()-lastProgress>150000)throw Error('No story progress for 150s: '+JSON.stringify(s));
  if(await page.getByText('데모가 끝났습니다',{exact:true}).isVisible()){console.log('DEMO COMPLETE');break;}
  const stop=()=>page.evaluate(()=>window.fullPlay.stop());
  if(await page.locator('.first-day-animation[open],iframe[title="소망이의 첫날 밤 잠자기 애니메이션"]').count()){await stop();await page.waitForTimeout(500);continue;}
  if(await page.locator('.diary-book[open]').count()){await stop();if(!await click('.diary-book [data-write]:not(:disabled)'))await page.waitForTimeout(300);continue;}
  if(await page.locator('.packing-game[open]').count()){
   await stop();if(await page.evaluate(()=>window.stockWarsExhibition.activities.game.tutorial.isOpen)){await page.keyboard.press('f');await page.waitForTimeout(200);continue;}
   const game=await page.evaluate(async()=>{const g=window.stockWarsExhibition.activities.game,{PACKING_PATTERNS}=await import('/js/components/packing/PackingData.js?v=patterns-20-v1');return {completed:g.session.completed,total:g.session.orders.length,next:g.session.awaitingNext,rows:PACKING_PATTERNS[g.order.patternIndex],items:g.order.items.map(i=>({id:i.id,x:i.x,y:i.y}))};});
   if(game.completed===game.total){await click('.packing-result [data-action="close"]');continue;}
   if(game.next){await click('.packing-game [data-action="next"]');continue;}
   for(const item of game.items.filter(i=>i.x==null)){let x,y;for(let row=0;row<game.rows.length;row++){const col=game.rows[row].indexOf(item.id);if(col>=0){x=col;y=row;break;}}await page.locator('.packing-game [data-item="'+item.id+'"]').click();await page.locator('.packing-game [data-x="'+x+'"][data-y="'+y+'"]').click();}
   await click('.packing-game [data-action="finish"]');continue;
  }
  if(await page.locator('.leaf-inventory[open]').count()){
   await stop();if(await page.locator('#rumorSecretModal:not(.hidden)').count()){
    if(await page.locator('.rumor-quiz-choices:visible .rumor-quiz-choice:not(:disabled)').count())await page.locator('.rumor-quiz-choice').nth(1).click();
    else await page.locator('#btnRumorConfirm').click();
   }else{await page.locator('.li-item').filter({hasText:s.beat?.id==='planted'?'씨앗용 화분':'소식봉투'}).click();await page.locator('.li-use').click();}await page.waitForTimeout(250);continue;
  }
  if(await page.locator('.cozy-phone[open]').count()){
   await stop();if(s.beat?.id==='trade'){
    if(await page.locator('[data-execute="buy"]:visible').count())await click('[data-execute="buy"]');
    else if(await page.locator('[data-subtab="order"]:visible').count())await click('[data-subtab="order"]');
    else await click('.stock-recommendations [data-stock]');
   }else await page.keyboard.press('Escape');await page.waitForTimeout(350);continue;
  }
  if(await page.locator('.seed-pot-shop[open]').count()){await stop();await click('.seed-pot-shop #btnVivianBuy');continue;}
  if(await page.locator('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle:visible').count()){
   await stop();await click('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle');await page.waitForTimeout(300);continue;
  }
  if(s.receiving){await stop();if(s.guide.includes('받'))await page.keyboard.press('f');await page.waitForTimeout(250);continue;}
  if(await page.locator('.exhibition-panel .exam-options input:not(:disabled)').count()){
   await stop();const answer=await page.evaluate(async()=>{const {examQuestions}=await import('/js/app/exhibition/Quiz.js');const a=window.stockWarsExhibition;return examQuestions(a.state)[a.state.answers.length].answer});await page.locator('.exam-options input').nth(answer).check();await click('.exam-submit');continue;
  }
  if(await page.locator('#residence-name:visible:not([readonly])').count()){await stop();await page.locator('#residence-name').fill('소망이');await click('.residence-submit');continue;}
  if(await page.locator('.bank-application:visible').count()){await stop();for(const c of await page.locator('.bank-application input[type=checkbox]').all())await c.check();await click('.bank-application button[type=submit]');await page.waitForTimeout(300);continue;}
  if(!s.busy&&await page.locator('.exhibition-panel .dialogue-next-triangle:visible').count()){await stop();await click('.exhibition-panel .dialogue-next-triangle');await page.waitForTimeout(180);continue;}
  if(!s.busy&&!s.arrival){
   if(s.beat?.id==='rumor'||s.beat?.id==='planted'){await stop();await page.keyboard.press('i');continue;}
   if(s.beat?.id==='diaryWritten'){await stop();await page.keyboard.press('j');continue;}
   if(await page.locator('.exhibition-panel .exhibition-choices button:visible').count()){await stop();await click('.exhibition-panel .exhibition-choices button');continue;}
   if(await click('.certificate-receive')||await click('.exam-submit:not(:disabled)'))continue;
  }
  if(s.goal&&!s.scripted&&!s.townEntry){
   const threshold=s.arrival?15:s.seatNeeded?35:s.guide.includes('문')?25:s.context==='town'?25:35;
   if(s.dist<threshold||s.seated){await stop();await page.keyboard.press(s.seatNeeded&&!s.seated?'e':'f');await page.waitForTimeout(300);}
   else {await page.evaluate(()=>window.fullPlay.navigate());await page.waitForTimeout(170);}
  }else{await stop();await page.waitForTimeout(250);}
 }catch(error){if(String(error).includes('No story progress'))throw error;console.log('QA input retry:',String(error).slice(0,250));await page.waitForTimeout(500);}
 }
 assert(await page.getByText('데모가 끝났습니다',{exact:true}).isVisible());assert.deepEqual(errors,[]);await page.screenshot({path:output+'/demo-complete.png'});fs.writeFileSync(output+'/report.json',JSON.stringify({fromOpening:!process.argv.includes('--replay'),cinematicCheckedSeparately:true,usedStoryStageSkips:false,checkpoints,errors},null,2));
 }catch(e){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});fs.writeFileSync(output+'/failure.json',JSON.stringify({error:String(e),checkpoints,errors,state:await page.evaluate(()=>window.fullPlay?.state()).catch(()=>null),body:await page.locator('body').innerText().catch(()=>null)},null,2));throw e;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});




