import { moveTownBody } from './TownBodyMovement.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_RADIUS } from './CharacterBodies.js';

// Use the current walk rig and collision checks; never snap the player sideways.
export async function stepAsideForMoa(player, resident) {
    if (!player || !resident) return false;
    await player.ready;
    await resident.standReady;
    const c = player.town.playerController;
    if (c.scriptedWalking) return false;
    const start = { x: c.charPosX, y: c.charPosY };
    const left = resident.root.position.x - 145;
    const standing = resident.standDestination || resident.root.position;
    const clearance = PLAYER_BODY_RADIUS + (resident.root.userData.rigidBody?.radius || 42) + 8;
    const legalSegment = (a, b) => {
        const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
        for (let i = 1; i <= steps; i++) {
            if (!c.canStand(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
        }
        return true;
    };
    let path;
    for (const forward of [0, 20, 40, 60, 80]) {
        const front = { x: start.x, y: start.y + forward }, end = { x: left, y: front.y };
        if (Math.hypot(end.x - standing.x, end.y / P - standing.z) < clearance) continue;
        if (legalSegment(start, front) && legalSegment(front, end)) {
            path = forward ? [front, end] : [end]; break;
        }
    }
    if (!path) return false;
    c.keysHeld.clear(); c.scriptedWalking = true; c.isMoving = true;
    player.storyTarget = null; player.storyCamera = null;
    let previous, elapsed = 0, stalled = 0;
    return new Promise(resolve => {
        const finish = () => {
            c.scriptedWalking = false; c.isMoving = false; c.keysHeld.clear();
            player.update(0); player.setState('idle');
            resolve(Math.abs(c.charPosX - start.x) > 1);
        };
        const tick = now => {
            if (document.hidden) { previous = now; requestAnimationFrame(tick); return; }
            const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const target = path[0], dx = target.x - c.charPosX, dy = target.y - c.charPosY;
            const distance = Math.hypot(dx, dy), step = Math.min(85 * dt, distance);
            if (distance > .05) {
                c.facing = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
                const before = { x: c.charPosX, y: c.charPosY };
                moveTownBody(c, dx / distance * step, dy / distance * step);
                const moved = Math.hypot(c.charPosX - before.x, c.charPosY - before.y);
                stalled = step > 0 && moved < .001 ? stalled + dt : 0;
                // A newly occupied path must stop, rather than walking against it.
                if (stalled > .2) { finish(); return; }
            }
            if (Math.hypot(target.x - c.charPosX, target.y - c.charPosY) < .1) path.shift();
            if (!path.length || elapsed > 6) finish();
            else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}
