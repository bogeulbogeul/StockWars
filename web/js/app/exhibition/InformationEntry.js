import { GROUND_PROJECTION as P, TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { createInformationDoor } from './InformationDoor.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { createCharacterBodies } from '../../components/town3d/CharacterBodies.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';
import { walkPlayerIntoInformation } from './InformationPlayerEntry.js';

async function walkToDoor(moa, target, controller) {
    const start = { x: moa.root.position.x, y: moa.root.position.z * P };
    const goal = { x: target.x, y: target.z * P };
    const clearance = 42 + (moa.root.userData.rigidBody?.radius || 42) + 8;
    const initialGap = Math.hypot(start.x - controller.charPosX, start.y / P - controller.charPosY / P);
    const legal = (x, y) => Math.hypot(x - controller.charPosX, (y - controller.charPosY) / P) >= Math.min(clearance, initialGap)
        && (controller.sceneryCanStand(x, y) || (Math.abs(x - target.x) < 48 && y >= goal.y - 8 && y <= start.y + 8));
    const route = roundTourRoute(tourRoute(start, goal, legal, { step: 12 }), legal), length = routeLength(route);
    const clip = moa.animations.find(clip => clip.name.startsWith('Walk_InPlace'));
    const action = moa.mixer.clipAction(clip); action.reset().play();
    let previous, progress = 0;
    await new Promise(resolve => {
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now;
            progress = Math.min(length, progress + dt * 160);
            const point = routePoint(route, progress), ahead = routePoint(route, Math.min(length, progress + 20));
            const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
            moa.root.position.x = point.x; moa.root.position.z = point.y / P;
            if (progress < length) {
                const yaw = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                moa.root.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, delta));
            }
            if (progress >= length) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    action.stop();
}

export async function enterInformationAfterMoa(scenes) {
    await scenes.ready;
    const room = await scenes.prepareRoom('information');
    const town = scenes.townModelScene, moa = town.sleepingAnna, player = town.player;
    const c = scenes.townStage.playerController;
    const definition = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
    const building = town.scene.getObjectByName(definition.id), door = createInformationDoor(building);
    await moa.setMood('calm', 'smile');
    town.entryActive = true; town.dialogueOcclusion?.reset();
    player.holdFacing(); moa.faceTarget(null);
    await door.open();
    await walkToDoor(moa, { x: door.center.x, z: door.center.z - 25 }, c);
    moa.root.visible = false;
    await room.room.userData.seatMoa();
    room.characterBodies = createCharacterBodies(room.room);
    await door.close();
    town.entryActive = false;
    const guide = createMoaMovementGuide(scenes.townStage.viewportEl, { door: true });
    guide.update({ visible: true }); scenes.tourActive = true;
    let opened = false, previous;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (Math.abs(c.charPosX - door.center.x) < 85 && c.charPosY > definition.y + 10 && c.charPosY < definition.y + 165) opened = true;
    } });
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (opened) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        guide.dispose(); controls.dispose();
        town.entryActive = true; town.dialogueOcclusion?.reset();
        await door.open();
        await walkPlayerIntoInformation(player, door);
        scenes.informationEntered = true;
        void door.close();
    } finally {
        guide.dispose(); controls.dispose(); scenes.tourActive = false;
        town.entryActive = false;
    }
}
