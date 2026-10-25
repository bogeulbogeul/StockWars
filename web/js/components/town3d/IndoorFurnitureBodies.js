import { createTownPropBodies } from './TownPropBodies.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_RADIUS } from './CharacterBodies.js';
import { installIndoorWallBodies } from './IndoorWallBodies.js';
import { createJumpBodies, installJumpCollision } from './JumpCollision.js';

// Structural room boundaries/doors keep their existing entrance rules. Flat
// floor coverings and NPCs must not become furniture obstacles.
const architecture = /(^|_)(floor|wall|ceiling|exit|entrance|carpet|mat|tile|skirting|wainscot|molding|trim|window|glazing|mullion|muntin|sill)(_|$)/i;
export function isFurnitureMesh(mesh) {
    for (let node = mesh; node; node = node.parent) {
        if (/character$|somangi-player/.test(node.name)) return false;
        if (!node.visible) return false;
    }
    return !architecture.test(mesh.name) && !/^Corner_Pillar|^Front_Pillar/i.test(mesh.name);
}

export function installIndoorFurnitureBodies(owner, baseCanStand) {
    owner.furnitureBodies = createTownPropBodies(owner.room, 'indoor-furniture', {
        includeMesh: isFurnitureMesh, minHeight: 6
    });
    owner.canStand = (x, z) => baseCanStand(x, z) && !owner.furnitureBodies.some(body =>
        x > body.minX - PLAYER_BODY_RADIUS && x < body.maxX + PLAYER_BODY_RADIUS
        && z > body.minY / GROUND_PROJECTION - PLAYER_BODY_RADIUS
        && z < body.maxY / GROUND_PROJECTION + PLAYER_BODY_RADIUS);
    installIndoorWallBodies(owner, owner.canStand);
    owner.jumpCollisionBodies = createJumpBodies(owner.room, 'indoor-overhead');
    const groundCanStand = owner.canStand;
    const canStand = installJumpCollision(owner.controller,
        (x,y)=>groundCanStand(x,y/GROUND_PROJECTION), owner.jumpCollisionBodies);
    owner.canStand = (x,z)=>canStand(x,z*GROUND_PROJECTION);
}
