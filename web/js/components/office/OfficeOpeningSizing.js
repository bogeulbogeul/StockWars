// Provisional proportions against Anna's 90-unit body height, excluding PNG padding.
const characterHeight = 90;
function opening(heightRatio, sourceHeight, sourceWidth, anchorX, anchorY, sillHeight = 0) {
    const height = characterHeight * heightRatio;
    const scale = height / sourceHeight;
    const width = sourceWidth * scale;
    const rise = width * 19.1 / 33.75;
    return Object.freeze({ height, width, scale, sillHeight,
        artworkTransform: `translate(${-anchorX * scale} ${-anchorY * scale}) scale(${scale})`,
        selectionPoints: `0,0 ${width},${-rise} ${width},${-rise - height} 0,${-height}` });
}
export const OFFICE_OPENINGS = Object.freeze({
    door: opening(1.3, 1162, 376, 320, 1426),
    // Three wall columns wide; preserve the PNG aspect ratio (~two rows tall).
    window: opening((3 * 33.75 * 600 / 780) / characterHeight, 600, 780, 270, 1050, 76.4)
});
// Wall rows match the editor's horizontal grid lines. Doors stay grounded.
export function officeWallHeight(item, requested = item.wallHeight) {
    if (item.wallFixture === 'isoOfficeDoor') return 0;
    const step = 38.2;
    const maxRow = Math.floor((270 - OFFICE_OPENINGS.window.height - OFFICE_OPENINGS.window.width * 19.1 / 33.75) / step);
    const height = Number.isFinite(requested) ? requested : OFFICE_OPENINGS.window.sillHeight;
    return Math.max(0, Math.min(maxRow, Math.round(height / step))) * step;
}
