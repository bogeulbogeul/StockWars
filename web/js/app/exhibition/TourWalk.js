import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { faceConversation } from '../../components/town3d/ConversationFacing.js';
import { routeLength, routePoint, resolveTourStop } from './TourRoute.js';
import { createTourPaths } from './TourPaths.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { PLAYER_BODY_RADIUS } from '../../components/town3d/CharacterBodies.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { tourDeparture } from './TourDeparture.js';
import { findTourDetour } from './TourDetour.js';
import { MathUtils } from '../../../vendor/three/three.module.js';
import { createTourFollowReminder } from './TourFollowReminder.js';
import { reviewTravelWait } from './ReviewTravel.js';

export async function walkVillageTour(scenes, destination, { requireInteraction = true } = {}) {
    await scenes.ready;
    const scene = scenes.townModelScene, player = scene.player, moa = scene.sleepingAnna;
    await moa.standReady;
    await moa.setMood('calm', 'smile');
    const c = scenes.townStage.playerController, legal = c.sceneryCanStand;
    const leadStart = { x: moa.root.position.x, y: moa.root.position.z * P };
    let startHeight = moa.root.position.y;
    const goal = resolveTourStop({ x: destination[0], y: destination[1] }, legal);
    const clearance = PLAYER_BODY_RADIUS + (moa.root.userData.rigidBody?.radius || 42) + 8;
    const paths = createTourPaths();
    let { route: lead, exitLength: leadExit } = tourDeparture(leadStart, goal, c, paths, clearance);
    let length = routeLength(lead);
    const clip = moa.animations.find(clip => clip.name.startsWith('Walk_InPlace'));
    if (!clip) throw new Error('모아 걷기 모션을 찾지 못했어요.');
    const action = moa.mixer.clipAction(clip);
    c.keysHeld.clear(); c.scriptedWalking = false; c.isMoving = false;
    scenes.tourActive = true;
    let previous, leader = 0, playerMoved = false, conversationRequested = false, detourCooldown = 0, hasMoved = false, settled = false;
    let detourPlayer;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        const distance = Math.hypot(c.charPosX - moa.root.position.x, c.charPosY / P - moa.root.position.z);
        if ((leader >= length || settled) && distance <= 155) conversationRequested = true;
    } });
    const guide = createMoaMovementGuide(scenes.townStage.viewportEl, { follow: true });
    const reminder = createTourFollowReminder();
    const guideOrigin = { x: c.charPosX, y: c.charPosY };
    player.holdFacing(); moa.faceTarget(null);
    action.reset().play(); moa.root.userData.tourWalking = true;
    const speed = 180;
    try {
        await reviewTravelWait(scenes, (now, resolve, again) => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now;
                controls.update(dt);
                if (Math.hypot(c.charPosX - guideOrigin.x, c.charPosY - guideOrigin.y) > .5) playerMoved = true;
                detourCooldown = Math.max(0, detourCooldown - dt);
                const here = routePoint(lead, leader);
                const gapNow = Math.hypot(c.charPosX - here.x, (c.charPosY - here.y) / P);
                const approaching = [16, 32, 48, 64, 80].some(offset => {
                    const point = routePoint(lead, Math.min(length, leader + offset));
                    const gap = Math.hypot(c.charPosX - point.x, (c.charPosY - point.y) / P);
                    return gap < clearance + 18 && gap < gapNow - .5;
                });
                const obstacleMoved = !detourPlayer || Math.hypot(c.charPosX - detourPlayer.x, (c.charPosY - detourPlayer.y) / P) > 24;
                if (approaching && !detourCooldown && obstacleMoved) {
                    const detour = findTourDetour(lead, leader, c, paths, clearance);
                    detourCooldown = .6;
                    if (detour) {
                        lead = detour; leader = 0; length = routeLength(lead);
                        startHeight = moa.root.position.y; leadExit = 0;
                        detourPlayer = { x: c.charPosX, y: c.charPosY };
                    }
                }
                const nextLeader = Math.min(length, leader + speed * dt);
                const nextPosition = routePoint(lead, nextLeader);
                const nextGap = Math.hypot(c.charPosX - nextPosition.x, (c.charPosY - nextPosition.y) / P);
                const current = routePoint(lead, leader);
                const currentGap = Math.hypot(c.charPosX - current.x, (c.charPosY - current.y) / P);
                const room = nextGap >= clearance || nextGap > currentGap + .001;
                if (room) {
                    if (leader < length) { action.paused = false; action.play(); }
                    leader = nextLeader;
                } else {
                    action.paused = true;
                }
                if (leader > 0) hasMoved = true;
                const p = routePoint(lead, leader), ahead = routePoint(lead, Math.min(length, leader + 24));
                reminder.update(Math.hypot(c.charPosX - p.x, (c.charPosY - p.y) / P), dt);
                guide.update({ visible: hasMoved && !playerMoved && !reminder.isOpen });
                const ground = c.supportHeightAt?.(p.x, p.y) || 0;
                const height = ground + (startHeight - ground) * Math.max(0, 1 - leader / Math.max(leadExit, 30));
                moa.root.position.set(p.x, height, p.y / P);
                if (leader < length) {
                    const yaw = Math.atan2(ahead.x - p.x, (ahead.y - p.y) / P);
                    const delta = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                    moa.root.rotation.y += MathUtils.clamp(delta, -4 * dt, 4 * dt);
                }
                else action.stop();
                const nearby = Math.hypot(c.charPosX - p.x, (c.charPosY - p.y) / P) <= 155;
                // A player waiting on the exact destination must not prevent
                // arrival forever. Stop nearby rather than walking into them.
                settled = leader >= length || (!room && length - leader < 155 && nearby);
                if (settled) action.stop();
                if (settled && nearby && (conversationRequested || !requireInteraction)) resolve();
                else again();
        });
    } finally {
        guide.dispose();
        reminder.dispose();
        controls.dispose(); scenes.tourActive = false;
        action.stop(); moa.root.userData.tourWalking = false;
        c.scriptedWalking = false; c.isMoving = false; c.keysHeld.clear();
        player.update(0); player.setState('idle'); faceConversation(player, moa);
    }
}
