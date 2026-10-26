import { quickFade, positionOutside } from './QuickTravel.js';
import { GROUND_PROJECTION as P } from '../data/townModelBuildings.js';
import { HOME_SPAWN, HOME_EXIT_Z } from '../data/homeModelRoom.js';
import { VIVIAN_EXIT_Z } from '../data/vivianModelRoom.js';
import { createExteriorDoor } from '../components/town3d/ExteriorDoors.js';
import { createInformationDoor } from './exhibition/InformationDoor.js';
import { walkPlayerIntoInformation } from './exhibition/InformationPlayerEntry.js';
import { doorwayHeight } from './exhibition/DoorwayTraversal.js';
import { tourRoute, routeLength, routePoint } from './exhibition/TourRoute.js';

export function buildingDoor(town, id) {
    const building = town.scene.getObjectByName(id);
    if (id === 'settlement_information') return createInformationDoor(building);
    if (id === 'home_office_tower') return createInformationDoor(building, {
        id: 'home', panelName: 'Home_Arched_Wood_Door', approachDistance: 180,
        hingeName: 'Home_Door_Brass_Hinge', darkFill: part => part.name === 'Home_Door_Round_Window_Glass',
        isPart: part => part.name.startsWith('Home_Door_')
    });
    if (id === 'vivian_store') return createInformationDoor(building, {
        id: 'store', panelName: 'Central_Arched_Wood_Door', approachDistance: 180,
        isPart: part => part.name.startsWith('Door_') && part.name !== 'Door_Continuous_Arch_Frame',
        darkFill: part => part.name === 'Door_Glass'
    });
    return createExteriorDoor(building);
}

// Rebase the shared pathfinder so rooms with negative coordinates use the same
// obstacle checks as the village. No direct straight-line fallback through props.
export function roomWalkingRoute(scene, destination, legal = (x, z) => scene.canStand(x, z)) {
    const c = scene.controller, offset = 1000;
    const start = { x: c.charPosX + offset, y: c.charPosY + offset };
    const goal = { x: destination.x + offset, y: destination.z * P + offset };
    return tourRoute(start, goal, (x, y) => legal(x - offset, (y - offset) / P), { step: 12 })
        .map(point => ({ x: point.x - offset, y: point.y - offset }));
}

export async function walkRoomTo(scene, destination, legal) {
    await scene.ready;
    if (scene.seatInteraction?.stand() === false) throw new Error('의자에서 일어날 공간이 없어요.');
    const c = scene.controller, player = scene.player;
    const route = roomWalkingRoute(scene, destination, legal);
    c.keysHeld.clear(); c.scriptedWalking = true; c.isMoving = true;
    player.storyYaw = player.storyTarget = player.storyCamera = null;
    try { await walkRoute(route, (point, ahead, dt) => {
        c.charPosX = point.x; c.charPosY = point.y;
        const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
        if (Math.hypot(dx, dz) > .001) c.facing = Math.abs(dx) > Math.abs(dz) ? dx > 0 ? 'right' : 'left' : dz > 0 ? 'down' : 'up';
        player.update(dt);
    }); } finally {
        c.scriptedWalking = false; c.isMoving = false; c.keysHeld.clear(); player.setState('idle');
    }
}

export function roomExitPoint(scene, id) {
    if (id === 'home_office_tower') return { x: HOME_SPAWN.x, z: HOME_EXIT_Z };
    if (id === 'vivian_store') return { x: 0, z: VIVIAN_EXIT_Z };
    return { x: 0, z: scene.layout.exitZ };
}

export async function walkRoute(route, update, speed = 145) {
    const length = routeLength(route); let previous, progress = 0;
    await new Promise(resolve => {
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; progress = Math.min(length, progress + speed * dt);
            update(routePoint(route, progress), routePoint(route, Math.min(length, progress + 18)), dt);
            if (progress >= length) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

export async function enterBuildingOnFoot(town, id) {
    await town.ready; await town.player.ready;
    town.town.playerController.keysHeld.clear();
    town.town.playerController.isMoving = false;
    town.player.setState('idle');
}

export async function leaveBuildingOnFoot({ room, town, id, showTown }) {
    if (room.doorTravelActive) return;
    room.doorTravelActive = true;
    try {
        await town.ready; await town.player.ready;
        if (room.seatInteraction?.stand() === false) throw new Error('의자에서 일어날 공간이 없어요.');
        await quickFade(async () => {
            positionOutside(town, id);
            if (await showTown() !== false) room.hide();
        });
    } finally { room.doorTravelActive = false; town.entryActive = false; }
}
