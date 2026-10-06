// Approximate vertical body edges measured on the current PNGs. These exclude
// perspective depth, transparent padding and objects sitting on the counter.
// Ratios are staging choices relative to Vivian's 90-unit standing height.
export const VIVIAN_HEIGHT = 90;
export const FURNITURE_HEIGHTS = {
    counter: {sourceEdge:330, ratio:.5},
    goods: {sourceEdge:500, ratio:.7},
    fridge: {sourceEdge:790, ratio:1.2},
    papers: {sourceEdge:350, ratio:.5},
    baskets: {sourceEdge:450, ratio:.25},
};
export function sizeFurnitureForVivian(sprites, cameraScale) {
    for (const [id, {sourceEdge, ratio}] of Object.entries(FURNITURE_HEIGHTS)) {
        const sprite=sprites[id];
        const currentHeight=sourceEdge*sprite.matrix[3]*sprite.size[1]/sprite.crop[3];
        const factor=VIVIAN_HEIGHT*cameraScale*ratio/currentHeight;
        sprite.size=sprite.size.map(value=>value*factor);
    }
}

// Fit measured contact corners in grid space, not the image's bounding box.
// Uniform scaling preserves the artwork; any spare depth stays behind the
// furniture, while the two front contact edges meet the grid boundary.
export function fitFurnitureToGrid(sprites, grid, geometry) {
    const footprints={fridge:[1,1],counter:[1,3],goods:[1,3],papers:[3,1],baskets:[1,1]};
    for(const [id,[w,h]] of Object.entries(footprints)) {
        const s=sprites[id];
        let corners;
        if(id==='goods') corners=[[146,1060],[430,1223],[1160,862]];
        else {
            const {bounds:[left,,right,bottom],peak,slopes:[positive,negative]}=geometry[id];
            corners=[[left,bottom-positive*(peak-left)],[peak,bottom],[right,bottom+negative*(right-peak)]];
        }
        corners.push([corners[0][0]+corners[2][0]-corners[1][0],corners[0][1]+corners[2][1]-corners[1][1]]);
        const [a,b,c,d]=s.matrix;
        const projected=corners.map(([x,y])=>{
            const px=a*x+c*y,py=b*x+d*y;
            return {u:(px/grid.halfWidth+py/grid.halfHeight)/2,v:(py/grid.halfHeight-px/grid.halfWidth)/2};
        });
        const minU=Math.min(...projected.map(p=>p.u)),maxU=Math.max(...projected.map(p=>p.u));
        const minV=Math.min(...projected.map(p=>p.v)),maxV=Math.max(...projected.map(p=>p.v));
        // Small props need only fit inside a cell, not fill it like cabinetry.
        const propLimit=id==='baskets' ? (VIVIAN_HEIGHT*.25*grid.halfWidth/33.75)/(450*d) : Infinity;
        const scale=Math.min(w/(maxU-minU),h/(maxV-minV),propLimit);
        s.size=[s.crop[2]*scale,s.crop[3]*scale];
        const x=(maxU-maxV)*grid.halfWidth,y=(maxU+maxV)*grid.halfHeight;
        s.anchor=[(x-s.crop[0])/s.crop[2],(y-s.crop[1])/s.crop[3]];
        s.gridFit={w,h,corners:projected.map(p=>({u:(p.u-maxU)*scale+w,v:(p.v-maxV)*scale+h}))};
    }
}
