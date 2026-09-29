import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { TownPlayerController } from '../js/components/town/TownPlayerController.js';
import { TownStage } from '../js/components/TownStage.js';
import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_PROP_DEFINITIONS, TOWN_STREET_LAMPS, TOWN_URBAN_TREES } from '../js/data/townWorldData.js';
import { townEntrance } from '../js/data/townLayout.js';
import { TOWN_LANDSCAPE_BENCHES } from '../js/data/townLandscape.js';
const tick = p => p.update(0.1, 1200, 900);
const player = () => { const p = new TownPlayerController(); p.charPosX = 2000; p.charPosY = 1600; return p; };

test('visible landscape benches expose reachable recovery actions', () => {
    assert.equal(TOWN_LANDSCAPE_BENCHES.length, 8);
    for (const bench of TOWN_LANDSCAPE_BENCHES) {
        let heals = 0;
        const controller = new TownPlayerController({ onHeal: () => heals++ });
        const stage = { playerController: controller, callbacks: {} };
        controller.placeAt(bench);
        assert.ok(controller.canStand(controller.charPosX, controller.charPosY), bench.id);
        TownStage.prototype.checkProximity.call(stage);
        assert.equal(stage.activeNearbyObject?.id, bench.id);
        TownStage.prototype.triggerAction.call(stage, stage.activeNearbyObject);
        assert.equal(heals, 1);
        assert.equal(controller.isResting, true);
        controller.handleKeyDown({ key: 's', shiftKey: false });
        tick(controller);
        assert.equal(controller.isResting, false);
        assert.ok(controller.charPosY > townEntrance(bench).y);
    }
});

test('screen directions, normalized diagonal speed and running', () => {
    for (const [keys, dx, dy, distance] of [
        [['w'],0,-1,28], [['s'],0,1,28], [['a'],-1,0,28], [['d'],1,0,28],
        [['w','d'],1,-1,28], [['w','d','shift'],1,-1,50.4]
    ]) {
        const p=player(); p.keysHeld=new Set(keys); tick(p);
        assert.equal(Math.sign(p.charPosX-2000),dx); assert.equal(Math.sign(p.charPosY-1600),dy);
        assert.ok(Math.abs(Math.hypot(p.charPosX-2000,p.charPosY-1600)-distance)<1e-8);
    }
});

test('every entrance is reachable and solid footprints stop running without tunnelling', () => {
    const p=player();
    for (const o of [...TOWN_BUILDINGS,...TOWN_INTERACTIVE_PROPS]) {
        p.placeAt(o); assert.ok(p.canStand(p.charPosX,p.charPosY),o.id);
        assert.equal(p.canStand(p.charPosX,o.y-10),false,o.id);
    }
    p.placeAt(TOWN_BUILDINGS[0]); p.keysHeld=new Set(['w','shift']);
    for(let i=0;i<20;i++) tick(p);
    assert.ok(p.charPosY>=TOWN_BUILDINGS[0].y+16); assert.equal(p.isMoving,false);
});

test('rear passage, world boundaries and camera bounds', () => {
    const p=player(); p.charPosX=100; p.charPosY=600; p.keysHeld.add('d');
    for(let i=0;i<50;i++) tick(p);
    assert.ok(p.charPosX>1000);
    p.charPosX=60; p.charPosY=100; p.keysHeld=new Set(['w','a','shift']); tick(p);
    assert.equal(p.charPosX,60); assert.equal(p.charPosY,100);
    p.updateCamera(20000,4000,0,true); assert.equal(p.cameraX,0); assert.equal(p.cameraY,0);
});

test('interaction requires both axes; closed shops cannot be entered', () => {
    const stage={playerController:player()};
    for(const b of TOWN_BUILDINGS) {
        stage.playerController.placeAt(b); TownStage.prototype.checkProximity.call(stage);
        assert.equal(stage.activeNearbyObject?.id,b.available===false?undefined:b.id);
        stage.playerController.charPosY-=400; TownStage.prototype.checkProximity.call(stage);
        assert.equal(stage.activeNearbyObject,undefined);
    }
});

test('rest heals once and releases on vertical input', () => {
    let heals=0; const p=new TownPlayerController({onHeal:()=>heals++});
    p.keysHeld.add('d'); p.restOnBench(TOWN_PROP_DEFINITIONS[0]); tick(p);
    assert.equal(heals,1); assert.equal(p.isMoving,false); assert.equal(p.isResting,true);
    p.handleKeyDown({key:'w',shiftKey:false}); assert.equal(p.isResting,false);
});

test('all named facility returns, aliases and preserved unqualified return positions', () => {
    globalThis.document={body:{classList:{add(){}}}};
    try {
        const stage={playerController:player(),viewportEl:{clientWidth:1200,clientHeight:900},update(){},checkProximity(){}};
        for(const id of [...TOWN_BUILDINGS.map(b=>b.id),'vivian','logistics']) {
            TownStage.prototype.show.call(stage,undefined,id);
            const e=townEntrance(TOWN_BUILDINGS.find(b=>b.id===({vivian:'vivian_store',logistics:'bit_logistics'}[id]||id)));
            assert.equal(stage.playerController.charPosX,e.x); assert.equal(stage.playerController.charPosY,e.y);
        }
        stage.playerController.charPosX=2000; stage.playerController.charPosY=1600;
        TownStage.prototype.show.call(stage);
        assert.equal(stage.playerController.charPosX,2000); assert.equal(stage.playerController.charPosY,1600);
    } finally { delete globalThis.document; }
});


test('paused scenery has no invisible collision or proximity targets', () => {
    assert.equal(TOWN_INTERACTIVE_PROPS.length, 0);
    assert.equal(TOWN_STREET_LAMPS.length, 0);
    assert.equal(TOWN_URBAN_TREES.length, 0);
    const p = player();
    assert.ok(p.canStand(1020, 1230), 'former tree trunk');
    assert.ok(p.canStand(145, 1244), 'former lamp base');
    assert.ok(p.canStand(2815, 1110), 'former west bench');
    const stage = { playerController: p };
    p.placeAt(TOWN_PROP_DEFINITIONS[0]);
    TownStage.prototype.checkProximity.call(stage);
    assert.equal(stage.activeNearbyObject, undefined);
});

test('regenerated building PNGs exist and entrance markers match each doorway', () => {
    for (const b of TOWN_BUILDINGS) {
        const left = b.x + (b.width - b.asset.displayWidth) / 2;
        assert.ok(b.entranceX > left && b.entranceX < left + b.asset.displayWidth, b.id);
        assert.ok(b.asset.src.includes('/topdown-v1/'), b.id);
        assert.ok(b.asset.x >= 0 && b.asset.x + b.asset.cropWidth <= b.asset.width, b.id);
        assert.ok(b.asset.y >= 0 && b.asset.y + b.asset.cropHeight <= b.asset.height, b.id);
        const png = readFileSync(new URL(b.asset.src));
        assert.equal(png.readUInt32BE(16), b.asset.width);
        assert.equal(png.readUInt32BE(20), b.asset.height);
        assert.equal(png[25], 6, 'RGBA transparency');
    }
});


test('all concept-layout entrances connect through the central plaza', () => {
    const p = player(); const step = 20;
    const queue = [[1800, 1100]], seen = new Set(['1800,1100']);
    for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        for (const [dx, dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
            const nx=x+dx, ny=y+dy, key=nx+','+ny;
            if (!seen.has(key) && p.canStand(nx,ny) && p.canStand(x+dx/2,y+dy/2)) {
                seen.add(key); queue.push([nx,ny]);
            }
        }
    }
    for (const b of TOWN_BUILDINGS) {
        const entry=townEntrance(b);
        assert.ok(queue.some(([x,y])=>Math.hypot(x-entry.x,y-entry.y)<25), b.id+' reachable');
        const left=b.x+(b.width-b.asset.displayWidth)/2;
        assert.ok(left>60 && left+b.asset.displayWidth<p.worldWidth-60, b.id+' horizontal bounds');
        assert.ok(b.y-b.height>100 && b.y+80<p.worldHeight-100, b.id+' vertical bounds');
    }
    for(let x=1500;x<=2400;x+=step) assert.ok(p.canStand(x,1100), 'open plaza');
});
