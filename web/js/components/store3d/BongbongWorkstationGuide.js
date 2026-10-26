import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { shopkeeperGreetingRoute } from './BongbongGreeting.js';
import { bongbongWalkAction } from './BongbongWalk.js';
import { routeLength, routePoint } from '../../app/exhibition/TourRoute.js';
import { waitForWorkstationRoute } from './WorkstationRouteWait.js';

export function guideRouteTo(scene, goal) {
    const root = scene.shopkeeper, start = root.getWorldPosition(new Vector3());
    const radius = root.userData.rigidBody?.radius || 36, c = scene.controller;
    const gap = Math.hypot(start.x - c.charPosX, start.z - c.charPosY / P);
    const clearance = Math.max(0, Math.min(radius + 46, gap - .5));
    return shopkeeperGreetingRoute(start, goal, scene.furnitureBodies || [], radius,
        (x, z) => Math.hypot(x - c.charPosX, z - c.charPosY / P) >= clearance);
}

export function workstationGuideRoute(scene, bounds) {
    const root = scene.shopkeeper;
    const radius = root.userData.rigidBody?.radius || 36;
    const c = scene.controller;
    let failure;
    for (const [x, z] of [[bounds.min.x - radius - 12, (bounds.min.z + bounds.max.z) / 2],
        [bounds.min.x - radius - 20, bounds.max.z - 10],
        [bounds.min.x + 95, bounds.max.z + 85]]) {
        if (Math.hypot(x - c.charPosX, z - c.charPosY / P) < radius + 45) continue;
        try { return guideRouteTo(scene, { x, z }); }
        catch (error) { failure = error; }
    }
    throw failure || new Error('작업대 옆에 안내할 공간을 찾지 못했어요.');
}

export async function introducePackingWorkstation(scene, bounds) {
    if (scene.worktopIntroduced) return true;
    const root = scene.shopkeeper, player = scene.player, token = {};
    const action = bongbongWalkAction(root, player), mixer = root.userData.greetingMixer;
    const route = await waitForWorkstationRoute(scene, () => workstationGuideRoute(scene, bounds));
    if (!route) return false;
    const arm = root.getObjectByName('ArmR') || root.getObjectByName('Arm.R');
    const rest = arm?.quaternion.clone(), turn = new Quaternion();
    let cancelled = false;
    const cleanup = () => { cancelled = true; action.stop(); if (arm) arm.quaternion.copy(rest); };
    const motion = (duration, update) => new Promise(resolve => {
        let previous, elapsed = 0;
        const tick = now => {
            if (cancelled || !scene.active) { resolve(); return; }
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt; update(Math.min(1, elapsed / duration), dt);
            if (elapsed >= duration) resolve(); else requestAnimationFrame(tick);
        }; requestAnimationFrame(tick);
    });
    scene.greetingToken = token; scene.cancelGreeting = cleanup; scene.greetingActive = true;
    scene.workstationGuideActive = true;
    scene.controller.keysHeld.clear(); player.holdFacing();
    const walk = async route => {
        const length = routeLength(route); action.reset().play();
        await motion(Math.max(.01, length / 135), (t, dt) => {
            const d = length * t, point = routePoint(route, d), ahead = routePoint(route, Math.min(length, d + 15));
            root.position.copy(root.parent.worldToLocal(new Vector3(point.x, 0, point.y / P)));
            if (d < length) {
                const yaw = Math.atan2(ahead.x - point.x, (ahead.y - point.y) / P);
                root.rotation.y += MathUtils.clamp(Math.atan2(Math.sin(yaw - root.rotation.y), Math.cos(yaw - root.rotation.y)), -5 * dt, 5 * dt);
            }
            mixer.update(dt);
        }); action.stop();
    };
    root.userData.workstationPhase = 'walking';
    try {
        await walk(route);
        action.stop(); if (cancelled || !scene.active) return false;
        const position = root.getWorldPosition(new Vector3());
        root.rotation.y = Math.atan2((bounds.min.x + bounds.max.x) / 2 - position.x, bounds.min.z - position.z);
        root.userData.workstationPhase = 'pointing';
        await motion(.8, t => { if (arm) arm.quaternion.copy(rest).multiply(turn.setFromAxisAngle(new Vector3(1, 0, 0), -.9 * Math.sin(Math.PI * t))); });
        if (cancelled || !scene.active) return false;
        if (route.at(-1).y / P > bounds.max.z) {
            root.userData.workstationPhase = 'clearing'; player.holdFacing();
            await walk([...route].reverse());
            if (cancelled || !scene.active) return false;
        }
        scene.worktopIntroduced = true; root.userData.workstationPhase = 'introduced'; return true;
    } finally {
        cleanup();
        if (scene.greetingToken === token) {
            player.holdFacing(); scene.greetingActive = false; scene.workstationGuideActive = false; scene.cancelGreeting = null;
        }
    }
}
