import test from 'node:test';
import assert from 'node:assert/strict';
import { nearPackingWorktop } from '../js/components/store3d/PackingWorkstation.js';

test('packing requires the customer side of the worktop rather than entry, Bongbong, or tabletop', () => {
    const bounds = { min: { x: 70, z: -200 }, max: { x: 225, z: -130 } };
    assert(nearPackingWorktop(bounds, 165, -60));
    assert(!nearPackingWorktop(bounds, 0, 183.75));
    assert(!nearPackingWorktop(bounds, -65, 103.75));
    assert(!nearPackingWorktop(bounds, 165, -170));
    assert(!nearPackingWorktop(bounds, -100, -60));
});
