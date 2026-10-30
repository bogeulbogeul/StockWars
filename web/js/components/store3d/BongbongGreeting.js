import { setUprightFacing, turnUprightFacing } from '../town3d/SomangiFacing.js';
import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';
import { VIVIAN_ROOM_RATIO as R } from '../../data/vivianModelRoom.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { tourRoute, routeLength, routePoint } from '../../app/exhibition/TourRoute.js';
import { roundTourRoute } from '../../app/exhibition/TourCurve.js';
import { bongbongWalkAction } from './BongbongWalk.js';

export function shopkeeperGreetingRoute(start, goal, furniture, radius, isClear = () => true) {
    const shift = p => ({ x: p.x + 500, y: (p.z + 500) * P });
    const legal = (x, y) => {
        x -= 500; const z = y / P - 500;
        return Math.abs(x) <= 400 * R - radius && z >= -300 * R + radius && z <= 300 * R - radius
            && !furniture.some(b => x > b.minX - radius && x < b.maxX + radius
                && z > b.minY / P - radius && z < b.maxY / P + radius) && isClear(x, z);
    };
    return roundTourRoute(tourRoute(shift(start), shift(goal), legal, { step: 8 }), legal)
        .map(p => ({ x: p.x - 500, y: p.y - 500 * P }));
}

export async function greetBongbong(scene) {
    scene.cancelGreeting?.();
    const token = {}; scene.greetingToken = token;
    const root = scene.shopkeeper, player = scene.player, c = scene.controller;
    const action = bongbongWalkAction(root, player), mixer = root.userData.greetingMixer;
    const start = root.getWorldPosition(new Vector3());
    const visitor = new Vector3(c.charPosX, 0, c.charPosY / P);
    const arm = root.getObjectByName('ArmR') || root.getObjectByName('Arm.R');
    const armRest = arm?.quaternion.clone(), twist = new Quaternion();
    const zAxis = new Vector3(0, 0, 1), xAxis = new Vector3(1, 0, 0);
    let cancelled = false;
    const cleanup = () => {
        cancelled = true; action.stop();
        if (arm) arm.quaternion.copy(armRest);
    };
    scene.cancelGreeting = cleanup;
    const motion = (duration, update) => new Promise(resolve => {
        let previous, elapsed = 0;
        const tick = now => {
            if (cancelled || !scene.active || scene.greetingToken !== token) { resolve(); return; }
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(1, elapsed / Math.max(duration, .01)); update(t, dt);
            if (t === 1) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    scene.greetingActive = true; c.keysHeld.clear(); c.isMoving = false;
    root.userData.greetingPhase = 'approaching';
    try {
        if (Math.hypot(start.x - visitor.x, start.z - visitor.z) > 125) {
            const goal = { x: visitor.x - 65, z: visitor.z - 80 };
            const route = shopkeeperGreetingRoute({ x: start.x, z: start.z }, goal,
                scene.furnitureBodies || [], root.userData.rigidBody?.radius || 36);
            const length = routeLength(route); action.reset().play();
            await motion(length / 135, (t, dt) => {
                const d = length * t, p = routePoint(route, d), ahead = routePoint(route, Math.min(length, d + 15));
                root.position.copy(root.parent.worldToLocal(new Vector3(p.x, 0, p.y / P)));
                if (d < length) {
                    const yaw = Math.atan2(ahead.x - p.x, (ahead.y - p.y) / P);
                    turnUprightFacing(root, yaw, 5 * dt);
                }
                mixer.update(dt);
            });
            action.stop();
        }
        if (cancelled) return;
        const position = root.getWorldPosition(new Vector3());
        setUprightFacing(root, Math.atan2(visitor.x - position.x, visitor.z - position.z));
        player.faceTarget(root); root.userData.greetingPhase = 'waving';
        await motion(.95, t => {
            if (!arm) return;
            const raised = Math.sin(Math.PI * t) * 1.2 * (arm.position.x < 0 ? -1 : 1);
            arm.quaternion.copy(armRest).multiply(twist.setFromAxisAngle(zAxis, raised));
            arm.quaternion.multiply(twist.setFromAxisAngle(xAxis, Math.sin(t * Math.PI * 6) * .18 * Math.sin(Math.PI * t)));
        });
        if (cancelled) return;
        root.userData.greetingPhase = 'greeted';
    } finally {
        if (scene.greetingToken === token) { cleanup(); scene.greetingActive = false; scene.cancelGreeting = null; }
    }
}
