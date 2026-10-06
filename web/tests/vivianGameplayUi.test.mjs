import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document={getElementById:()=>({})};
const {VivianStoreModal}=await import('../js/components/store/VivianStoreModal.js');
import {VivianRoomEditor,initialRoomLayout} from '../js/components/store/VivianRoomEditor.js';
import {getVivianStoreHtml} from '../js/components/store/VivianStoreTemplate.js';
import {defaultRoomLayout,vivianStaffRectangle} from '../js/components/store/VivianInteriorScene.js';

test('purchase prompt appears near Vivian and hides away, while shopping or editing',()=>{
    let nearby={action:'shop'};
    const room={isOpen:true,isShopping:false,roomEditor:{active:false},shopAction:{hidden:true,style:{}},
        player:{places:[{action:'shop',x:400,y:700}],nearby:()=>nearby}};
    const update=()=>VivianStoreModal.prototype.updateShopAction.call(room);
    update(); assert.equal(room.shopAction.hidden,false);
    const staff=vivianStaffRectangle();
    assert.equal(room.shopAction.style.top,`${(staff.y+staff.height*112/1254-12)/1024*100}%`);
    room.roomEditor.items=defaultRoomLayout();
    room.roomEditor.items.find(i=>i.id==='counter').v-=1;
    update();
    const moved=vivianStaffRectangle(room.roomEditor.items);
    assert.equal(room.shopAction.style.left,`${(moved.x+moved.width*652/1254)/1536*100}%`);
    assert.equal(room.shopAction.style.top,`${(moved.y+moved.height*112/1254-12)/1024*100}%`);
    nearby=null;update();assert.equal(room.shopAction.hidden,true);
    nearby={action:'shop'};room.isShopping=true;update();assert.equal(room.shopAction.hidden,true);
    room.isShopping=false;room.roomEditor.active=true;update();assert.equal(room.shopAction.hidden,true);
    room.roomEditor.active=false;room.isOpen=false;update();assert.equal(room.shopAction.hidden,true);
});

test('gameplay hides editing controls by default, explicit authoring option enables them',()=>{
    assert.match(getVivianStoreHtml(),/class="vivian-layout-toolbar" hidden/);
    assert.doesNotMatch(getVivianStoreHtml({allowLayoutEditing:true}),/class="vivian-layout-toolbar" hidden/);
    const disabled={enabled:false};
    VivianRoomEditor.prototype.begin.call(disabled);
    assert.equal(disabled.active,undefined);
});
test('gameplay ignores old editor copies in browser storage',()=>{
    const draft=defaultRoomLayout();
    draft.push({id:'goods-copy-9',assetId:'goods',u:0,v:4});
    const layout=initialRoomLayout(JSON.stringify({version:3,items:draft}));
    assert.deepEqual(layout,defaultRoomLayout());
    assert.equal(layout.filter(i=>(i.assetId||i.id)==='fridge').length,2);
    assert.equal(layout.filter(i=>(i.assetId||i.id)==='goods').length,1);
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
