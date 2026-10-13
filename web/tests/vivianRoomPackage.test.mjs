import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKAGE_PLACES,PACKAGE_OBJECTS,PACKAGE_RIGIDBODIES,createVivianPackageNavigation,getVivianPackageHtml,VIVIAN_PACKAGE_VIEW_SCALE,inPolygon,VivianRoomPackage} from '../js/components/store/VivianRoomPackage.js';
import {StorePlayerController} from '../js/components/store/StorePlayerController.js';
const nav=createVivianPackageNavigation();
test('integrated NPC has no duplicate staff or hand overlays and all furniture has static bodies',()=>{
    const html=getVivianPackageHtml();assert.match(html,/vivian-room-with-squirrel-v8/);assert.doesNotMatch(html,/vivian-package-staff|vivian-package-hands|vivian-package-counter/);
    assert.equal(nav.bodies,PACKAGE_RIGIDBODIES);assert.ok(nav.bodies.every(b=>b.type==='static'));
    assert.ok(nav.bodies.some(b=>b.id==='fridge-left'));assert.ok(nav.bodies.some(b=>b.id==='fridge-right'));
    for(const body of nav.bodies)for(const [x,y] of body.polygon)assert.equal(nav.isWalkable(x,y),false,`solid corner: ${body.id}`);
});
test('counter silhouette covers the worktop without extending to the staff face',()=>{
    const counter=PACKAGE_OBJECTS.find(o=>o.id==='counter');
    assert.ok(inPolygon(320,515,counter.shape),'rear worktop must cover the torso');
    assert.equal(inPolygon(300,450,counter.shape),false,'face stays behind and above the rim');
});
test('new entrance and checkout are reachable without crossing fixed furniture',()=>{
    for(const p of PACKAGE_PLACES)assert.ok(nav.isWalkable(p.x,p.y));
    for(const start of PACKAGE_PLACES)for(const end of PACKAGE_PLACES){const player=new StorePlayerController();player.configureRoom(nav);Object.assign(player,start);player.moveTo(end.x,end.y);for(let i=0;i<1500&&player.target;i++){player.update(.05);assert.ok(nav.isWalkable(player.x,player.y));}assert.ok(Math.hypot(player.x-end.x,player.y-end.y)<1);}
    for(const o of PACKAGE_OBJECTS){const x=o.footprint.reduce((n,p)=>n+p[0],0)/o.footprint.length,y=o.footprint.reduce((n,p)=>n+p[1],0)/o.footprint.length;assert.equal(nav.isWalkable(x,y),false,o.id);}
    assert.equal(nav.isWalkable(0,0),false);
});
test('route goes around the centre island and every segment is safe',()=>{
    const start=nav.clamp(580,600),end=nav.clamp(1030,560),route=nav.route(start,end);assert.ok(route.length>1);
    let prior=start;for(const next of route){assert.ok(nav.segment(prior,next));prior=next;}
});
test('room includes squirrel behind counter and independent animated clock hands',()=>{
    const html=getVivianPackageHtml();assert.match(html,/vivian-room-with-squirrel-v8/);assert.match(html,/vivian-clock-hand/);assert.match(html,/--clock-period:60s/);
    assert.equal(90*VIVIAN_PACKAGE_VIEW_SCALE/(1336/8),90/67.5);
});
test('facility click walks to approach before opening its tab and keyboard cancels it',()=>{
    const player=new StorePlayerController();player.configureRoom(nav);let tab=null;
    const owner={player,isOpen:true,isShopping:false,interiorEl:{focus(){}},showShop(t){tab=t;this.isShopping=true;}};
    const room=Object.assign(Object.create(VivianRoomPackage.prototype),{navigation:nav,pending:null});
    room.request(owner,'household');room.updateInteractions(owner);assert.equal(tab,null);
    player.keys.add('w');room.updateInteractions(owner);assert.equal(room.pending,null);player.stop();
    room.request(owner,'household');for(let i=0;i<1500&&room.pending;i++){player.update(.05);room.updateInteractions(owner);}
    assert.equal(tab,'weekly');assert.equal(room.pending,null);
});
