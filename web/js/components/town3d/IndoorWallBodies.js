import { createTownPropBodies } from './TownPropBodies.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_RADIUS } from './CharacterBodies.js';
import { HOME_MODEL_SCALE, HOME_ROOM_BOUNDS } from '../../data/homeModelRoom.js';

export function isWallMesh(mesh) {
    // Wall-mounted flowers/lamps are decoration, not the structural shell.
    return /(^Wall_(Back|Left|Right)$)|(^|_)(Back_Wall|Side_Wall|Closed_Side_Wall|Return_Wall)(\.|$)/i.test(mesh.name)
        || /(^|_)(Skirting|Wainscot)(_|\.|$)|^(Corner|Front)_Pillar/i.test(mesh.name);
}

export function installIndoorWallBodies(owner, baseCanStand) {
    const pieces = createTownPropBodies(owner.room, 'indoor-wall', {
        includeMesh: isWallMesh, minHeight: 6, splitTriangles: true
    });
    // Deduplicate flat faces; preserve separate sections around real openings.
    const unique = new Map(pieces.map(b => [
        [b.minX,b.maxX,b.minY,b.maxY].map(n=>n.toFixed(3)).join(','), b
    ]));
    owner.wallBodies = [...unique.values()];
    // The house's front wall is hidden for the cutaway camera, but its two
    // solid sections still collide. The central entrance remains open.
    if (owner.room.getObjectByName('Wall_Front')) {
        const b = HOME_ROOM_BOUNDS, s = HOME_MODEL_SCALE;
        for (const [minX,maxX] of [[b.minX*s,b.doorLeft*s],[b.doorRight*s,b.maxX*s]]) {
            owner.wallBodies.push({id:'indoor-wall',mesh:'Wall_Front',type:'static',
                minX,maxX,minY:(b.maxZ-b.wallThickness)*s*GROUND_PROJECTION,
                maxY:b.maxZ*s*GROUND_PROJECTION});
        }
    }
    // Limit movement queries to nearby static sections, even for detailed
    // rounded wainscoting containing thousands of source triangles.
    const cells = new Map(), cellSize = 128;
    for (const body of owner.wallBodies) {
        body.minZ = body.minY / GROUND_PROJECTION;
        body.maxZ = body.maxY / GROUND_PROJECTION;
        for (let x = Math.floor((body.minX-PLAYER_BODY_RADIUS)/cellSize);
            x <= Math.floor((body.maxX+PLAYER_BODY_RADIUS)/cellSize); x++) {
            for (let z = Math.floor((body.minZ-PLAYER_BODY_RADIUS)/cellSize);
                z <= Math.floor((body.maxZ+PLAYER_BODY_RADIUS)/cellSize); z++) {
                const key = `${x},${z}`;
                if (!cells.has(key)) cells.set(key, []);
                cells.get(key).push(body);
            }
        }
    }
    owner.canStand = (x,z) => baseCanStand(x,z) && !(cells.get(
        `${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`) || []).some(b => {
        // Circle against actual wall pieces permits rounded corner sliding.
        const nx=Math.max(b.minX,Math.min(b.maxX,x));
        const nz=Math.max(b.minZ,Math.min(b.maxZ,z));
        return Math.hypot(x-nx,z-nz) < PLAYER_BODY_RADIUS;
    });
    owner.controller.canStand = (x,y) => owner.canStand(x,y/GROUND_PROJECTION);
    owner.controller.indoorCollisionReady = true;
}
