import { ROOM_GRID } from './IsometricRoomGrid.js';

// Fit both measured source edge slopes to the floor axes, preserving verticals.
// The viewport encloses the ENTIRE transformed source canvas, not an estimated crop.
export function projectSprite({source=[1254,1254],bounds,peak,slopes,width,wallAnchor}) {
    const [left,top,right,bottom]=bounds, [positive,negative]=slopes;
    const ratio=ROOM_GRID.halfHeight/ROOM_GRID.halfWidth;
    const scale=width/(right-left);
    const d=2*ratio/(positive-negative), b=ratio-d*positive;
    const minY=Math.min(0,b*source[0]);
    const maxY=Math.max(0,b*source[0])+d*source[1];
    const centre=wallAnchor || [(left+right)/2,
        (bottom-positive*(peak-left)+bottom+negative*(right-peak))/2];
    return {source, crop:[0,minY,source[0],maxY-minY],
        size:[source[0]*scale,(maxY-minY)*scale],
        anchor:[centre[0]/source[0],(b*centre[0]+d*centre[1]-minY)/(maxY-minY)],
        transform:`matrix(1 ${b} 0 ${d} 0 0)`, matrix:[1,b,0,d,0,0]};
}
