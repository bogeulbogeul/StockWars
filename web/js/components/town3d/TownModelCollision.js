import { insideTownBoundary } from '../../data/townBoundary.js';
import { createExteriorBuildingBlocker } from './ExteriorBuildingBodies.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// The retained sprite map has different building/pond positions. Its invisible
// footprints must not trap the player in the new 3D art-preview scene.
export function installModelPreviewCollision(controller, footprints) {
    const legacyCanStand = controller.canStand.bind(controller);
    const solidBlocked = createExteriorBuildingBlocker(footprints.map(b=>({
        ...b,minZ:b.minY/GROUND_PROJECTION,maxZ:b.maxY/GROUND_PROJECTION
    })));
    controller.canStand = (x, y) => {
        if (!insideTownBoundary(x, y)) return false;
        if (!document.body.classList.contains('town-model-mode')) return legacyCanStand(x, y);
        if (x < 60 || x > controller.worldWidth - 60 || y < 100 || y > controller.worldHeight - 100) return false;
        return !solidBlocked(x,y);
    };
    controller.modelCollisionReady = true;
}
