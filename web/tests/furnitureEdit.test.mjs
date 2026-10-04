import test from 'node:test';
import assert from 'node:assert/strict';
import { FurnitureEditModal } from '../js/components/FurnitureEditModal.js';

const editor = () => {
    const value = Object.create(FurnitureEditModal.prototype);
    value.gridSize = 8;
    value.furnitureList = [{ id: 'desk', placed: true, gridX: 2, gridY: 2, sizeW: 2, sizeH: 2, rotation: 0 }];
    return value;
};

test('placement rejects overlap and out-of-bounds positions, permits moving itself', () => {
    const value = editor();
    const chair = { id: 'chair', sizeW: 1, sizeH: 1, rotation: 0 };
    assert.equal(value.canPlace(chair, 2, 2), false);
    assert.equal(value.canPlace(chair, 4, 2), true);
    assert.equal(value.canPlace(chair, -1, 0), false);
    assert.equal(value.canPlace(chair, 8, 0), false);
    assert.equal(value.canPlace(chair, null, 0), false);
    assert.equal(value.canPlace(value.furnitureList[0], 3, 2), true);
});

test('rotation footprint is checked against boundaries and other furniture', () => {
    const value = editor();
    const sofa = { id: 'sofa', sizeW: 3, sizeH: 1, rotation: 0 };
    assert.equal(value.canPlace(sofa, 6, 4), false);
    assert.equal(value.canPlace({ ...sofa, rotation: 90 }, 6, 4), true);
    assert.equal(value.canPlace({ ...sofa, rotation: 90 }, 2, 0), false);
    value.furnitureList[0].placed = false;
    assert.equal(value.canPlace({ ...sofa, rotation: 90 }, 2, 0), true);
});
