import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { INFORMATION_OBSTACLES } from '../../data/informationObstacles.js';
import { animate } from './HandoffMotion.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';
import { createInformationDoor } from './InformationDoor.js';
import { doorwayHeight } from './DoorwayTraversal.js';
import { dismountPlayerSeat } from './PlayerSeatDismount.js';
import { walkRoomTo } from '../OnFootNavigation.js';
import { PLAYER_BODY_RADIUS } from '../../components/town3d/CharacterBodies.js';

export function informationExitRoute(start, waitingPlayer = null, clearance = 95, isClear = () => true) {
    // Shift indoor coordinates for the village pathfinder's nonnegative search grid.
    const shift = p => ({ x: p.x + 500, y: (p.z + 500) * P });
    const legal = (x, y) => {
        x -= 500; const z = y / P - 500;
        if (Math.abs(x) > 340 || z < -258 || z > 320) return false;
        if (waitingPlayer && Math.hypot(x - waitingPlayer.x, z - waitingPlayer.z) < clearance) return false;
        return !INFORMATION_OBSTACLES.some(b => x > b.minX - 26 && x < b.maxX + 26
            && z > b.minZ - 26 && z < b.maxZ + 26) && isClear(x, z);
    };
    return roundTourRoute(tourRoute(shift(start), shift({ x: 0, z: 312 }), legal, { step: 10 }), legal)
        .map(p => ({ x: p.x - 500, y: p.y - 500 * P }));
}
async function walk(route, update, speed = 160) {
    const length = routeLength(route);
    await animate(length / speed, t => {
        // animate supplies smooth start/stop timing; position and facing use the same curve.
        const distance = length * t;
        update(routePoint(route, distance), routePoint(route, Math.min(length, distance + 12)));
    });
}
export async function leaveInformationForBank(scenes) {
    const room = scenes.rooms.get('information'), moa = room.room.userData.moa;
    const town = scenes.townModelScene, player = room.player, c = room.controller;
    let actionOutside, action;
    const wasExitPending = room.exitPending; room.exitPending = true;
    scenes.tourActive = true; moa.faceTarget(null);
    player.storyYaw = player.storyTarget = player.storyCamera = null;
    try {
        await dismountPlayerSeat(room);
        // Walk clear of both the visitor stool and the right-hand desk aisle.
        // Keep the waiting player fixed while Moa passes instead of allowing
        // overlap recovery to push the player out of the way.
        await walkRoomTo(room, { x: -125, z: 200 }); player.holdFacing();
        c.scriptedWalking = true; c.isMoving = false;
        const rest = room.room.userData.moaSeatRest || [];
        const seated = rest.map(item => ({ position: item.bone.position.clone(), quaternion: item.bone.quaternion.clone() }));
        const origin = moa.root.position.clone();
        await animate(.65, t => {
            rest.forEach((item, i) => {
                item.bone.position.lerpVectors(seated[i].position, item.position, t);
                item.bone.quaternion.slerpQuaternions(seated[i].quaternion, item.quaternion, t);
            });
            moa.root.position.y = origin.y * (1 - t); moa.root.position.z = origin.z + (-145 - origin.z) * t;
        });
        moa.root.userData.seated = false;
        const clip = moa.animations.find(clip => clip.name.startsWith('Walk_InPlace'));
        action = moa.mixer.clipAction(clip); action.reset().play();
        const clearance = Math.max(95, PLAYER_BODY_RADIUS + (moa.root.userData.rigidBody?.radius || 42) + 10);
        const waitingPlayer = { x: c.charPosX, z: c.charPosY / P };
        const furnitureClear = (x, z) => !(room.furnitureBodies || []).some(b => {
            const nx = Math.max(b.minX, Math.min(b.maxX, x));
            const nz = Math.max(b.minY / P, Math.min(b.maxY / P, z));
            return Math.hypot(x - nx, z - nz) < 36;
        });
        await walk(informationExitRoute({ x: moa.root.position.x, z: moa.root.position.z }, waitingPlayer, clearance, furnitureClear), (p, ahead) => {
            moa.root.position.set(p.x, 0, p.y / P);
            if (Math.hypot(ahead.x - p.x, ahead.y - p.y) > .01) moa.root.rotation.y = Math.atan2(ahead.x - p.x, (ahead.y - p.y) / P);
        });
        action.stop(); moa.root.visible = false;
        c.keysHeld.clear(); c.scriptedWalking = true; c.isMoving = true;
        await walk(informationExitRoute({ x: c.charPosX, z: c.charPosY / P }), (p, ahead) => {
            c.charPosX = p.x; c.charPosY = p.y; c.isMoving = true;
            const dx = ahead.x - p.x, dz = (ahead.y - p.y) / P;
            c.facing = Math.abs(dx) > Math.abs(dz) ? dx > 0 ? 'right' : 'left' : dz > 0 ? 'down' : 'up';
        });
        c.scriptedWalking = false; c.isMoving = false; player.setState('idle');
        const building = town.scene.getObjectByName('settlement_information'), door = createInformationDoor(building);
        town.player.root.visible = false;
        room.hide(); scenes.townStage.containerEl.classList.remove('hidden');
        const outside = town.sleepingAnna, tc = scenes.townStage.playerController;
        await outside.setAwake(true, { immediate: true }); outside.faceTarget(null); outside.root.visible = false;
        outside.root.position.set(door.center.x, door.floorY, door.center.z - 10);
        tc.charPosX = door.center.x; tc.charPosY = (door.center.z - 10) * P;
        tc.facing = 'down'; tc.scriptedWalking = true; tc.isMoving = false;
        tc.scriptedSupportHeight = doorwayHeight(door, door.center.z - 10);
        town.player.storyYaw = town.player.storyTarget = town.player.storyCamera = null;
        town.entryActive = true; town.dialogueOcclusion?.reset();
        await door.open();
        outside.root.visible = true;
        actionOutside = outside.mixer.clipAction(outside.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
        actionOutside.reset().play(); outside.root.rotation.y = 0;
        await animate(1.5, t => {
            const z = door.center.z - 10 + 240 * t;
            const side = Math.max(0, (t - .55) / .45) * 105;
            outside.root.position.set(door.center.x + side, doorwayHeight(door, z), z);
            outside.root.rotation.y = Math.atan2(t > .55 ? 105 : 0, 240);
        });
        actionOutside.stop();
        town.player.root.visible = true; tc.isMoving = true;
        await animate(1.4, t => {
            const z = door.center.z - 10 + 200 * t;
            tc.charPosY = z * P; tc.scriptedSupportHeight = doorwayHeight(door, z);
            town.player.update(1 / 60);
        });
        tc.isMoving = false; town.player.setState('idle');
        await door.close();
        scenes.place = 'informationOutside';
    } finally {
        action?.stop(); room.exitPending = wasExitPending;
        actionOutside?.stop();
        c.scriptedWalking = false; c.isMoving = false;
        const tc = scenes.townStage.playerController;
        tc.scriptedWalking = false; tc.isMoving = false; delete tc.scriptedSupportHeight;
        town.entryActive = false; scenes.tourActive = false;
        town.player.root.visible = true;
    }
}
