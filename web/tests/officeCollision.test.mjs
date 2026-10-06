import test from 'node:test';
import assert from 'node:assert/strict';
import { officeMove, officePositionBlocked } from '../js/components/office/OfficeCollision.js';
const items = [{placed:true, gridX:2, gridY:2, sizeW:2, sizeH:1, rotation:0}];
test('bed blocks approach from every side with either orientation', () => {
    for (const rotation of [0, 90]) {
        const bed = [{placed:true, gridX:2, gridY:2, sizeW:2, sizeH:4, rotation}];
        for (const [x,y,dx,dy] of [[0.5,2.5,6,0],[7.5,2.5,-6,0],[2.5,0.5,0,6],[2.5,7.5,0,-6]]) {
            const p = officeMove(bed,x,y,dx,dy);
            assert.equal(officePositionBlocked(bed,p.x,p.y),false);
        }
        assert.equal(officePositionBlocked(bed,1.5,1.5),true);
    }
});
test('movement cannot cross furniture even with large steps', () => {
    const p = officeMove(items, 1, 2.5, 5, 0);
    assert.ok(p.x <= 1.78);
    assert.equal(officePositionBlocked(items, p.x, p.y), false);
    assert.equal(officePositionBlocked(items, 2.5, 2.5), true);
});
test('rotation changes collision; stored and wall assets do not block', () => {
    assert.equal(officePositionBlocked([{...items[0], rotation:90}], 2.5, 3.5), true);
    assert.equal(officePositionBlocked([{...items[0], placed:false}], 2.5, 2.5), false);
    assert.equal(officePositionBlocked([{...items[0], wallFixture:'isoOfficeWindow'}], 2.5, 2.5), false);
});
