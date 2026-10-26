import { MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { bankCanStand } from '../../data/bankModelRoom.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';
import { animate } from './HandoffMotion.js';
import { createBankDoor } from './BankEntry.js';
import { doorwayHeight } from './DoorwayTraversal.js';

export function bankExitRoute(start, player) {
    const shift = p => ({ x: p.x + 500, y: (p.z + 500) * P });
    const initialGap = player ? Math.hypot(start.x - player.x, start.z - player.z) : 0;
    const legal = (x, y) => {
        x -= 500; const z = y / P - 500;
        return bankCanStand(x, z) && (!player || Math.hypot(x - player.x, z - player.z) >= Math.min(95, initialGap) - .1);
    };
    return roundTourRoute(tourRoute(shift(start), shift({ x: 0, z: 312 }), legal, { step: 10 }), legal)
        .map(p => ({ x: p.x - 500, y: p.y - 500 * P }));
}
async function walk(route, update) {
    const length = routeLength(route);
    await animate(length / 160, t => {
        const d = length * t; update(routePoint(route, d), routePoint(route, Math.min(length, d + 12)));
    });
}
export async function leaveBankAfterMoa(scenes) {
    const room = scenes.rooms.get('bank'), moa = room.room.userData.moa;
    const c = room.controller, town = scenes.townModelScene, tc = scenes.townStage.playerController;
    const player = room.player, outside = town.sleepingAnna;
    const door = createBankDoor(town.scene.getObjectByName('node_finance'));
    let moaWalk, outsideWalk;
    scenes.tourActive = true;
    player.storyYaw = player.storyTarget = player.storyCamera = null; moa.faceTarget(null);
    try {
        if (!room.seatInteraction.stand()) throw new Error('은행 의자에서 일어날 공간이 없어요.');
        const clip = moa.animations.find(clip => clip.name.startsWith('Walk_InPlace'));
        moaWalk = moa.mixer.clipAction(clip); moaWalk.reset().play();
        await walk(bankExitRoute({ x: moa.root.position.x, z: moa.root.position.z },
            { x: c.charPosX, z: c.charPosY / P }), (p, ahead) => {
            moa.root.position.set(p.x, 0, p.y / P);
            if (Math.hypot(ahead.x - p.x, ahead.y - p.y) > .01) {
                moa.root.rotation.y = Math.atan2(ahead.x - p.x, (ahead.y - p.y) / P);
            }
        });
        moaWalk.stop(); moa.root.visible = false;
        // Show Moa emerging first while the player is still inside the bank.
        await outside.setAwake(true, { immediate: true }); outside.faceTarget(null);
        town.player.root.visible = false;
        outside.root.position.set(door.center.x, door.floorY, door.center.z - 10);
        outside.root.rotation.y = 0; outside.root.visible = false;
        room.hide(); scenes.townStage.containerEl.classList.remove('hidden');
        town.entryActive = true; town.dialogueOcclusion?.reset();
        tc.charPosX = door.center.x; tc.charPosY = (door.center.z - 10) * P;
        tc.scriptedWalking = true; tc.isMoving = false;
        tc.scriptedSupportHeight = doorwayHeight(door, door.center.z - 10);
        await door.open();
        outside.root.visible = true;
        outsideWalk = outside.mixer.clipAction(outside.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
        outsideWalk.reset().play();
        await animate(1.5, t => {
            const z = door.center.z - 10 + 240 * t;
            const side = MathUtils.smoothstep(t, .55, 1) * 105;
            outside.root.position.set(door.center.x + side, doorwayHeight(door, z), z);
            outside.root.rotation.y = Math.atan2(t > .55 ? 105 : 0, 240);
        });
        outsideWalk.stop();
        // Only after Moa has cleared the entrance does the player follow.
        c.keysHeld.clear(); c.scriptedWalking = true; c.isMoving = true;
        await walk(bankExitRoute({ x: c.charPosX, z: c.charPosY / P }), (p, ahead) => {
            c.charPosX = p.x; c.charPosY = p.y;
            const dx = ahead.x - p.x, dz = (ahead.y - p.y) / P;
            c.facing = Math.abs(dx) > Math.abs(dz) ? dx > 0 ? 'right' : 'left' : 'down';
            player.update(1 / 60);
        });
        c.scriptedWalking = false; c.isMoving = false; player.setState('idle');
        tc.facing = 'down'; tc.scriptedWalking = true; tc.isMoving = true;
        town.player.storyYaw = town.player.storyTarget = town.player.storyCamera = null;
        town.player.root.visible = true;
        await animate(1.2, t => {
            const z = door.center.z - 10 + 200 * t;
            tc.charPosY = z * P; tc.scriptedSupportHeight = doorwayHeight(door, z);
            town.player.update(1 / 60);
        });
        tc.isMoving = false; town.player.setState('idle');
        await door.close();
        outside.faceTarget(town.player.root);
        scenes.place = 'bankOutside';
    } finally {
        moaWalk?.stop(); outsideWalk?.stop();
        town.player.root.visible = true;
        c.scriptedWalking = false; c.isMoving = false;
        tc.scriptedWalking = false; tc.isMoving = false; delete tc.scriptedSupportHeight;
        town.entryActive = false; scenes.tourActive = false;
    }
}
