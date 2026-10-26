import { quickFade } from '../QuickTravel.js';
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
    await quickFade(async () => { moa.root.position.set(goal.x, c.supportHeightAt?.(goal.x, goal.y) || 0, goal.y / P); });
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
