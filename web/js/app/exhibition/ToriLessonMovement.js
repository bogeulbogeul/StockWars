import { AnimationMixer, Vector3, MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { roomWalkingRoute, walkRoute } from '../OnFootNavigation.js';

export function lessonActorLegal(scene, root, passageSide = 0) {
    const radius = root.userData.rigidBody?.radius || 36;
    return (x, z) => {
        if (passageSide && Math.abs(z + 100) <= 12 && x * passageSide >= 370
            && x * passageSide <= scene.layout.width / 2 - scene.layout.radius) return true;
        if (Math.abs(x) > scene.layout.width / 2 - radius || Math.abs(z) > scene.layout.depth / 2 - radius) return false;
        return !(scene.furnitureBodies || []).some(b => x > b.minX - radius && x < b.maxX + radius
            && z > b.minY / P - radius && z < b.maxY / P + radius)
            && !(scene.wallBodies || []).some(b => {
                const nx = MathUtils.clamp(x, b.minX, b.maxX), nz = MathUtils.clamp(z, b.minZ, b.maxZ);
                return Math.hypot(x - nx, z - nz) < radius;
            });
    };
}
export async function walkTori(scene, root, destination, passageSide = 0) {
    const start = root.getWorldPosition(new Vector3());
    const legal = lessonActorLegal(scene, root, passageSide), c = scene.controller;
    const clearance = (root.userData.rigidBody?.radius || 36) + 46;
    const avoidPlayer = scene.active && Math.hypot(start.x - c.charPosX, start.z - c.charPosY / P) >= clearance;
    const route = roomWalkingRoute({ controller: { charPosX: start.x, charPosY: start.z * P } },
        destination, (x, z) => legal(x, z) && (!avoidPlayer || Math.hypot(x - c.charPosX, z - c.charPosY / P) >= clearance));
    let mixer = root.userData.lessonMixer;
    if (!mixer) {
        mixer = root.userData.lessonMixer = new AnimationMixer(root.children[0]);
        root.userData.lessonWalk = mixer.clipAction(scene.player.variants.get('walk').action.getClip().clone());
    }
    const action = root.userData.lessonWalk; action.reset().play();
    scene.player.holdFacing(); root.userData.lessonWalking = true;
    try { await walkRoute(route, (point, ahead, dt) => {
        root.position.copy(root.parent.worldToLocal(new Vector3(point.x, 0, point.y / P)));
        const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
        if (Math.hypot(dx, dz) > .01) root.rotation.y = Math.atan2(dx, dz);
        mixer.update(dt);
    }, 135); } finally { action.stop(); root.userData.lessonWalking = false; }
}

export async function followTori(scene, root, title) {
    const { createTourPlayerControls } = await import('./TourPlayerControls.js');
    const { createMoaMovementGuide } = await import('../../components/town3d/MoaMovementGuide.js');
    const guide = createMoaMovementGuide(scene.layer, { follow: true });
    guide.update({ visible: true, text: title });
    let ready = false, previous;
    const controls = createTourPlayerControls(scene.controller, { onInteract: () => {
        const p = root.getWorldPosition(new Vector3()), c = scene.controller;
        if (Math.hypot(c.charPosX - p.x, c.charPosY / P - p.z) < 160) ready = true;
    } });
    const start = { x: scene.controller.charPosX, y: scene.controller.charPosY };
    try { await new Promise(resolve => {
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now;
            // These controls use the same player body collision as ordinary rooms.
            controls.update(dt);
            if (Math.hypot(scene.controller.charPosX - start.x, scene.controller.charPosY - start.y) > .5) guide.update({ visible: false });
            if (ready) resolve(); else requestAnimationFrame(tick);
        }; requestAnimationFrame(tick);
    }); } finally { controls.dispose(); guide.dispose(); }
}
