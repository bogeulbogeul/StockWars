import test from 'node:test';
import assert from 'node:assert/strict';
import {createCipherNavigation} from '../js/components/CipherNavigation.js';
import {cipherGridToScreen} from '../js/components/CipherGrid.js';

test('movement reuses collision cells within a frame and refreshes moved furniture next frame',()=>{
    const items=[{asset:'sofa',u:6,v:6}];let reads=0;
    const nav=createCipherNavigation(()=>{reads++;return items;},()=>[1,1]);
    const blocked=cipherGridToScreen(6.5,6.5),free=cipherGridToScreen(7.5,7.5);
    nav.beginFrame();
    for(let n=0;n<50;n++){assert.equal(nav.isWalkable(blocked.x,blocked.y),false);assert.equal(nav.isWalkable(free.x,free.y),true);}
    assert.equal(reads,1);nav.endFrame();
    items[0].u=7;items[0].v=7;nav.beginFrame();
    assert.equal(nav.isWalkable(blocked.x,blocked.y),true);assert.equal(nav.isWalkable(free.x,free.y),false);nav.endFrame();
});
