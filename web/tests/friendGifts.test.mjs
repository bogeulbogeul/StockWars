import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/components/FriendGifts.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export class FriendGifts','globalThis.FriendGifts = class FriendGifts');
function fixture(bridge) {
    const ctx=vm.createContext({window:{stockWarsChat:{friends:bridge}},crypto:{randomUUID:()=> 'gift-client-001'},structuredClone,toastManager:{show(){}}});
    vm.runInContext(source,ctx);
    const state={inventory:[{id:'rumor',name:'찌라시',category:'intel',quantity:2}]};
    const app={itemEngine:{state,consume(id){const i=state.inventory.find(i=>i.id===id);if(!i||i.quantity<1)return false;if(!--i.quantity)state.inventory.splice(state.inventory.indexOf(i),1);return true;}},itemGameplay:{save:()=>true,sync(){}}};
    return {app,gifts:new ctx.FriendGifts(app),state};
}
test('uncertain send retries the same request without debiting a second item',async()=>{
    let calls=0;
    const {gifts,state}=fixture(async()=> ++calls===1?{error:'네트워크',retryable:true}:{success:true,giftsRemaining:2});
    assert.equal((await gifts.send({name:'친구'},'rumor')).success,false);
    assert.equal(state.inventory[0].quantity,1);
    assert.equal((await gifts.retry()).success,true);
    assert.equal(state.inventory[0].quantity,1);
    assert.equal(state.pendingGift,undefined);
});
test('rejected gift refunds item and duplicate deliveries credit only once',async()=>{
    const {gifts,state}=fixture(async op=>op==='gift'?{error:'하루 한도',retryable:false}:{success:true});
    await gifts.send({name:'친구'},'rumor');
    assert.equal(state.inventory[0].quantity,2);
    const gift={id:'gift-received',fromName:'친구',item:{id:'rumor',name:'새 찌라시',category:'intel',quantity:1}};
    await gifts.receive([gift]); await gifts.receive([gift]);
    assert.equal(state.inventory.find(i=>i.id==='gift_gift-received').quantity,1);
    assert.equal(state.receivedGiftIds.length,1);
});
test('full inventory leaves gifts pending for later collection',async()=>{
    let acks=0;const {gifts,state}=fixture(async()=>{acks++;return {success:true};});
    state.inventory=Array.from({length:24},(_,i)=>({id:`slot${i}`,quantity:1}));
    await gifts.receive([{id:'gift-full',fromName:'친구',item:{id:'new',name:'음료',quantity:1}}]);
    assert.equal(acks,0);assert.equal(state.receivedGiftIds.length,0);
});