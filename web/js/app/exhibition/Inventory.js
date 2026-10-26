import { InventoryUI } from '../../components/inventory/InventoryUI.js';
import { installBagLauncher, showRumorReceipt } from '../InventoryAccess.js';
import { RumorPopup } from '../../components/inventory/RumorPopup.js';
import { showStoryRumorQuiz } from './StoryRumorQuiz.js';
const STORY_RUMOR={id:'exhibition-first-rumor',artworkId:'item_premium_rumor',name:'손님이 맡긴 소식봉투',category:'intel',quantity:1,actionLabel:'찌라시 열기',
 desc:'봉봉에게 받은 소식봉투예요. 열어서 어떤 소식이 담겨 있는지 확인해 보세요.',
 letterText:'코지페이가 다음 달 새로운 결제 서비스를 선보인대. 거래가 늘 거라는 이야기가 있지만, 아직 회사의 공식 발표는 없대.'};
export function installExhibitionInventory(app) {
 let finishRead, finishPot;
 const view=new InventoryUI(document.body,{onAction:item=>{
  if(item.id==='exhibition-seed-pot') {
   if(app.scenes.place!=='home'||app.plan[app.state.cursor]?.id!=='planted'||app.state.flags.planted)return;
   const done=finishPot;finishPot=null;view.close();done?.(true);return;
  }
  if(item.id!==STORY_RUMOR.id)return;
  popup.openStory(item,()=>showStoryRumorQuiz(popup,app));app.inventory.onRumorOpened?.();
 },onClose:()=>popup.close()});
 const popup=new RumorPopup(view.dialog,{onRumorClosed:()=>{
  if(!app.state.flags.storyRumorQuizPassed){app.inventory.onRumorClosedEarly?.();return;}
  const done=finishRead;finishRead=null;if(done){view.close();done(true);}
 }});
 const canOpen=()=>!!app.started&&!app.busy&&!app.arrival?.active&&!app.state.flags.asleep&&!app.scenes.receivingItem&&!app.scenes.receivingApplication&&!app.activities.game?.isOpen&&!document.body.classList.contains('title-screen-active');
 function sync(){
  app.state.inventory??=[];
  if(app.state.flags.pot&&!app.state.inventory.some(i=>i.id==='exhibition-seed-pot'))app.state.inventory.push({id:'exhibition-seed-pot',name:'씨앗용 화분',icon:'<img class="item-artwork" src="assets/items/story/flowerpot.png" alt="">',category:'furniture',quantity:1,usable:false,desc:'봉봉 잡화점에서 산 화분이에요. 집에서 가져온 씨앗을 심어 보세요.'});
  const pot=app.state.inventory.find(i=>i.id==='exhibition-seed-pot');if(pot){pot.usable=app.scenes.place==='home'&&app.plan[app.state.cursor]?.id==='planted'&&!app.state.flags.planted;pot.actionLabel='사용하기';pot.desc=app.state.flags.planted?'가져온 씨앗을 심은 화분이에요.':'집에서 사용하면 가져온 씨앗을 심을 수 있어요.';}
  if(app.state.flags.diary&&!app.state.inventory.some(i=>i.id==='exhibition-diary'))app.state.inventory.push({id:'exhibition-diary',name:'다이어리',category:'book',quantity:1,usable:false,desc:'모아에게 받은 빈 다이어리예요. 포포리에서의 하루와 씨앗 이야기를 적어갈 거예요.'});
  if(app.state.flags.envelope&&!app.state.inventory.some(i=>i.id===STORY_RUMOR.id))app.state.inventory.push({...STORY_RUMOR});
  const rumor=app.state.inventory.find(i=>i.id===STORY_RUMOR.id);if(rumor)Object.assign(rumor,STORY_RUMOR);
  view.setItems(app.state.inventory);
 }
 installBagLauncher({open:()=>{if(view.dialog.open)view.close();else{sync();view.open();}},isOpen:()=>view.dialog.open,canOpen});
 app.inventory={view,sync,popup,receive(){sync();showRumorReceipt();},
  waitForRumorRead(){return new Promise(resolve=>{finishRead=resolve;});},
  waitForPotUse(){return new Promise(resolve=>{finishPot=resolve;});},
  cancelPotUse(){const done=finishPot;finishPot=null;done?.(false);},
  cancelRumorRead(){const done=finishRead;finishRead=null;done?.(false);}};
 sync();return app.inventory;
}

