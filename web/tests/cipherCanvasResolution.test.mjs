import test from 'node:test';
import assert from 'node:assert/strict';
import {cipherCanvasResolution} from '../js/components/CipherCanvasResolution.js';
import {CipherRoomPackage} from '../js/components/CipherRoomPackage.js';
import {marketEngine} from '../js/engine/marketEngine.js';
import {CipherLobby} from '../js/components/CipherCanvasLobby.js';
marketEngine.stopEngine();
const room={width:1760,height:894};

test('fits physical pixels without changing room aspect or double-applying UI zoom',()=>{
    assert.deepEqual(cipherCanvasResolution(1920,1080,1,room),{width:1920,height:975});
    assert.deepEqual(cipherCanvasResolution(1920,1080,2,room),{width:3840,height:1951});
    assert.deepEqual(cipherCanvasResolution(960,540,1.25,room),{width:1200,height:610});
    assert.deepEqual(cipherCanvasResolution(1920,600,1,room),{width:1181,height:600});
    assert.equal(cipherCanvasResolution(0,0,2,room),null);
});
test('buffer updates on DPR changes and stays untouched at the same dimensions',()=>{
    const previous=globalThis.devicePixelRatio;
    try{
        globalThis.devicePixelRatio=1;
        const canvas={width:1760,height:894};
        const pkg=Object.assign(Object.create(CipherRoomPackage.prototype),{lobby:{canvas},displaySize:{width:1920,height:1080},scale:.6});
        assert.equal(pkg.syncResolution(),true);
        assert.deepEqual(canvas,{width:1920,height:975});
        assert.equal(pkg.syncResolution(),false);
        globalThis.devicePixelRatio=2;
        assert.equal(pkg.syncResolution(),true);
        assert.deepEqual(canvas,{width:3840,height:1951});
        assert.equal(pkg.scale,.6);
        pkg.displaySize={width:0,height:0};
        assert.equal(pkg.syncResolution(),false);
    }finally{if(previous===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=previous;}
});
test('draw uses a uniform backing-pixel transform while retaining logical room coordinates',()=>{
    const transforms=[],calls=[];
    const ctx={setTransform:(...v)=>transforms.push(v),clearRect:(...v)=>calls.push(v),save(){},restore(){}};
    const lobby={player:{},notice:{},canvas:{width:3840,height:1951,getContext:()=>ctx},roomPackage:{scale:.6,syncResolution(){},draw:()=>calls.push('room')}};
    CipherLobby.prototype.draw.call(lobby);
    const s=3840/1760;
    assert.deepEqual(transforms[0],[1,0,0,1,0,0]);
    assert.deepEqual(transforms[1].slice(0,4),[s,0,0,s]);
    assert.ok(Math.abs(transforms[1][4])<1e-9);
    assert.ok(Math.abs(transforms[1][5]-(1951-894*s)/2)<1e-9);
    assert.deepEqual(calls[0],[0,0,3840,1951]);
    assert.equal(calls[1],'room');
    assert.equal(ctx.imageSmoothingQuality,'high');
});
