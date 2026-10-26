import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { HOME_SPAWN, HOME_EXIT_Z } from '../../data/homeModelRoom.js';
import { roomWalkingRoute, walkRoute, walkRoomTo, leaveBuildingOnFoot, buildingDoor } from '../OnFootNavigation.js';
import { doorwayHeight } from './DoorwayTraversal.js';
import { roundTourRoute } from './TourCurve.js';

function turnAlongRoute(root, point, ahead, dt) {
    const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
    if (Math.hypot(dx, dz) < .01) return;
    const yaw = Math.atan2(dx, dz);
    const delta = Math.atan2(Math.sin(yaw - root.rotation.y), Math.cos(yaw - root.rotation.y));
    root.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, delta));
}

export async function leaveHomeWithMoa(scenes) {
    const room = scenes.rooms.get('home'), moa = room.room.userData.moa, town = scenes.townModelScene;
    scenes.tourActive = true; room.exitPending = true;
    let action;
    try {
        moa.faceTarget(null); room.player.holdFacing();
        await walkRoomTo(room, { x: -105, z: 150 }); room.player.holdFacing();
        room.controller.scriptedWalking = true; room.controller.isMoving = false;
        const origin = moa.root.position;
        const legal = (x, z) => room.canStand(x, z)
            && Math.hypot(x - room.controller.charPosX, z - room.controller.charPosY / P) >= 85;
        const route = roomWalkingRoute({ controller: { charPosX: origin.x, charPosY: origin.z * P } },
            { x: HOME_SPAWN.x, z: HOME_EXIT_Z }, legal);
        action = moa.mixer.clipAction(moa.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
        action.reset().play();
        await walkRoute(roundTourRoute(route, (x, y) => legal(x, y / P)), (point, ahead, dt) => {
            moa.root.position.set(point.x, 0, point.y / P);
            turnAlongRoute(moa.root, point, ahead, dt);
        });
        action.stop(); moa.root.visible = false;
        await leaveBuildingOnFoot({ room, town, id: 'home_office_tower', showTown: async () => {
            room.hide(); scenes.townStage.containerEl.classList.remove('hidden');
            const door = buildingDoor(town, 'home_office_tower'), outside = town.sleepingAnna;
            town.player.storyYaw = town.player.storyTarget = town.player.storyCamera = null;
            await outside.setAwake(true, { immediate: true }); outside.faceTarget(null);
            outside.root.position.set(door.center.x, door.floorY, door.center.z - 10);
            outside.root.rotation.y = 0; outside.root.visible = false;
            await door.open(); outside.root.visible = true;
            const walk = outside.mixer.clipAction(outside.animations.find(clip => clip.name.startsWith('Walk_InPlace')));
            walk.reset().play();
            try { await walkRoute([{ x: door.center.x, y: (door.center.z - 10) * P },
                { x: door.center.x, y: (door.center.z + 360) * P }], (point, ahead, dt) => {
                const z = point.y / P;
                outside.root.position.set(point.x, doorwayHeight(door, z), z);
                turnAlongRoute(outside.root, point, ahead, dt);
            }); } finally { walk.stop(); }
        } });
        scenes.place = 'homeOutside';
    } finally {
        action?.stop(); room.controller.scriptedWalking = false; room.controller.isMoving = false;
        room.exitPending = false; scenes.tourActive = false;
    }
}
