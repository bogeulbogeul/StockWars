import { TOWN_MODEL_BUILDINGS } from '../../../data/townModelBuildings.js';
import { TOWN_WORLD_WIDTH, TOWN_WORLD_HEIGHT } from '../../../data/townLayout.js';
export const MAP_META={
 home_office_tower:['우리 집','생활','#d6c797','집','씨앗을 심고 하루를 마무리하는 나의 공간이에요.','마을 북서쪽'],
 settlement_information:['안내소','생활','#adc196','잎','입주 신청과 정착 안내를 도와주는 모아의 안내소예요.','마을 입구 쪽 · 게시판 옆'],
 vivian_store:['잡화점','상점','#dca896','꽃','생활에 필요한 물건을 사고 포장 알바를 할 수 있어요.','마을 동쪽 · 광장 오른편'],
 julian_furniture:['가구점','상점','#c8b296','의','우디 가구점의 위치를 확인해 보세요.','마을 남서쪽'],
 cipher_securities:['증권사','금융','#a6c1d4','주','토리와 주식에 관해 이야기하는 증권사예요.','마을 북쪽 · 광장 위'],
 node_finance:['은행','금융','#d9c58d','잎','차곡이가 생활 계좌와 정착 자금을 안내해줘요.','마을 남동쪽'],
 midnight_pub:['쉼터','생활','#c0b2cd','쉼','도란 쉼터의 위치를 확인해 보세요.','마을 북동쪽'],
 data_ink_bookstore:['서점','상점','#bfcbad','책','소담 서점의 위치를 확인해 보세요.','마을 동남쪽 · 잡화점 아래'],
 post_office:['우체국','생활','#d7ad9f','우','우체국 외관의 위치를 안내해요.','마을 서쪽 · 집과 가구점 사이']
};
export const MAP_PLACES=TOWN_MODEL_BUILDINGS.map(b=>({...b,meta:MAP_META[b.id]}));
export const project=(x,y)=>({x:12+x/TOWN_WORLD_WIDTH*296,y:12+y/TOWN_WORLD_HEIGHT*308});
const ROOM_IDS={home:'home_office_tower',information:'settlement_information',bank:'node_finance',store:'vivian_store',stock:'cipher_securities'};
const NORMAL_ROOMS={homeModelScene:'home',informationModelScene:'information',bankModelScene:'bank',vivianModelScene:'store',cipherLobbyScene:'stock'};
export function mapPlayerPosition(controller,buildingId=null){
 const building=MAP_PLACES.find(b=>b.id===buildingId);
 if(building)return{x:building.x,y:building.y,indoor:true,label:`${building.name} 실내`};
 const x=controller?.charPosX,y=controller?.charPosY;
 return Number.isFinite(x)&&Number.isFinite(y)?{x,y,indoor:false,label:'마을 야외'}:null;
}
export function normalMapPosition(app){
 for(const [key,place] of Object.entries(NORMAL_ROOMS))if(app[key]?.active)return mapPlayerPosition(null,ROOM_IDS[place]);
 return mapPlayerPosition(app.townStage?.playerController);
}
export function exhibitionMapPosition(scenes){
 for(const [place,room] of scenes?.rooms||[])if(room.active&&ROOM_IDS[place])return mapPlayerPosition(null,ROOM_IDS[place]);
 return mapPlayerPosition(scenes?.townStage?.playerController);
}
export const escapeMap=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
