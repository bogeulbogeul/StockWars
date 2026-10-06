import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PresenceRegistry } from './registry.mjs';

const drink = { id: 'item_test_drink', name: '음료', quantity: 1, category: 'consumable' };
const rumor = { id: 'rumor_test', name: '현장 찌라시', quantity: 1, category: 'intel', description: '중요한 정보', effects: ['기업 수급'] };
function setup(options = {}) {
    const r = new PresenceRegistry(options);
    const a = r.session(), b = r.session(), c = r.session();
    for (const [s,n] of [[a,'보내는친구'],[b,'받는친구'],[c,'다른친구']]) r.update(s.token,'nickname',undefined,{nickname:n});
    for (const s of [b,c]) { r.friends(a.token,{operation:'request',targetId:s.playerId}); r.friends(s.token,{operation:'accept',targetId:a.playerId}); }
    return { r,a,b,c };
}
test('three gifts total across friends, including rumors, reset only at KST midnight', () => {
    let time = Date.parse('2026-10-06T14:59:59Z');
    const {r,a,b,c}=setup({now:()=>time});
    const send=(id,name,item)=>r.friends(a.token,{operation:'gift',giftId:id,targetName:name,item});
    send('gift-0001','받는친구',drink);
    send('gift-0002','다른친구',rumor);
    send('gift-0003','받는친구',rumor);
    assert.equal(r.friends(a.token).giftsRemaining,0);
    assert.throws(()=>send('gift-0004','받는친구',drink),/한도 3개/);
    assert.equal(send('gift-0001','받는친구',drink).success,true);
    assert.equal(r.friends(b.token).gifts.length,2);
    assert.equal(r.friends(c.token).gifts[0].item.description,rumor.description);
    time+=2000;
    assert.equal(r.friends(a.token).giftsRemaining,3);
    send('gift-0004','받는친구',drink);
    assert.equal(r.friends(a.token).giftsRemaining,2);
    r.friends(c.token,{operation:'giftAck',ids:['gift-0001']});
    assert.equal(r.friends(b.token).gifts.length,3);
    r.friends(b.token,{operation:'giftAck',ids:['gift-0001']});
    assert.equal(r.friends(b.token).gifts.length,2);
});
test('offline gifts, daily counts and acknowledgement survive restart', () => {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stockwars-gifts-'));
    try {
        const nameFile=path.join(dir,'names.json');
        const {r,a,b}=setup({nameFile});
        r.update(b.token,'disconnect');
        r.sessions.delete(b.token);
        r.friends(a.token,{operation:'gift',giftId:'gift-persist',targetName:'받는친구',item:rumor});
        const restored=new PresenceRegistry({nameFile});
        restored.session(a.token); restored.session(b.token);
        assert.equal(restored.friends(a.token).giftsRemaining,2);
        assert.equal(restored.friends(b.token).gifts[0].item.name,rumor.name);
        restored.friends(b.token,{operation:'giftAck',ids:['gift-persist']});
        const again=new PresenceRegistry({nameFile}); again.session(b.token);
        assert.equal(again.friends(b.token).gifts.length,0);
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
});