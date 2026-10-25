import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { townSeatSurfaces } from '../../components/town3d/SeatSurfaces.js';
import { applySeatPose } from '../../components/town3d/SeatPose.js';
import { PLAYER_BODY_RADIUS } from '../../components/town3d/CharacterBodies.js';
import { createTourPaths } from './TourPaths.js';
import { tourDeparture } from './TourDeparture.js';
import { findTourDetour } from './TourDetour.js';
import { routeLength, routePoint, resolveTourStop } from './TourRoute.js';
import { animate } from './HandoffMotion.js';

// Independent departure: the player can use the phone and walk elsewhere.
export async function sendMoaToPlazaBench(scenes) {
    const journey = {}; scenes.moaBenchJourneyToken = journey;
    await scenes.ready;
    const town = scenes.townModelScene, moa = town.sleepingAnna;
    moa.root.visible = true;
    const c = scenes.townStage.playerController;
    const seat = townSeatSurfaces(town.scene).find(s => s.id === 'plaza_bench_west-0');
    if (!seat) throw new Error('광장 벤치를 찾지 못했어요.');
    town.player.holdFacing(); moa.faceTarget(null); await moa.setMood('calm', 'smile');
    const front = seat.center.clone().addScaledVector(seat.forward, 110);
    const goal = resolveTourStop({ x: front.x, y: front.z * P }, c.sceneryCanStand);
    const paths = createTourPaths(), clearance = PLAYER_BODY_RADIUS + (moa.root.userData.rigidBody?.radius || 42) + 8;
    let { route } = tourDeparture({ x: moa.root.position.x, y: moa.root.position.z * P }, goal, c, paths, clearance);
    // Connect the paved route's final anchor to the bench approach.
    route.push(goal);
    const action = moa.mixer.clipAction(moa.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
    let progress = 0, length = routeLength(route), previous, cooldown = 0;
    action.reset().play(); moa.root.userData.tourWalking = true;
    try {
        await new Promise(resolve => {
            const tick = now => {
                if (journey.cancelled) { resolve(); return; }
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; cooldown = Math.max(0, cooldown - dt);
                let next = Math.min(length, progress + 180 * dt);
                let point = routePoint(route, next);
                const gap = p => Math.hypot(p.x - c.charPosX, (p.y - c.charPosY) / P);
                if (gap(point) < clearance && gap(point) < gap(routePoint(route, progress))) {
                    if (!cooldown) {
                        const detour = findTourDetour(route, progress, c, paths, clearance);
                        cooldown = .6;
                        if (detour) { route = detour; progress = 0; length = routeLength(route); }
                    }
                    next = progress; point = routePoint(route, progress); action.paused = true;
                } else { action.paused = false; progress = next; }
                moa.root.position.set(point.x, c.supportHeightAt?.(point.x, point.y) || 0, point.y / P);
                const ahead = routePoint(route, Math.min(length, progress + 24));
                if (progress < length) {
                    const yaw = Math.atan2(ahead.x - point.x, (ahead.y - point.y) / P);
                    const delta = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                    moa.root.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, delta));
                    requestAnimationFrame(tick);
                } else resolve();
            };
            requestAnimationFrame(tick);
        });
    } finally { action.stop(); moa.root.userData.tourWalking = false; }
    if (journey.cancelled) return;
    const start = moa.root.position.clone(), rotation = moa.root.quaternion.clone();
    const bones = ['LegL', 'LegR'].map(name => moa.root.getObjectByName(name));
    const rest = bones.map(b => ({ p: b.position.clone(), q: b.quaternion.clone() }));
    const restore = applySeatPose({ root: moa.root, variants: new Map([['walk', { model: moa.root }]]), setState() {} }, seat);
    if (!restore) throw new Error('모아의 벤치 착석 위치를 찾지 못했어요.');
    scenes.moaPlazaRestore = restore;
    const end = moa.root.position.clone(), turn = moa.root.quaternion.clone();
    const posed = bones.map(b => ({ p: b.position.clone(), q: b.quaternion.clone() }));
    await animate(.9, t => {
        if (journey.cancelled) return;
        moa.root.position.lerpVectors(start, end, t); moa.root.quaternion.slerpQuaternions(rotation, turn, t);
        bones.forEach((b, i) => { b.position.lerpVectors(rest[i].p, posed[i].p, t); b.quaternion.slerpQuaternions(rest[i].q, posed[i].q, t); });
    });
    if (!journey.cancelled) scenes.moaRestingAtPlaza = true;
}
