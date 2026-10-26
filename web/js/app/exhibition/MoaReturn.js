import { GROUND_PROJECTION as P, TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { createTourPaths } from './TourPaths.js';
import { tourDeparture } from './TourDeparture.js';
import { findTourDetour } from './TourDetour.js';
import { routeLength, routePoint, resolveTourStop } from './TourRoute.js';
import { createInformationDoor } from './InformationDoor.js';
import { walkMoaThroughDoor } from './DoorwayMoaWalk.js';
import { standPlazaMoa } from './PlazaMoaStand.js';

export function startMoaReturn(scenes) {
    scenes.moaReturnJourney ||= returnMoa(scenes);
    return scenes.moaReturnJourney;
}
async function returnMoa(scenes) {
    await scenes.ready;
    const token = {}; scenes.moaReturnToken = token;
    const town = scenes.townModelScene, moa = town.sleepingAnna, c = scenes.townStage.playerController;
    if (moa.root.userData.seated) await standPlazaMoa(scenes);
    town.player.holdFacing(); moa.faceTarget(null); await moa.setMood('calm', 'smile');
    const definition = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
    const door = createInformationDoor(town.scene.getObjectByName(definition.id));
    const goal = resolveTourStop({ x: door.center.x, y: definition.y + 100 }, c.sceneryCanStand);
    const paths = createTourPaths(), clearance = 92;
    let { route } = tourDeparture({ x: moa.root.position.x, y: moa.root.position.z * P }, goal, c, paths, clearance);
    route.push(goal);
    let length = routeLength(route), progress = 0, previous, cooldown = 0;
    const action = moa.mixer.clipAction(moa.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
    action.reset().play(); moa.root.userData.tourWalking = true; scenes.moaRestingAtPlaza = false;
    try {
        await new Promise(resolve => {
            const tick = now => {
                if (token.cancelled) { resolve(); return; }
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; cooldown = Math.max(0, cooldown - dt);
                let next = Math.min(length, progress + 180 * dt), point = routePoint(route, next);
                const gap = p => Math.hypot(p.x - c.charPosX, (p.y - c.charPosY) / P);
                if (gap(point) < clearance && gap(point) < gap(routePoint(route, progress))) {
                    if (!cooldown) {
                        const detour = findTourDetour(route, progress, c, paths, clearance); cooldown = .6;
                        if (detour) { route = detour; progress = 0; length = routeLength(route); }
                    }
                    point = routePoint(route, progress); action.paused = true;
                } else { action.paused = false; progress = next; }
                moa.root.position.set(point.x, c.supportHeightAt?.(point.x, point.y) || 0, point.y / P);
                const ahead = routePoint(route, Math.min(length, progress + 24));
                if (progress < length) {
                    const yaw = Math.atan2(ahead.x - point.x, (ahead.y - point.y) / P);
                    const delta = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                    moa.root.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, delta)); requestAnimationFrame(tick);
                } else resolve();
            };
            requestAnimationFrame(tick);
        });
    } finally { action.stop(); moa.root.userData.tourWalking = false; }
    if (token.cancelled) return;
    await door.open(); await walkMoaThroughDoor(moa, door, c); await door.close();
    if (token.cancelled) return;
    const room = await scenes.prepareRoom('information'); await room.room.userData.seatMoa();
    room.room.userData.moa.root.visible = true; scenes.moaReturnedToInformation = true;
}
