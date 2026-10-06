import test from 'node:test';
import assert from 'node:assert/strict';
import {SPRITES,defaultRoomLayout} from '../js/components/store/VivianInteriorScene.js';
import {FURNITURE_HEIGHTS,VIVIAN_HEIGHT} from '../js/components/store/VivianFurnitureSizing.js';
import {ROOM_VIEW_SCALE,validateLayout} from '../js/components/store/IsometricRoomGrid.js';
import {restoreRoomLayout} from '../js/components/store/VivianRoomEditor.js';

test('contact corners fit reserved cells without stretching artwork',()=>{
    for(const [id,{sourceEdge,ratio}] of Object.entries(FURNITURE_HEIGHTS)) {
        const s=SPRITES[id],x=s.size[0]/s.crop[2],y=s.size[1]/s.crop[3];
        assert(Math.abs(x-y)<1e-10,id+' uniform scale');
        const {w,h,corners}=s.gridFit;
        for(const p of corners) {
            assert(p.u>=-1e-9 && p.u<=w+1e-9,id+' footprint width');
            assert(p.v>=-1e-9 && p.v<=h+1e-9,id+' footprint depth');
        }
        assert(Math.abs(Math.max(...corners.map(p=>p.u))-w)<1e-9,id+' front edge on grid');
        assert(Math.abs(Math.max(...corners.map(p=>p.v))-h)<1e-9,id+' front edge on grid');
    }
});
test('legacy crowded layout preserves copies and repacks enlarged footprints with checkout access',()=>{
    const old=defaultRoomLayout();
    const at={fridge:[2,0],goods:[0,2],papers:[6,1],counter:[2,5],plant:[4,0]};
    for(const i of old) if(at[i.id]) [i.u,i.v]=at[i.id];
    old.push({id:'fridge-copy-2',assetId:'fridge',u:3,v:0});
    old.push({id:'goods-copy-1',assetId:'goods',u:0,v:4});
    const restored=restoreRoomLayout(JSON.stringify({version:2,items:old}));
    assert.deepEqual(restored.map(i=>i.id).sort(),old.map(i=>i.id).sort());
    assert.equal(validateLayout(restored),'');
    assert.deepEqual(restoreRoomLayout(JSON.stringify({version:3,items:restored})),restored);
});
