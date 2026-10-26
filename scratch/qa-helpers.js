env.position = async () => page.evaluate(() => {
 const a=window.stockWarsExhibition,s=a.scenes,r=[...s.rooms.values(),s.stockLesson?.lobby,s.stockLesson?.training].find(r=>r?.active),c=r?r.controller:s.townStage.playerController;
 return {x:c.charPosX,y:c.charPosY,indoor:!!r,seated:!!c.busSeated,projected:!r||(!s.informationAwaitingTalk&&(a.busy||s.tourActive)),speed:r?(!s.informationAwaitingTalk&&(a.busy||s.tourActive)?210:180):(a.arrival.active||a.busy||s.tourActive?210:350)};
});
env.walk = async (goal,tol=18) => {
 if((await position()).seated){await page.keyboard.press('e');await page.waitForTimeout(120);}
 let route=await page.evaluate(async goal=>{const a=window.stockWarsExhibition,s=a.scenes,r=[...s.rooms.values(),s.stockLesson?.lobby,s.stockLesson?.training].find(r=>r?.active),c=r?r.controller:s.townStage.playerController;const{GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');const{tourRoute,resolveTourStop}=await import('/js/app/exhibition/TourRoute.js');const{outsideMoaApproach}=await import('/js/data/moaWake.js');let legal=(x,y)=>r?r.canStand(x,y/P):(!a.arrival.active||!outsideMoaApproach(x,y))&&c.canStand(x,y);let shift=r?1000:0;let finish=resolveTourStop({x:goal.x+shift,y:goal.z*P+shift},(x,y)=>legal(x-shift,y-shift));return tourRoute({x:c.charPosX+shift,y:c.charPosY+shift},finish,(x,y)=>legal(x-shift,y-shift),{step:12}).map(p=>({x:p.x-shift,z:(p.y-shift)/P}));},goal);
 const P=.4383711467890774;let stuck=0;
 for(const waypoint of route.slice(1)) for(let i=0;i<160;i++){
  const p=await position(),dx=waypoint.x-p.x,dz=waypoint.z-p.y/P;
  if(Math.hypot(dx,dz)<tol)break;
  const dy=p.projected?dz*P:dz;const horizontal=Math.abs(dx)>Math.abs(dy);
  const key=horizontal?(dx>0?'d':'a'):(dy>0?'s':'w');
  const ms=Math.max(24,Math.min(135,Math.abs(horizontal?dx:dy)*1000/p.speed*.8));
  await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);
  const q=await position();if(Math.hypot(q.x-p.x,(q.y-p.y)/P)<.5){const alt=horizontal?(dy>0?'s':'w'):(dx>0?'d':'a'); await page.keyboard.down(alt);await page.waitForTimeout(75);await page.keyboard.up(alt);if(++stuck>12)throw Error('Movement stalled toward '+JSON.stringify(waypoint)+' at '+JSON.stringify(q));}else stuck=0;
 }
 return await position();
};
env.line = async (delay=900) => {await page.waitForTimeout(delay);await page.locator('.exhibition-panel:not([hidden]) .dialogue-next-triangle').click();await page.waitForTimeout(180);};
env.door = async id => {const goal=await page.evaluate(async id=>{const{TOWN_MODEL_BUILDINGS:B,GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');const b=B.find(b=>b.id===id);return{x:b.x+(b.entranceOffsetX||0),z:(b.y+105)/P};},id);await walk(goal,22);await page.keyboard.press('f');await page.waitForTimeout(800);return await inspect();};
return 'helpers loaded';


