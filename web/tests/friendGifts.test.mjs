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
    await gifts.receive([gift]);
    assert.equal(state.inventory.length,1);
    assert.equal(gifts.pending.length,1);
    assert.equal((await gifts.claim(gift.id)).success,true);
    await gifts.receive([gift]);
    assert.equal(state.inventory.find(i=>i.id==='gift_gift-received').quantity,1);
    assert.equal(state.receivedGiftIds.length,1);
});
test('full inventory leaves gifts pending for later collection',async()=>{
    let acks=0;const {gifts,state}=fixture(async()=>{acks++;return {success:true};});
    state.inventory=Array.from({length:24},(_,i)=>({id:`slot${i}`,quantity:1}));
    await gifts.receive([{id:'gift-full',fromName:'친구',item:{id:'new',name:'음료',quantity:1}}]);
    assert.equal((await gifts.claim('gift-full')).success,false);
    assert.equal(acks,0);assert.equal(state.receivedGiftIds.length,0);assert.equal(gifts.pending.length,1);
});

test('failed save rolls back claim and acknowledgement retry cannot duplicate a saved gift',async()=>{
    let acks=0;
    const {gifts,state,app}=fixture(async()=>{acks++;throw new Error('offline');});
    const gift={id:'save-test',fromName:'친구',item:{id:'drink',name:'음료',quantity:1}};
    await gifts.receive([gift]);
    app.itemGameplay.save=()=>false;
    assert.equal((await gifts.claim(gift.id)).success,false);
    assert.equal(state.inventory.length,1);assert.equal(state.receivedGiftIds.length,0);assert.equal(acks,0);
    app.itemGameplay.save=()=>true;
    assert.equal((await gifts.claim(gift.id)).success,true);
    await gifts.receive([gift]);await gifts.receive([gift]);
    assert.equal(state.inventory.find(i=>i.id==='drink').quantity,1);
    assert.equal(gifts.pending.length,0);assert.equal(acks,3);
});

test('double claim credits once and full stacks remain in inbox',async()=>{
    const {gifts,state}=fixture(async()=>({success:true}));
    const gift={id:'double',fromName:'친구',item:{id:'drink',name:'음료',quantity:1}};
    await gifts.receive([gift]);
    const result=await Promise.all([gifts.claim(gift.id),gifts.claim(gift.id)]);
    assert.equal(result.filter(r=>r.success).length,1);
    assert.equal(state.inventory.find(i=>i.id==='drink').quantity,1);
    state.inventory.find(i=>i.id==='drink').quantity=99;
    await gifts.receive([{...gift,id:'stack-full'}]);
    assert.equal((await gifts.claim('stack-full')).success,false);assert.equal(gifts.pending.length,1);
    state.inventory.find(i=>i.id==='drink').quantity=98;
    assert.equal((await gifts.claim('stack-full')).success,true);
    assert.equal(state.inventory.find(i=>i.id==='drink').quantity,99);
});
