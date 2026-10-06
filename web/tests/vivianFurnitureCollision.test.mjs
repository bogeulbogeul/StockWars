import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRoomLayout} from '../js/components/store/VivianInteriorScene.js';
import {createRoomNavigation,gridToScreen,furnitureDepthAtPlayer,ROOM_PLAYER_DEPTH} from '../js/components/store/IsometricRoomGrid.js';
import {StorePlayerController} from '../js/components/store/StorePlayerController.js';

test('actor stays in front along the entire diagonal counter face',()=>{
    const c=defaultRoomLayout().find(i=>i.id==='counter');
    for(let v=c.v+.1;v<c.v+c.h;v+=.2) {
        const p=gridToScreen(c.u+c.w+.2,v);
        assert(furnitureDepthAtPlayer(c,p.x,p.y)<ROOM_PLAYER_DEPTH);
    }
    const behind=gridToScreen(c.u-.3,c.v+.5);
    assert(furnitureDepthAtPlayer(c,behind.x,behind.y)>ROOM_PLAYER_DEPTH);
});
test('keyboard sprint and click movement respect the counter foot clearance',()=>{
    const items=defaultRoomLayout(),c=items.find(i=>i.id==='counter');
    const navigation=createRoomNavigation(items);
    const close=gridToScreen(c.u+c.w+.05,c.v+c.h/2);
    assert.equal(navigation.isWalkable(close.x,close.y),false);
    const p=new StorePlayerController();p.configureRoom(navigation);
    Object.assign(p,gridToScreen(c.u+c.w+.5,c.v+1.5));
    p.keys=new Set(['w','a','shift']);
    for(let i=0;i<100;i++){p.update(.05);assert(navigation.isWalkable(p.x,p.y));}
    p.stop();p.moveTo(close.x,close.y);
    for(let i=0;i<250;i++){p.update(.05);assert(navigation.isWalkable(p.x,p.y));}
    assert.equal(p.target,null);
});
