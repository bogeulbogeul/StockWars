(async()=>{
 const {Vector3,Box3}=await import('/vendor/three/three.module.js');
 const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
 const {TOWN_MODEL_PROPS}=await import('/js/data/townModelProps.js');
 const {tourRoute,clearTourSegment}=await import('/js/app/exhibition/TourRoute.js');
 const {createTourPaths}=await import('/js/app/exhibition/TourPaths.js');
 const {roomWalkingRoute}=await import('/js/app/OnFootNavigation.js');
 const P=.4383711467890774;let held=[],route=[],lastGoal,lastContext;
 const a=()=>window.stockWarsExhibition;
 const visible=e=>!!e&&e.getClientRects().length>0;
 const keys=next=>{for(const k of held)if(!next.includes(k))window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));for(const k of next)if(!held.includes(k))window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));held=next;};
 function state(){
  const app=a(),s=app.scenes,b=app.plan[app.state.cursor],r=s.stockExitAwaiting||s.rooms.get(s.place),townVisible=!s.townStage.containerEl.classList.contains('hidden');
  const guide=[...document.querySelectorAll('.game-guidance,.moa-movement-guide')].filter(visible).map(e=>e.innerText).join(' ');
  const world=s.townModelScene,moa=world.sleepingAnna;
  let goal=null,mode='tour',controller=townVisible?s.townStage.playerController:r?.controller,context=townVisible?'town':s.place;
  const nearActor=root=>{const p=root.getWorldPosition(new Vector3()),c=controller;const dx=c.charPosX-p.x,dz=c.charPosY/P-p.z,d=Math.hypot(dx,dz)||1;for(const radius of [100,120,140]){const q={x:p.x+dx/d*radius,y:(p.z+dz/d*radius)*P};if(c.canStand(q.x,q.y))return q;}return{x:p.x+100,y:p.z*P};};
  if(townVisible){
   if(app.arrival.active)goal={x:1040-45,y:2289.63+35};
   else if(moa?.root.userData.tourWalking&&s.tourActive&&!app.state.flags.phoneReady)goal=nearActor(moa.root);
   else if(s.plazaAwaitingTalk)goal=nearActor(moa.root);
   else if(s.tourActive||s.cancelReviewTravel||b?.id==='notice'){
    const id=({information:'settlement_information',informationOutside:'settlement_information',home:'home_office_tower',homeOutside:'home_office_tower',bank:'node_finance',bankOutside:'node_finance',store:'vivian_store',storeOutside:'vivian_store',stock:'cipher_securities',stockOutside:'cipher_securities',notice:'vivian_store'})[b.place];
    const def=TOWN_MODEL_BUILDINGS.find(d=>d.id===id);
    if(b.place==='notice'&&app.busy){const board=TOWN_MODEL_PROPS.find(d=>d.id==='plaza_notice_board');goal={x:board.x,y:board.y+90};}else if(def)goal={x:def.x+(def.entranceOffsetX||0),y:def.y+100};
    else if(b.place==='bench')goal=nearActor(moa.root);
   }
  }else if(r&&controller&&!controller.scriptedWalking){
   if(s.informationAwaitingTalk){const seat=r.seatInteraction.seats.find(seat=>seat.meshes.some(m=>m.name==='Round_Sage_Cushion'));goal=r.seatInteraction.exits(seat)[0];mode='room';}
   else if(s.bankAwaitingTalk)goal={x:0,y:100*P};
   else if(s.storeAwaitingTalk)goal=nearActor(r.shopkeeper);
   else if(s.packingAwaitingWorktop&&guide.includes('작업대에서')){const box=new Box3().setFromObject(r.room.getObjectByName('Packing_Worktop'));goal={x:(box.min.x+box.max.x)/2,y:(box.max.z+65)*P};}
   else if(s.stockAwaitingTalk){const box=new Box3().setFromObject(r.room.getObjectByName('cipher-cozy-desk'));goal={x:(box.min.x+box.max.x)/2,y:(box.max.z+90)*P};}
   else if(s.computerAwaitingUse){const chairs=r.room.userData.trainingSeats||[];const seat=r.seatInteraction.seats.find(seat=>seat.meshes.some(m=>{for(let n=m;n;n=n.parent)if(chairs.some(c=>c.model===n))return true;return false;}));if(seat)goal=r.seatInteraction.exits(seat)[0];}
   else if(s.stockExitAwaiting===r){const passage=guide.includes('로비');goal={x:passage?r.layout.width/2-65:0,y:(passage?-100:(r.layout?.exitZ??262.5)-40)*P};}
   else if(s.tourActive&&s.place==='stock'&&!s.stockExitAwaiting){const root=r.room.getObjectByName('tori-character');if(root)goal=nearActor(root);}
  }
  const c=controller,dist=goal&&c?Math.hypot(goal.x-c.charPosX,(goal.y-c.charPosY)/P):null;
  return{cursor:app.state.cursor,beat:b,busy:app.busy,guide,goal,dist,mode,context,arrival:app.arrival.active,seated:!!c?.busSeated,scripted:!!c?.scriptedWalking,townEntry:world.entryActive,receiving:s.receivingItem||s.receivingApplication,seatNeeded:s.informationAwaitingTalk||s.computerAwaitingUse,room:r,controller:c};
 }
 async function navigate(){const st=state(),g=st.goal,c=st.controller;if(!g||st.scripted||st.townEntry){keys([]);return;}
  if(st.dist<25){keys([]);return;}
  const context=st.context;
  if(!lastGoal||lastContext!==context||Math.hypot(g.x-lastGoal.x,(g.y-lastGoal.y)/P)>60||!route.length){
   try{if(context==='town'){const legal=c.sceneryCanStand;const start={x:c.charPosX,y:c.charPosY};if(clearTourSegment(start,g,legal))route=[start,g];else route=createTourPaths().route(start,g,legal);}else route=roomWalkingRoute(st.room,{x:g.x,z:g.y/P});}catch(e){route=[{x:c.charPosX,y:c.charPosY},g];}
   lastGoal={...g};lastContext=context;
  }
  while(route.length>1&&Math.hypot(route[0].x-c.charPosX,(route[0].y-c.charPosY)/P)<25)route.shift();
  const p=route[0]||g,dx=p.x-c.charPosX,dz=(p.y-c.charPosY)/P;let x=dx,z=dz;
  if(st.mode==='room'&&st.room.roomCamera?.movement){const bx=st.room.roomCamera.movement(1,0),bz=st.room.roomCamera.movement(0,1);x=dx*bx.dx+dz*bx.dz;z=dx*bz.dx+dz*bz.dz;}
  const m=Math.max(Math.abs(x),Math.abs(z)),next=[];if(Math.abs(x)>m*.35)next.push(x>0?'d':'a');if(Math.abs(z)>m*.35)next.push(z>0?'s':'w');keys(next);
 }
 window.fullPlay={state:async()=>{const exitRoom=window.stockWarsExhibition.scenes.stockExitAwaiting;if(exitRoom?.controller.busSeated){window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',code:'KeyE',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'e',code:'KeyE',bubbles:true}));}const game=window.stockWarsExhibition.activities.game;if(game?.isOpen&&game.session.completed===game.session.orders.length){const done=document.querySelector('.packing-result [data-action=close]');if(done&&!done.disabled)done.click();}if(document.querySelector('.cozy-phone[open] .stock-body[data-screen=detail]')){for(let n=0;n<70;n++){const buy=document.querySelector('.cozy-phone[open] [data-execute=buy]');if(buy&&!buy.disabled)break;const next=document.querySelector('.cozy-phone[open] [data-lesson-next]');if(!next||next.disabled)break;next.click();await new Promise(r=>setTimeout(r,90));}}const st=state();delete st.room;delete st.controller;return st;},navigate,stop:()=>keys([])};
})();







