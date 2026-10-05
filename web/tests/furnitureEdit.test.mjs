import test from 'node:test';
import assert from 'node:assert/strict';
import { FurnitureEditModal } from '../js/components/FurnitureEditModal.js';
import { officeWallHeight } from '../js/components/office/OfficeOpeningSizing.js';

test('wall decoration height snaps, stays inside wall and commits a vertical-only drag', () => {
    const value = editor();
    const item = { id: 'window', wallFixture: 'isoOfficeWindow', placed: true, gridX: 6, gridY: 1, wallHeight: 76.4 };
    value.furnitureList = [item];
    value.history = [];
    value.stage = { svgStage: { hasPointerCapture: () => false } };
    value.moveDrag = value.renderGrid = value.renderCatalog = value.clearPreview = value.setStatus = () => {};
    value.drag = { id: item.id, pointerId: 1, x: 6, y: 1, targetX: 6, targetY: 1, height: 76.4, targetHeight: 114.6, moved: true };
    value.finishDrag({ pointerId: 1 });
    assert.ok(Math.abs(item.wallHeight - 114.6) < 0.001);
    assert.equal(value.history.length, 1);
    assert.equal(officeWallHeight(item, -100), 0);
    assert.ok(officeWallHeight(item, 1000) <= 270 - 63 - 46.35);
    assert.equal(officeWallHeight({ wallFixture: 'isoOfficeDoor' }, 114.6), 0);
    value.placeFurnitureAt('window', 7, 0);
    assert.ok(Math.abs(item.wallHeight - 114.6) < 0.001);
});

const editor = () => {
    const value = Object.create(FurnitureEditModal.prototype);
    value.gridSize = 8;
    value.furnitureList = [{ id: 'desk', placed: true, gridX: 2, gridY: 2, sizeW: 2, sizeH: 2, rotation: 0 }];
    return value;
};

test('drag release commits once, invalid drops preserve placement, and clicks do not move', () => {
    const value = editor();
    value.history = [];
    value.stage = { svgStage: { hasPointerCapture: () => false } };
    value.moveDrag = value.renderGrid = value.renderCatalog = value.clearPreview = value.setStatus = () => {};
    value.callbacks = {};
    const release = (x, y, moved = true) => {
        value.drag = { id: 'desk', pointerId: 1, x: 2, y: 2, targetX: x, targetY: y, moved };
        value.finishDrag({ pointerId: 1 });
    };
    release(3, 2, false);
    assert.equal(value.furnitureList[0].gridX, 2);
    assert.equal(value.history.length, 0);
    release(8, 2);
    assert.equal(value.furnitureList[0].gridX, 2);
    assert.equal(value.history.length, 0);
    release(3, 2);
    assert.equal(value.furnitureList[0].gridX, 3);
    assert.equal(value.history.length, 1);
    assert.equal(value.drag, null);
});

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
