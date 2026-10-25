import test from 'node:test';
import assert from 'node:assert/strict';
import { atStockExit } from '../js/app/exhibition/StockManualExit.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

test('stock exit requires the correct door rather than the desk or another wall', () => {
    const room = { layout: { width: 900, exitZ: 266, exitHalfWidth: 72 }, controller: {} };
    const at = (x,z,passage) => { Object.assign(room.controller,{charPosX:x,charPosY:z*P}); return atStockExit(room,passage); };
    assert(!at(0,100,true)); assert(!at(-380,-100,true)); assert(at(380,-100,true));
    assert(!at(0,100,false)); assert(!at(350,230,false)); assert(at(0,230,false));
});
