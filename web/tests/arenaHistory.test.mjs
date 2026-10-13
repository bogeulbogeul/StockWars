import test from 'node:test';
import assert from 'node:assert/strict';
import {saveAiArenaHistory} from '../js/components/arenaHistory.js';
function storage(initial='[]'){let value=initial;return {getItem:()=>value,setItem:(_,next)=>value=next};}
const room={id:'match',name:'AI 대결',cash:10000,stake:500};
test('quitting AI records actual assets but no winning rank or payout even when ahead',()=>{
    const store=storage();
    saveAiArenaHistory(room,[{name:'나',assets:15000,forfeited:true},{name:'AI',assets:9000}],store,1234);
    const [record]=JSON.parse(store.getItem());
    assert.equal(record.ended,1234);assert.equal(record.ai,true);
    const mine=record.results.find(p=>p.isOwn),bot=record.results.find(p=>!p.isOwn);
    assert.deepEqual([mine.assets,mine.forfeited,mine.rank,mine.payout],[15000,true,2,0]);
    assert.deepEqual([bot.rank,bot.payout],[1,1000]);
});
test('normal tied results still share first place and virtual payout',()=>{
    const record=saveAiArenaHistory(room,[{name:'나',assets:10000},{name:'AI',assets:10000}],storage());
    assert.ok(record.results.every(p=>p.rank===1&&!p.forfeited&&p.payout===500));
});
test('history keeps its latest 100 entries and recovers malformed local history',()=>{
    const store=storage(JSON.stringify(Array.from({length:100},(_,id)=>({id}))));
    saveAiArenaHistory(room,[{name:'나',assets:10000,forfeited:true},{name:'AI',assets:10000}],store);
    const records=JSON.parse(store.getItem());assert.equal(records.length,100);assert.equal(records[0].id,1);assert.equal(records.at(-1).id,'match');
    assert.doesNotThrow(()=>saveAiArenaHistory(room,[{name:'나',assets:10000}],storage('{')));
});
