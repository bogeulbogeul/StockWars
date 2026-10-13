import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackageNavigation,PLACES,SEATS,OBJECTS,inside,actorIsBehind,PLAYER_COLLIDER,overlapsForeground} from '../js/components/CipherRoomPackageGeometry.js';
import {CipherLobby} from '../js/components/CipherCanvasLobby.js';
import {StorePlayerController} from '../js/components/store/StorePlayerController.js';
import {CipherRoomPackage,CIPHER_ROOM_SCALE,CIPHER_AGENT_ENABLED} from '../js/components/CipherRoomPackage.js';
import {marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
const nav=createPackageNavigation();

test('integrated receptionist room draws once without an extra floating K sprite',()=>{
    const background={naturalWidth:1760},agentK={naturalWidth:1024},calls=[];
    const ctx=new Proxy({},{get:(_,key)=>key==='drawImage'?(image)=>calls.push(image):key==='clip'?()=>calls.push('clip'):()=>{},set:()=>true});
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{scale:CIPHER_ROOM_SCALE,background,agentK,navigation:{clamp:(x,y)=>({x,y})},lobby:{player:{x:669,y:585},notice:{hidden:true},dialoguePage:null,paintPlayer:()=>calls.push('player')}});
    room.draw(ctx);
    assert.deepEqual(calls,[background,'player']);
});

test('room scaling preserves the standing character height and enables K requests',()=>{
    const oldImage=globalThis.Image;globalThis.Image=class{naturalWidth=1024;};
    try{
        const scales=[],ctx=new Proxy({},{get:(_,key)=>key==='scale'?(x,y)=>scales.push([x,y]):()=>{},set:()=>true});
        ctx.scale(CIPHER_ROOM_SCALE,CIPHER_ROOM_SCALE);
        const player={x:566,y:668,facing:1,phase:0};
        CipherLobby.prototype.paintPlayer.call({player,roomPackage:{scale:CIPHER_ROOM_SCALE}},ctx);
        assert.equal(scales[0][1]*scales[1][1],1,'room conversion leaves character H=90 unchanged');
        assert.equal(CIPHER_AGENT_ENABLED,true);
        let target;
        const room=Object.assign(Object.create(CipherRoomPackage.prototype),{pending:null,navigation:nav,lobby:{isOpen:true,notice:{hidden:true},trainingRoom:{dialog:{open:false}},competitionRoom:{dialog:{open:false}},standUp(){},player:{x:566,y:668,stop(){},moveTo(x,y){target={x,y};}},canvas:{focus(){}}}});
        room.request('agent');assert.equal(room.pending,'agent');
        assert.deepEqual(target,{x:669,y:585});
    }finally{globalThis.Image=oldImage;}
});

test('competition door has an open approach corridor beside the relocated lounge',()=>{
    for(const [x,y] of [[1300,520],[1340,540],[1380,560]])assert.ok(nav.isWalkable(x,y));
    assert.ok(nav.segment({x:1300,y:520},PLACES.find(p=>p.id==='competition')));
});

test('reception and entrance mat retain clear floor beside the lounge',()=>{
    for(const [x,y] of [[750,610],[780,630],[730,690]])assert.ok(nav.isWalkable(x,y));
});
test('each sofa has one centre seat and either legacy half-seat blocks the entire sofa',()=>{
    assert.equal(SEATS.length,2);assert.equal(new Set(SEATS.map(s=>s.sofa)).size,2);
    assert.deepEqual(SEATS.map(s=>[s.x,s.y]),[[949,567],[1220,598.5]]);
    const lobby={player:{...SEATS[0].approach},remotePlayers:[{resting:true,seatId:'lounge-left-2'}]};
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{lobby});
    assert.equal(room.nearbySeat(),null);
    lobby.remotePlayers=[];assert.equal(room.nearbySeat().id,'lounge-left');
});
test('depth uses one foot-anchor decision for the entire sprite, including furniture corners',()=>{
    const sofa=OBJECTS.find(o=>o.id==='sofa-left');
    assert.equal(actorIsBehind({x:946,y:636},sofa),false,'standing in front of the sofa must not slice off a shoulder');
    assert.equal(actorIsBehind({x:1054,y:587},sofa),false);
    assert.equal(actorIsBehind({x:1071,y:546},sofa),true,'the sofa still masks an overlapping shoulder from behind');
    const right=OBJECTS.find(o=>o.id==='sofa-right');
    assert.equal(actorIsBehind({x:1211,y:676},right),false);
    assert.equal(actorIsBehind({x:1149,y:621},right),false);
    assert.equal(actorIsBehind({x:1152,y:542},right),true);
});
test('local and remote seated characters use the cushion anchor without the legacy 24px lift',()=>{
    const priorImage=globalThis.Image;
    globalThis.Image=class { naturalWidth=1024; };
    const translations=[],ctx=new Proxy({},{get:(_,key)=>key==='translate'?(...args)=>translations.push(args):()=>{},set:()=>true});
    const player={x:1030,y:515,facing:1,phase:0},lobby={player,seated:SEATS[1]};
    CipherLobby.prototype.paintPlayer.call(lobby,ctx);assert.deepEqual(translations[0],[1030,515]);
    translations.length=0;CipherLobby.prototype.paintPlayer.call(lobby,ctx,{...player,resting:true});assert.deepEqual(translations[0],[1030,515]);
    assert.deepEqual(translations[2],[0,17]);
    globalThis.Image=priorImage;
});
test('every facility and seat approach is walkable and connected in both directions',()=>{
    const destinations=[...PLACES,...SEATS.map(s=>({...s.approach,id:s.id}))];
    for(const a of destinations){assert.ok(nav.isWalkable(a.x,a.y),`blocked: ${a.id}`);for(const b of destinations){const route=nav.route(a,b);assert.ok(route.length,`${a.id} → ${b.id}`);let prior=a;for(const p of route){assert.ok(nav.segment(prior,p),`unsafe segment: ${a.id} → ${b.id}`);prior=p;}}}
});
test('controller reaches each facility without getting stuck or crossing furniture',()=>{
    for(const target of [...PLACES,...SEATS.map(s=>s.approach)]){const player=new StorePlayerController();player.configureRoom(nav);player.moveTo(target.x,target.y);for(let i=0;i<1500&&player.target;i++){player.update(.05);assert.ok(nav.isWalkable(player.x,player.y));}assert.ok(Math.hypot(player.x-target.x,player.y-target.y)<1,JSON.stringify(target));}
    for(const o of OBJECTS){const x=o.footprint.reduce((s,p)=>s+p[0],0)/o.footprint.length,y=o.footprint.reduce((s,p)=>s+p[1],0)/o.footprint.length;assert.equal(nav.isWalkable(x,y),false,o.id);}
    assert.equal(nav.isWalkable(50,50),false);
});
test('static bodies stop the full player ground collider at edges and corners',()=>{
    assert.deepEqual(nav.bodies.map(b=>b.id),OBJECTS.map(o=>o.id));
    assert.ok(nav.bodies.every(b=>b.type==='static'));
    for(const body of nav.bodies){
        // Approach each vertex from all directions, including diagonal corners.
        for(const [x,y] of body.polygon)for(let i=0;i<16;i++){
            const angle=i*Math.PI/8,px=x+(PLAYER_COLLIDER.radiusX-1)*Math.cos(angle),py=y+(PLAYER_COLLIDER.radiusY-1)*Math.sin(angle);
            assert.equal(nav.isWalkable(px,py),false,`${body.id}: corner ${x},${y}`);
        }
    }
    // The table's near-left leg used to lie outside its collision footprint.
    assert.equal(nav.isWalkable(981,651),false);
    assert.ok(nav.isWalkable(SEATS[0].approach.x,SEATS[0].approach.y),'left sofa approach remains open');
    assert.ok(nav.isWalkable(1211,676),'right sofa approach remains open');
});
test('old desk, sofa and plant overlap positions cannot be used by local or online players',()=>{
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{navigation:nav});
    for(const [x,y] of [[808,451],[775,398],[640,411],[981,521],[1146,587],[1103,586]]){
        assert.equal(nav.isWalkable(x,y),false,`${x},${y}`);
        const pose=room.actorPose({x,y,facing:1,phase:2},null);
        assert.ok(nav.isWalkable(pose.x,pose.y));
        assert.equal(overlapsForeground(pose.x,pose.y),false);
    }
    for(const seat of SEATS){const pose=room.actorPose({x:0,y:0,phase:2},seat);assert.deepEqual([pose.x,pose.y,pose.phase],[seat.x,seat.y,0]);}
});
test('raised desk return blocks foot and shadow at its top and right corner',()=>{
    for(const [x,y] of [[803,332],[827,342],[850,348],[740,307]]){
        assert.equal(nav.isWalkable(x,y),false,`counter rim ${x},${y}`);
        const safe=nav.clamp(x,y);
        assert.ok(nav.isWalkable(safe.x,safe.y));
        assert.ok(nav.route(PLACES[0],safe).length,'correction lands on accessible floor');
    }
});
test('facility click completes only after approach and movement cancels pending action',()=>{
    const player=new StorePlayerController();player.configureRoom(nav);let calls=0;
    const lobby={isOpen:true,player,notice:{hidden:true},tour:{active:false},trainingRoom:{dialog:{open:false}},competitionRoom:{dialog:{open:false}},standUp(){},canvas:{focus(){}},showMembershipNotice(){calls++;}};
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{lobby,navigation:nav});
    room.request('elevator');room.update();assert.equal(calls,0);
    player.keys.add('d');room.update();assert.equal(room.pending,null);player.stop();
    room.request('elevator');for(let i=0;i<1500&&room.pending;i++){player.update(.05);room.update();}
    assert.equal(calls,1);assert.equal(room.pending,null);
});
test('occupied seats cannot be selected at arrival',()=>{
    const seat=SEATS[0],player=new StorePlayerController();player.configureRoom(nav);Object.assign(player,seat.approach);let sits=0;
    const lobby={player,notice:{hidden:true},remotePlayers:[{resting:true,seatId:seat.id}],toggleSitting(){sits++;}};
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{lobby,navigation:nav,pending:seat.id});room.update();assert.equal(sits,0);
});
test('CSS index follows the engine, retains only observed index values, and unsubscribes on exit',t=>{
    const oldDocument=globalThis.document;
    globalThis.document={createElement:()=>({style:{}})};t.after(()=>{globalThis.document=oldDocument;});
    const parts=new Map();const board={querySelector:key=>{if(!parts.has(key))parts.set(key,{style:{},textContent:''});return parts.get(key);}};
    const plot={children:[],replaceChildren(){this.children=[];},append(n){this.children.push(n);},setAttribute(k,v){this[k]=v;}};
    const room=Object.assign(Object.create(CipherRoomPackage.prototype),{board,plot,resize(){}});
    const count=marketEngine.listeners.size;
    room.open();assert.equal(marketEngine.listeners.size,count+1);
    assert.equal(room.history.at(-1),Number(marketEngine.getCipherIndex().val));
    room.updateIndex({day:1,cipherIndex:{val:'2481.35',diffPct:1.12}});
    assert.equal(parts.get('.cipher-index-value').textContent,'2,481.35');assert.equal(room.history.at(-1),2481.35);
    room.updateIndex({day:2,cipherIndex:{val:'2450.00',diffPct:-1.41}});
    assert.deepEqual(room.history,[2450]);assert.equal(parts.get('.cipher-index-change').textContent,'▼ 1.41%');
    room.open();assert.equal(marketEngine.listeners.size,count+1);
    room.close();assert.equal(marketEngine.listeners.size,count);
});
