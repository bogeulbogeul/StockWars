import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPRITES,defaultRoomLayout} from '../js/components/store/VivianInteriorScene.js';
import {ROOM_GRID} from '../js/components/store/IsometricRoomGrid.js';

const measuredEdges={fridge:[.6,-.6],counter:[.575,-.5],papers:[.625,-.65],baskets:[.7,-.525],wallShelf:[.625,-.525]};

test('resized v8 base follows grid within one room pixel and fits its reserved span',()=>{
    // Actual v8 alpha>128 samples; no claim about upper or short side edges.
    const lower=[[450,1215],[550,1167],[650,1118],[750,1068],[850,1019],[950,969],[1050,918]];
    const s=SPRITES.goods,[a,b,c,d]=s.matrix, scale=s.size[0]/s.crop[2];
    assert(Math.abs(a*a+b*b-1)<1e-12,'rotation preserves lengths');
    assert.equal(a,d); assert.equal(b,-c,'no shear');
    assert.equal(s.size[0]/s.crop[2],s.size[1]/s.crop[3]);
    const span=(a*730+c*(-730*.495))*scale;
    assert(span<=defaultRoomLayout().find(i=>i.id==='goods').h*ROOM_GRID.halfWidth,'base fits reserved span');
    for(const [edge,sign] of [[lower,-1]]) {
        const [x0,y0]=edge[0];
        for(const [x,y] of edge) {
            const dx=(a*(x-x0)+c*(y-y0))*scale;
            const dy=(b*(x-x0)+d*(y-y0))*scale;
            assert(Math.abs(dy-sign*dx*ROOM_GRID.halfHeight/ROOM_GRID.halfWidth)<1);
        }
    }
});
test('furniture base edges align with floor axes after rendering',()=>{
    const target=ROOM_GRID.halfHeight/ROOM_GRID.halfWidth;
    for(const [id,slopes] of Object.entries(measuredEdges)) {
        const s=SPRITES[id], [a,b,c,d]=s.matrix;
        for(const [i,m] of slopes.entries()) {
            const screenSlope=(b+d*m)/(a+c*m);
            assert(Math.abs(screenSlope-(i===0?target:-target))<1e-10,id);
        }
        assert.equal(c,0,'vertical furniture edges stay vertical');
        assert(Math.abs(s.size[0]/s.crop[2]-s.size[1]/s.crop[3])<1e-10,id+' must not distort calibrated axes');
    }
});
test('actual PNG dimensions and transformed full canvas fit every furniture viewport',()=>{
    for(const id of [...Object.keys(measuredEdges),'goods']) {
        const s=SPRITES[id], sceneUrl=new URL('../js/components/store/VivianInteriorScene.js',import.meta.url);
        const png=readFileSync(new URL(s.directory+id+'.png',sceneUrl));
        const source=[png.readUInt32BE(16),png.readUInt32BE(20)];
        assert.deepEqual(s.source,source,id+' actual source dimensions');
        const [a,b,c,d,e,f]=s.matrix, [x,y,w,h]=s.crop;
        for(const px of [0,source[0]]) for(const py of [0,source[1]]) {
            const tx=a*px+c*py+e, ty=b*px+d*py+f;
            assert(tx>=x-1e-8&&tx<=x+w+1e-8&&ty>=y-1e-8&&ty<=y+h+1e-8,id+' full canvas cannot clip');
        }
    }
});
