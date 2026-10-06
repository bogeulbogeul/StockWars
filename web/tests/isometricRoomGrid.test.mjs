import test from 'node:test';
import assert from 'node:assert/strict';
import { gridToScreen, screenToGrid, validateLayout, createRoomNavigation, routeCells } from '../js/components/store/IsometricRoomGrid.js';
import { defaultRoomLayout } from '../js/components/store/VivianInteriorScene.js';
import { restoreRoomLayout } from '../js/components/store/VivianRoomEditor.js';
import { StorePlayerController } from '../js/components/store/StorePlayerController.js';
import { ROOM_GRID, ROOM_VIEW_SCALE, INTERIOR_CELL, roomFloorClipPath } from '../js/components/store/IsometricRoomGrid.js';
test('Vivian uses common interior cell dimensions with a uniform camera scale',()=>{
    assert.equal(INTERIOR_CELL.halfWidth,33.75);
    assert.equal(INTERIOR_CELL.halfHeight,19.1);
    assert.equal(ROOM_GRID.halfWidth/ROOM_VIEW_SCALE,33.75);
    assert.equal(ROOM_GRID.halfHeight/ROOM_VIEW_SCALE,19.1);
    assert.match(roomFloorClipPath(),/^polygon\(/);
});

test('isometric projection round-trips all tile centres and fractional positions', () => {
    for(let u=.25;u<8;u+=.5) for(let v=.25;v<8;v+=.5) {
        const p=gridToScreen(u,v), g=screenToGrid(p.x,p.y);
        assert(Math.abs(g.u-u)<1e-9 && Math.abs(g.v-v)<1e-9);
    }
});
test('placement checks boundaries, occupied tiles, wall attachment and checkout access', () => {
    const original=defaultRoomLayout(); assert.equal(validateLayout(original),'');
    const changed=(id,patch)=>original.map(i=>i.id===id?{...i,...patch}:i);
    assert.match(validateLayout(changed('fridge',{u:8})),/룸 밖/);
    assert.match(validateLayout(changed('fridge',{u:7,v:3})),/겹칩니다/);
    assert.match(validateLayout(changed('clock',{u:1})),/벽/);
    assert.match(validateLayout(changed('plant',{u:2,v:7})),/통로/);
});
test('saved layout restores only validated coordinates and rejects malformed storage', () => {
    const items=defaultRoomLayout(); items.find(i=>i.id==='plant').u=3;
    const saved=JSON.stringify({version:1,items});
    assert.equal(restoreRoomLayout(saved).find(i=>i.id==='plant').u,3);
    for(const raw of ['broken','null',JSON.stringify({version:1,items:[...items.slice(1),items[1]]})]) {
        assert.deepEqual(restoreRoomLayout(raw),defaultRoomLayout());
    }
    items.find(i=>i.id==='carpet').u=-1;
    assert.deepEqual(restoreRoomLayout(JSON.stringify({version:1,items})),defaultRoomLayout());
});
test('routes go around obstacles and reject disconnected destinations', () => {
    const wall=new Set(Array.from({length:8},(_,v)=>`3,${v}`));
    assert.equal(routeCells({u:1,v:1},{u:5,v:1},wall),null);
    wall.delete('3,6'); const route=routeCells({u:1,v:1},{u:5,v:1},wall);
    assert(route.some(p=>p.u===3&&p.v===6));
    assert(route.every(p=>!wall.has(`${p.u},${p.v}`)));
});
test('player follows grid routes to moved checkout and exit without entering furniture', () => {
    const items=defaultRoomLayout(); items.find(i=>i.id==='counter').u=1;
    assert.equal(validateLayout(items),'');
    const navigation=createRoomNavigation(items), p=new StorePlayerController();
    p.configureRoom(navigation);
    for(const place of [...p.places].reverse()) {
        p.moveTo(place.x,place.y);
        for(let frame=0;frame<1500&&p.target;frame++) {
            p.update(.05); assert(navigation.isWalkable(p.x,p.y));
        }
        assert.equal(p.target,null);
        assert(Math.hypot(p.x-place.x,p.y-place.y)<.1);
        assert.equal(p.nearby().action,place.action);
    }
    p.keys.add('w');p.keys.add('shift');
    for(let i=0;i<250;i++) { p.update(.05); assert(navigation.isWalkable(p.x,p.y)); }
});
