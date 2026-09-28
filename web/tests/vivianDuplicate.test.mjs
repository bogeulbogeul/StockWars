import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRoomLayout,propRectangle,getVivianInteriorPropsHtml} from '../js/components/store/VivianInteriorScene.js';
import {duplicateRoomItem,restoreRoomLayout} from '../js/components/store/VivianRoomEditor.js';
import {validateLayout} from '../js/components/store/IsometricRoomGrid.js';

test('duplicate and duplicate-of-duplicate keep unique identity, sprite and valid placement',()=>{
    const items=defaultRoomLayout();
    const first=duplicateRoomItem(items,'goods').item; items.push(first);
    const second=duplicateRoomItem(items,first.id).item; items.push(second);
    assert.notEqual(first.id,second.id); assert.equal(second.assetId,'goods');
    assert.equal(validateLayout(items),'');
    assert(Number.isFinite(propRectangle(second).x));
    assert.match(getVivianInteriorPropsHtml([second]),/goods\.png/);
    const saved=JSON.stringify({version:2,items:items.map(({id,assetId,u,v})=>({id,assetId,u,v}))});
    assert.deepEqual(restoreRoomLayout(saved),items);
});
test('wall copies stay on their wall; exit cannot be duplicated; full walls report no space',()=>{
    const items=defaultRoomLayout();
    assert(duplicateRoomItem(items,'carpet').error);
    for(let n=0;n<7;n++) { const result=duplicateRoomItem(items,'clock'); assert(result.item); assert.equal(result.item.u,0); items.push(result.item); }
    assert(duplicateRoomItem(items,'clock').error);
    assert.equal(validateLayout(items),'');
});
test('restore rejects invalid copies and keeps legacy layout coordinates',()=>{
    const items=defaultRoomLayout(); items.find(i=>i.id==='plant').u=5;
    assert.deepEqual(restoreRoomLayout(JSON.stringify({version:1,items})),items);
    const clone=duplicateRoomItem(items,'plant').item;
    for(const patch of [{assetId:'unknown'},{id:'bad"id'},{u:-1},{assetId:'carpet'}]) {
        assert.deepEqual(restoreRoomLayout(JSON.stringify({version:2,items:[...items,{...clone,...patch}]})),defaultRoomLayout());
    }
});
