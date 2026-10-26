import { Box3, Group, Vector3, MathUtils } from '../../../vendor/three/three.module.js';
import { createDoorwayBlackout } from '../../components/town3d/DoorwayBlackout.js';

export function createInformationDoor(building, { id = 'information', panelName = 'Central_Wood_Door',
    isPart = part => /^Door_(Brass_Hinge|Continuous_Panel_Moulding|Recessed_Panel)/.test(part.name) || part.name === 'Brass_Handle',
    approachDistance = 100, hingeName = 'Door_Brass_Hinge', darkFill = () => false } = {}) {
    const key = `${id}Door`;
    if (building[key]) return building[key];
    const panel = building.getObjectByName(panelName);
    if (!panel) throw new Error('안내소 문을 찾지 못했어요.');
    const hinge = building.getObjectByName(hingeName);
    if (!hinge) throw new Error(`문 경첩을 찾지 못했어요: ${hingeName}`);
    building.updateMatrixWorld(true);
    const box = new Box3().setFromObject(panel), center = box.getCenter(new Vector3());
    // The authored hinge origin is the pin axis, not the edge of the door panel.
    const hingePosition = building.worldToLocal(hinge.getWorldPosition(new Vector3()));
    const direction = hingePosition.x > building.worldToLocal(center.clone()).x ? 1 : -1;
    const panelMeshes = new Set(); panel.traverse(part => { if (part.isMesh) panelMeshes.add(part); });
    const darkMeshes = new Set(panelMeshes);
    building.traverse(part => { if (part.isMesh && darkFill(part)) darkMeshes.add(part); });
    const inside = createDoorwayBlackout(building, [panel], {
        name: `${id}-door-dark-interior`, frontParts: [...darkMeshes]
    });
    const pivot = new Group(); pivot.name = `${id}-opening-door`;
    pivot.position.copy(hingePosition);
    building.add(pivot);
    const parts = [];
    building.traverse(part => {
        if (part.isMesh && (panelMeshes.has(part) || isPart(part))) parts.push(part);
    });
    for (const part of parts) { part.userData.dynamicDoor = true; pivot.attach(part); }
    const animate = (target, duration = .55) => new Promise(resolve => {
        const start = pivot.rotation.y; let elapsed = 0, previous;
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(elapsed / duration, 1), eased = t * t * (3 - 2 * t);
            pivot.rotation.y = MathUtils.lerp(start, target, eased);
            inside.visible = Math.abs(pivot.rotation.y) > .001;
            if (t === 1) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    building[key] = { center, width: box.max.x - box.min.x, floorY: box.min.y, approachDistance,
        open: () => Promise.resolve(), close: () => Promise.resolve() };
    return building[key];
}
