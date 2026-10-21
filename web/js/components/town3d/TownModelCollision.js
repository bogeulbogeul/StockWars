import { insideTownBoundary } from '../../data/townBoundary.js';

// The retained sprite map has different building/pond positions. Its invisible
// footprints must not trap the player in the new 3D art-preview scene.
export function installModelPreviewCollision(controller, footprints) {
    const legacyCanStand = controller.canStand.bind(controller);
    controller.canStand = (x, y) => {
        if (!insideTownBoundary(x, y)) return false;
        if (!document.body.classList.contains('town-model-mode')) return legacyCanStand(x, y);
        if (x < 60 || x > controller.worldWidth - 60 || y < 100 || y > controller.worldHeight - 100) return false;
        const radius = 16;
        return !footprints.some(box => x > box.minX - radius && x < box.maxX + radius
            && y > box.minY - radius && y < box.maxY + radius);
    };
}
