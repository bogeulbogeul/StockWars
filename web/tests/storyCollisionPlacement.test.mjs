import test from 'node:test';
import assert from 'node:assert/strict';
import {placeSomangi} from '../js/app/exhibition/SomangiPresentation.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';

test('story placement repairs overlaps before rendering the first dialogue frame',()=>{
    const c={charPosX:0,charPosY:0,canStand:(x,y)=>Math.hypot(x-210,y/P+80)>=70};
    let firstFrameLegal=false;
    const scene={controller:c,player:{update:()=>{firstFrameLegal=c.canStand(c.charPosX,c.charPosY);}}};
    placeSomangi({place:'information'},scene);
    assert.equal(firstFrameLegal,true);
});
