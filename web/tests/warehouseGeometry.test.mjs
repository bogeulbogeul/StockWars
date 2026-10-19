import test from 'node:test';
import assert from 'node:assert/strict';
import { PARK, WAREHOUSE_PLACES, WAREHOUSE_ENTRANCE, warehouseEntranceHit, warehouseWalkable, createWarehouseNavigation } from '../js/components/logistics/WarehouseGeometry.js';
import { StorePlayerController } from '../js/components/store/StorePlayerController.js';

test('entrance and Park approach are safe and connected without walking through the NPC', () => {
    const nav=createWarehouseNavigation();
    assert.equal(warehouseWalkable(PARK.x,PARK.y),false);
    for(const place of WAREHOUSE_PLACES)assert.equal(warehouseWalkable(place.x,place.y),true);
    const path=nav.route(WAREHOUSE_PLACES[0],WAREHOUSE_PLACES[1]);assert.ok(path.length);
    let previous=WAREHOUSE_PLACES[0];for(const point of path){assert.equal(nav.segment(previous,point),true);previous=point;}
    const start={x:PARK.x-130,y:PARK.y},end={x:PARK.x+130,y:PARK.y};
    assert.equal(nav.segment(start,end),false);
    const around=nav.route(start,end);assert.ok(around.length>1);previous=start;
    for(const point of around){assert.equal(nav.segment(previous,point),true);previous=point;}
});
test('controller can reach Park and return to entrance and stays inside the floor', () => {
    const nav=createWarehouseNavigation(), player=new StorePlayerController();player.configureRoom(nav);
    for(const target of [WAREHOUSE_PLACES[1],WAREHOUSE_PLACES[0]]){
        player.moveTo(target.x,target.y);
        for(let frame=0;frame<600&&player.target;frame++){player.update(1/60);assert.equal(warehouseWalkable(player.x,player.y),true);}
        assert.ok(Math.hypot(player.x-target.x,player.y-target.y)<1);
    }
    player.keys.add('s');for(let frame=0;frame<600;frame++)player.update(1/60);
    assert.equal(warehouseWalkable(player.x,player.y),true);
});

test('entrance interaction follows the side rug and the old front tip no longer acts as an exit', () => {
    assert.equal(warehouseEntranceHit(WAREHOUSE_ENTRANCE.x,WAREHOUSE_ENTRANCE.y),true);
    assert.equal(warehouseEntranceHit(770,900),false);
    assert.equal(warehouseEntranceHit(270,646),false);
    assert.equal(warehouseWalkable(WAREHOUSE_PLACES[0].x,WAREHOUSE_PLACES[0].y),true);
});

test('Park static body includes the player footprint and blocks sustained keyboard movement',()=>{
 const nav=createWarehouseNavigation(),p=new StorePlayerController();p.configureRoom(nav);
 p.x=PARK.x-130;p.y=PARK.y;p.keys.add('d');
 for(let i=0;i<180;i++)p.update(1/60);
 assert.ok(p.x<PARK.x-81);
 assert.equal(warehouseWalkable(PARK.x+70,PARK.y),false);
 for(const [x,y] of [[1217,640],[1270,667],[1178,720],[1125,690]])assert.equal(warehouseEntranceHit(x,y),true);
});
