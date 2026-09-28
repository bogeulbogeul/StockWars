import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document={getElementById:()=>({})};
const {VivianStoreModal}=await import('../js/components/store/VivianStoreModal.js');
import {VivianRoomEditor} from '../js/components/store/VivianRoomEditor.js';
import {getVivianStoreHtml} from '../js/components/store/VivianStoreTemplate.js';

test('gameplay hides editing controls by default, explicit authoring option enables them',()=>{
    assert.match(getVivianStoreHtml(),/class="vivian-layout-toolbar" hidden/);
    assert.doesNotMatch(getVivianStoreHtml({allowLayoutEditing:true}),/class="vivian-layout-toolbar" hidden/);
    const disabled={enabled:false};
    VivianRoomEditor.prototype.begin.call(disabled);
    assert.equal(disabled.active,undefined);
});
test('exit action appears only near carpet during gameplay and follows current exit',()=>{
    let nearby={action:'exit'};
    const room={isOpen:true,isShopping:false,roomEditor:{active:false},exitAction:{hidden:true,style:{}},
        player:{places:[{action:'exit',x:1020,y:820}],nearby:()=>nearby}};
    const update=()=>VivianStoreModal.prototype.updateExitAction.call(room);
    update(); assert.equal(room.exitAction.hidden,false); assert.equal(room.exitAction.style.top,`${855/1024*100}%`);
    nearby=null;update();assert.equal(room.exitAction.hidden,true);
    nearby={action:'shop'};update();assert.equal(room.exitAction.hidden,true);
    nearby={action:'exit'};room.isShopping=true;update();assert.equal(room.exitAction.hidden,true);
    room.isShopping=false;room.roomEditor.active=true;update();assert.equal(room.exitAction.hidden,true);
    room.roomEditor.active=false;room.isOpen=false;update();assert.equal(room.exitAction.hidden,true);
});
