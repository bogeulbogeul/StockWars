import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICE_GRID, OFFICE_GRID_ANGLE, officeGridToScreen, officeFootprintPoints, officeAssetPlacement } from '../js/components/office/OfficeGrid.js';
import { DEFAULT_FURNITURE_CATALOG } from '../js/data/furnitureData.js';
import { generateFloorTilesSvg } from '../js/components/office/OfficeSvgTemplate.js';

test('floor tiles and footprints share the office projection', () => {
    assert.deepEqual(officeGridToScreen(0,0), {x:500,y:320});
    assert.deepEqual(officeGridToScreen(1,0), {x:466.25,y:339.1});
    assert.ok(Math.abs(OFFICE_GRID_ANGLE - 29.5066465804) < 1e-9);
    assert.ok(generateFloorTilesSvg().includes(`points="${officeFootprintPoints(4,5)}"`));
});
test('turned PNG uses swapped footprint and mirrored ground anchor without distortion', () => {
    const item = { ...DEFAULT_FURNITURE_CATALOG[0], rotation: 90 };
    const a = item.asset, p = officeAssetPlacement(item);
    const anchor = officeGridToScreen(item.gridX + item.sizeH - a.insetX, item.gridY + item.sizeW - a.insetY);
    assert.equal(p.mirror, true);
    assert.ok(Math.abs(p.x + (a.width-a.anchorX)*a.scale - anchor.x) < 1e-9);
    assert.ok(Math.abs(p.y + a.anchorY*a.scale - anchor.y) < 1e-9);
    assert.equal(p.width, a.width*a.scale);
    assert.equal(p.height, a.height*a.scale);
});
test('default furniture cells do not overlap and image anchors preserve aspect ratio', () => {
    const occupied = new Set();
    for (const item of DEFAULT_FURNITURE_CATALOG.filter(item => !item.wallFixture)) {
        assert.ok(item.gridX >= 0 && item.gridY >= 0);
        assert.ok(item.gridX+item.sizeW <= OFFICE_GRID.size && item.gridY+item.sizeH <= OFFICE_GRID.size);
        for (let x=item.gridX;x<item.gridX+item.sizeW;x++) for (let y=item.gridY;y<item.gridY+item.sizeH;y++) {
            const key = `${x},${y}`; assert.ok(!occupied.has(key)); occupied.add(key);
        }
        const a=item.asset, p=officeAssetPlacement(item);
        const anchor=officeGridToScreen(item.gridX+item.sizeW-a.insetX,item.gridY+item.sizeH-a.insetY);
        assert.ok(a.insetX > 0 && a.insetX < item.sizeW && a.insetY > 0 && a.insetY < item.sizeH);
        assert.ok(Math.abs(p.x+a.anchorX*a.scale-anchor.x)<1e-9);
        assert.ok(Math.abs(p.y+a.anchorY*a.scale-anchor.y)<1e-9);
        assert.ok(Math.abs(p.width/p.height-a.width/a.height)<1e-9);
    }
    assert.equal(occupied.size,17);
});
