// Current BasicRoom projection in SVG viewBox units, not a global room standard.
export const OFFICE_GRID = Object.freeze({ size: 8, x: 500, y: 320, halfWidth: 33.75, halfHeight: 19.1 });
export const OFFICE_GRID_ANGLE = Math.atan2(OFFICE_GRID.halfHeight, OFFICE_GRID.halfWidth) * 180 / Math.PI;
export function officeGridToScreen(x, y) {
    return { x: OFFICE_GRID.x + (y - x) * OFFICE_GRID.halfWidth,
        y: OFFICE_GRID.y + (x + y) * OFFICE_GRID.halfHeight };
}
export function officeFootprintPoints(x, y, w = 1, h = 1) {
    return [[x,y], [x,y+h], [x+w,y+h], [x+w,y]].map(([gx,gy]) => {
        const p = officeGridToScreen(gx,gy); return `${p.x},${p.y}`;
    }).join(' ');
}
export function officeAssetPlacement(item) {
    const a = item.asset;
    const turned = item.rotation % 180 !== 0;
    const w = turned ? item.sizeH : item.sizeW;
    const h = turned ? item.sizeW : item.sizeH;
    const anchor = officeGridToScreen(item.gridX + w - a.insetX,
        item.gridY + h - a.insetY);
    const mirror = turned && a.rotationMode === 'mirror';
    const anchorX = mirror ? a.width - a.anchorX : a.anchorX;
    return { x: anchor.x - anchorX * a.scale, y: anchor.y - a.anchorY * a.scale,
        width: a.width * a.scale, height: a.height * a.scale, mirror };
}
