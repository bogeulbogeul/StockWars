import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_PLACES,HOME_OBJECTS,HOME_RIGIDBODIES,HOME_PLAYER_BODY,homeGridToSource,homeSourceToGrid,homeWalkable,homeRoute,homeSegment,homeMove,homeSafePosition,homeFurnitureInFront} from '../js/components/office/OfficeRoomPackage.js';
test('source projection round trips without stretching room artwork',()=>{
    for(const [x,y] of [[0,0],[3.5,3.5],[7,7]]){const p=homeGridToSource(x,y),g=homeSourceToGrid(p.x,p.y);assert.ok(Math.abs(x-g.gx)<1e-9&&Math.abs(y-g.gy)<1e-9);}
});
test('static furniture stops the whole player body from every reachable direction',()=>{
    assert.equal(HOME_RIGIDBODIES.length,4);
    assert.ok(HOME_RIGIDBODIES.every(body=>body.type==='static'));
    assert.ok(HOME_PLAYER_BODY.radiusX>=44&&HOME_PLAYER_BODY.radiusY>=22);
    for(const object of HOME_OBJECTS){
        const center={x:object.footprint.reduce((s,p)=>s+p[0],0)/object.footprint.length,y:object.footprint.reduce((s,p)=>s+p[1],0)/object.footprint.length};
        const end=homeSourceToGrid(center.x,center.y);let checked=0;
        for(const radius of [180,240,300,360,420])for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){
            const start=homeSourceToGrid(center.x+Math.cos(angle)*radius,center.y+Math.sin(angle)*radius);
            if(!homeWalkable(start.gx,start.gy))continue;
            const result=homeMove(start,end.gx-start.gx,end.gy-start.gy,{slide:false});
            assert.ok(homeWalkable(result.gx,result.gy),object.id);
            assert.ok(Math.hypot(result.gx-end.gx,result.gy-end.gy)>.1,object.id);
            assert.ok(homeSegment(start,result),object.id);checked++;
        }
        assert.ok(checked>0,object.id);
    }
});
test('large movement cannot tunnel through a chair, and blocked positions recover safely',()=>{
    const start=homeSourceToGrid(660,980),end=homeSourceToGrid(660,450);
    const result=homeMove(start,end.gx-start.gx,end.gy-start.gy,{slide:false});
    assert.ok(homeWalkable(result.gx,result.gy));assert.ok(homeSegment(start,result));
    assert.ok(homeGridToSource(result.gx,result.gy).y>685);
    for(const position of [homeSourceToGrid(440,620),homeSourceToGrid(670,640),{gx:-5,gy:-5}]){
        const safe=homeSafePosition(position);assert.ok(homeWalkable(safe.gx,safe.gy));
    }
});
test('spawn and every functional approach can be reached around fixed furniture',()=>{
    const spawn=homeSafePosition({gx:3.5,gy:3.5});assert.ok(homeWalkable(spawn.gx,spawn.gy));
    const places=HOME_PLACES.map(p=>homeSourceToGrid(p.x,p.y));
    for(const start of [homeSafePosition({gx:3.5,gy:3.5}),...places])for(const end of places){const path=homeRoute(start,end);assert.ok(path.length);let previous=start;for(const next of path){assert.ok(homeSegment(previous,next));previous=next;}assert.deepEqual(path.at(-1),end);}
});
test('furniture footprints and outside floor reject walking destinations',()=>{
    for(const o of HOME_OBJECTS){const x=o.footprint.reduce((s,p)=>s+p[0],0)/o.footprint.length,y=o.footprint.reduce((s,p)=>s+p[1],0)/o.footprint.length,g=homeSourceToGrid(x,y);assert.equal(homeWalkable(g.gx,g.gy),false,o.id);assert.deepEqual(homeRoute(homeSafePosition({gx:3.5,gy:3.5}),g),[]);}
    assert.equal(homeWalkable(-2,-2),false);
});
test('central spawn moves in every direction without entering furniture',()=>{
    const start={gx:3.5,gy:3.5};assert.ok(homeWalkable(start.gx,start.gy));
    for(const [dx,dy] of [[-.25,-.25],[.25,.25],[.25,-.25],[-.25,.25]]){
        const next=homeMove(start,dx,dy);assert.ok(Math.hypot(next.gx-start.gx,next.gy-start.gy)>.2);assert.ok(homeWalkable(next.gx,next.gy));
    }
});
test('furniture does not cover a player standing in front of its local front edge',()=>{
    for(const object of HOME_OBJECTS){const front=object.footprint.reduce((a,b)=>a[1]>b[1]?a:b);assert.equal(homeFurnitureInFront(object,{x:front[0],y:front[1]+10}),false);}
});
