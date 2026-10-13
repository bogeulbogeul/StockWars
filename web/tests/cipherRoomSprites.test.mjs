import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPRITES,spriteRect,roomDrawOrder} from '../js/components/CipherRoomSprites.js';
import {OBJECTS,SEATS} from '../js/components/CipherRoomPackageGeometry.js';

test('every collidable furniture object has an independent sprite and valid PNG',()=>{
    for(const object of OBJECTS)assert.ok(SPRITES.some(s=>s.id===object.id),object.id);
    for(const name of new Set(SPRITES.map(s=>s.asset))){
        const data=readFileSync(new URL(`../assets/interiors/cipher/separated-v2/${name}.png`,import.meta.url));
        assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');
        assert.equal(data[25],6,`${name} must have its own alpha channel`);
    }
});
test('transparent padding is excluded without stretching asset proportions',()=>{
    const crop={x:100,y:80,width:400,height:200},def={box:[20,30,100,100]},r=spriteRect(def,crop);
    assert.deepEqual(r,{x:20,y:80,width:100,height:50});
    assert.equal(r.width/r.height,crop.width/crop.height);
});
test('desk ends and front use whole PNG painter ordering',()=>{
    for(const [x,y,behind] of [[808,451,true],[775,398,true],[640,411,true],[669,570,false]]){
        const order=roomDrawOrder([{pose:{x,y}}]).map(n=>n.id);
        assert.equal(order.indexOf('actor-0')<order.indexOf('desk'),behind,`${x},${y}`);
    }
});
test('seated actors render over their sofa and K renders behind the desk',()=>{
    for(const seat of SEATS){
        const order=roomDrawOrder([{pose:seat,seat},{pose:{x:630,y:475},bounds:[566,292,128,192],forceBehind:'desk'}]).map(n=>n.id);
        assert.ok(order.indexOf(seat.sofa)<order.indexOf('actor-0'));
        assert.ok(order.indexOf('actor-1')<order.indexOf('desk'));
    }
});
test('live room uses the approved unified background, without separate furniture or player erasing',()=>{
    const source=readFileSync(new URL('../js/components/CipherRoomPackage.js',import.meta.url),'utf8');
    assert.ok(!source.includes('destination-out'));
    assert.ok(!source.includes('CipherRoomSprites'));
    assert.ok(source.includes('cipher-lobby-package-agent-k-v8.png'));
});
