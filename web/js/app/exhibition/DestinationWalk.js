import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { resolveTourStop } from './TourRoute.js';
import { setGuidanceContent } from '../../components/town3d/GuidanceCard.js';
import { TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { atStoreEntrance, createStoreDestinationGuard, createMoaDestinationGuard, createStockDestinationGuard } from './StoreDestinationGuard.js';
import { reviewTravelWait } from './ReviewTravel.js';

// Scene changes wait for actual WASD movement; they never place the player
// at a story location just because the dialogue advanced.
export async function waitForDestination(scenes, destination, title, { guidanceTitle } = {}) {
    const c = scenes.townStage.playerController;
    const goal = resolveTourStop({ x: destination[0], y: destination[1] }, c.sceneryCanStand);
    scenes.tourActive = true; scenes.townModelScene.player.holdFacing();
    const guide = document.createElement('aside'); guide.className = 'moa-movement-guide';
    guide.setAttribute('role', 'region'); guide.setAttribute('aria-label', '목적지 이동 안내');
    setGuidanceContent(guide, { title: guidanceTitle || `${title}까지 걸어가 보자`, rows: [{ keys: ['W', 'A', 'S', 'D'], text: '이동 · 문 앞에서 F로 들어가기' }] });
    scenes.townStage.viewportEl.append(guide);
    const guard = scenes.plazaReturnPending ? createMoaDestinationGuard(scenes)
        : title === '증권사' ? createStockDestinationGuard(scenes)
        : title === '안내소' ? createStoreDestinationGuard(scenes, { allowedBuilding: 'settlement_information', text: '우선 안내소로 가보자.' })
        : ['잡화점', '게시판'].includes(title) ? createStoreDestinationGuard(scenes) : null;
    const buildingId = ({ '잡화점': 'vivian_store', '증권사': 'cipher_securities', '집': 'home_office_tower',
        '은행': 'node_finance', '안내소': 'settlement_information' })[title];
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === buildingId);
    let enteredAtDoor = false;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (guard?.interact()) return;
        if (title === '게시판' && atStoreEntrance(c)) {
            scenes.storeEntryRequested = true; enteredAtDoor = true; return;
        }
        if (building && Math.abs(c.charPosX - building.x - (building.entranceOffsetX || 0)) < 85
            && c.charPosY >= building.y - 10 && c.charPosY < building.y + 165) enteredAtDoor = true;
    },
        onMoveAttempt: (dx, dy) => guard?.move(dx, dy) }); let previous;
    const origin = { x: c.charPosX, y: c.charPosY };
    try { await reviewTravelWait(scenes, (now, resolve, again) => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; controls.update(dt);
            if (Math.hypot(c.charPosX - origin.x, c.charPosY - origin.y) > .5) guide.hidden = true;
            if (enteredAtDoor || (!building && Math.hypot(c.charPosX - goal.x, (c.charPosY - goal.y) / P) < 110)) {
                if (building && enteredAtDoor) scenes.doorEntryRequested = buildingId;
                resolve();
            }
            else again();
    }); } finally { controls.dispose(); guard?.dispose(); guide.remove(); scenes.tourActive = false; }
}
