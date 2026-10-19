import test from 'node:test';
import assert from 'node:assert/strict';
import { SALON_ROOM, SALON_CHARACTER_REFERENCE, SALON_PLACES, SALON_OBJECTS, SALON_BODIES, salonWalkable, createSalonNavigation } from '../js/components/salon/SalonRoomGeometry.js';
import { StorePlayerController } from '../js/components/store/StorePlayerController.js';
const nav=createSalonNavigation();
test('Claire and player share H90 through the same room source-unit conversion',()=>{
    assert.equal(SALON_CHARACTER_REFERENCE.claireHeight,90);
    assert.equal(SALON_CHARACTER_REFERENCE.playerHeight,90);
    assert.equal(SALON_ROOM.characterScale*90,SALON_CHARACTER_REFERENCE.sourceStandingHeight);
});
test('every salon interaction has a reachable safe approach from the entrance',()=>{
    for(const place of SALON_PLACES){
        assert.ok(salonWalkable(place.x,place.y),place.id);
        const route=nav.route(SALON_PLACES[0],place);assert.ok(route.length,place.id);
        let previous=SALON_PLACES[0];for(const next of route){assert.ok(nav.segment(previous,next),place.id);previous=next;}
    }
});
test('all fixed furniture blocks its footprint and the player cannot tunnel across it',()=>{
    assert.equal(SALON_BODIES.length,8);
    assert.ok(!SALON_OBJECTS.some(o=>['waiting-sofa','side-table'].includes(o.id)));
    assert.equal(SALON_PLACES.filter(p=>p.seat).length,3);
    for(const object of SALON_OBJECTS){
        const x=object.footprint.reduce((s,p)=>s+p[0],0)/object.footprint.length;
        const y=object.footprint.reduce((s,p)=>s+p[1],0)/object.footprint.length;
        assert.equal(salonWalkable(x,y),false,object.id);
    }
    const player=new StorePlayerController();player.configureRoom(nav);
    Object.assign(player,{x:384,y:836});player.keys.add('w');player.keys.add('shift');
    for(let i=0;i<200;i++){player.update(.05);assert.ok(salonWalkable(player.x,player.y));}
    assert.ok(player.y>790,'counter stops the running player in front of its footprint');
});
test('click navigation reaches furniture via the corridor and rejects non-finite inputs',()=>{
    const player=new StorePlayerController();player.configureRoom(nav);
    const target=SALON_PLACES.find(p=>p.id==='chair-left');player.moveTo(target.x,target.y);
    for(let i=0;i<1500&&player.target;i++){player.update(.05);assert.ok(salonWalkable(player.x,player.y));}
    assert.ok(Math.hypot(player.x-target.x,player.y-target.y)<.1);
    assert.equal(salonWalkable(NaN,500),false);assert.equal(salonWalkable(600,Infinity),false);
    assert.equal(salonWalkable(50,900),false);
});
