import { quickFade } from '../QuickTravel.js';
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
    await quickFade(async () => { moa.root.visible = false; scenes.moaRestingAtPlaza = false; });
    if (token.cancelled) return;
    const room = await scenes.prepareRoom('information'); await room.room.userData.seatMoa();
    room.room.userData.moa.root.visible = true; scenes.moaReturnedToInformation = true;
}
