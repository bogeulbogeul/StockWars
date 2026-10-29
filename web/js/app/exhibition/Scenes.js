import { quickFade, waitForDoorF } from '../QuickTravel.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { TOWN_ARRIVAL } from '../../data/townLandscapeLayout.js';
import { exhibitionSkyTime } from '../../data/exhibitionSkyTime.js';
import { HOME_STORY_STOP } from '../../data/homeModelRoom.js';
import { TownModelScene } from '../../components/town3d/TownModelScene.js';
import { HomeModelScene } from '../../components/home3d/HomeModelScene.js';
import { CipherLobbyScene } from '../../components/cipher3d/CipherLobbyScene.js';
import { VivianModelScene } from '../../components/store3d/VivianModelScene.js';
import { INFORMATION_ROOM, informationCanStand } from '../../data/informationModelRoom.js';
import { BANK_ROOM, bankCanStand } from '../../data/bankModelRoom.js';
import { buildInformationModelRoom } from '../../components/information3d/InformationModelRoom.js';
import { buildBankModelRoom } from '../../components/bank3d/BankModelRoom.js';
import { TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { TOWN_MODEL_PROPS } from '../../data/townModelProps.js';
import { walkVillageTour } from './TourWalk.js';
import { enterInformationAfterMoa } from './InformationEntry.js';
import { leaveInformationForBank } from './InformationExit.js';
import { enterBankOnFoot } from './BankEntry.js';
import { leaveBankAfterMoa } from './BankExit.js';
import { enterHomeAfterMoa } from './HomeEntry.js';
import { enterStoreDoorOnFoot } from '../StoreDoorEntry.js';
import { enterExteriorDoorOnFoot } from '../ExteriorDoorEntry.js';
import { enterBuildingOnFoot, walkRoomTo } from '../OnFootNavigation.js';
import { STORY_BUILDINGS, leaveStoryBuilding } from './BuildingTravel.js';
import { waitForDestination } from './DestinationWalk.js';
import { leaveHomeWithMoa } from './HomeDeparture.js';

const outside = id => {
    const b = TOWN_MODEL_BUILDINGS.find(item => item.id === id);
    return [b.x + (b.entranceOffsetX || 0), b.y + 110];
};
const propFront = id => {
    const p = TOWN_MODEL_PROPS.find(item => item.id === id);
    return [p.x, p.y + 90];
};
const positions = { arrival: [TOWN_ARRIVAL.x, TOWN_ARRIVAL.y], tree: propFront('plaza_tree'),
    bench: propFront('plaza_bench_west'), notice: propFront('plaza_notice_board'),
    homeOutside: outside('home_office_tower'), storeOutside: outside('vivian_store'),
    stockOutside: outside('cipher_securities'), bankOutside: outside('node_finance'),
    informationOutside: outside('settlement_information'), furniture: outside('julian_furniture'),
    pub: outside('midnight_pub'), bookstore: outside('data_ink_bookstore'), post: outside('post_office') };

export class ExhibitionScenes {
    constructor(container) {
        this.rooms = new Map();
        const host = document.createElement('div'); host.className = 'exhibition-world';
        container.append(host);
        const controller = { charPosX: TOWN_ARRIVAL.x, charPosY: TOWN_ARRIVAL.y, cameraX: 0, cameraY: 0,
            worldWidth: 6000, worldHeight: 5000, facing: 'up', keysHeld: new Set(), canStand: () => true,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.townStage = { containerEl: host, viewportEl: host, playerController: controller,
            callbacks: { isInputBlocked: () => true } };
        this.townModelScene = new TownModelScene(this.townStage);
        this.ready = this.townModelScene.ready;
        let previous;
        const draw = now => {
            const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, .05); previous = now;
            window.stockWarsExhibition?.noticeControls?.update(dt);
            this.updateVillageBoard?.(); this.townModelScene.draw(); this.frame = requestAnimationFrame(draw); };
        draw(); this.container = container;
    }
    async show(place, { preservePosition = false, tour = false } = {}) {
        if (place === this.place) return;
        const previousMoa = this.rooms.get(this.place)?.room?.userData.moa || this.townModelScene.sleepingAnna;
        if (previousMoa && !previousMoa.root.userData.sleeping) await previousMoa.setMood('calm', 'smile');
        if (this.place === 'bank' && place === 'bankOutside') {
            await leaveBankAfterMoa(this);
            preservePosition = true;
        }
        if (this.place === 'information' && (place === 'bank' || place === 'home')) {
            await leaveInformationForBank(this);
            const destination = place === 'home' ? 'homeOutside' : 'bankOutside';
            await walkVillageTour(this, positions[destination], { requireInteraction: false });
            this.place = destination;
        }
        if (this.place === 'home' && place === 'bank') {
            await leaveHomeWithMoa(this);
            await walkVillageTour(this, positions.bankOutside, { requireInteraction: false });
            this.place = 'bankOutside';
        }
        if (STORY_BUILDINGS[this.place] && this.place !== place) {
            await leaveStoryBuilding(this);
            // The door traversal already reached this exterior; do not wait for
            // another walk back to its generic approach marker before speaking.
            if (place === this.place) preservePosition = true;
        }
        if (this.place === 'bankOutside' && place === 'home') {
            await walkVillageTour(this, positions.homeOutside);
            this.place = 'homeOutside';
        }
        const walking = tour && positions[this.place] && positions[place];
        if (walking && this.place === 'arrival' && place === 'informationOutside') {
            // Only Moa goes ahead. Keep the player's outdoor position unchanged
            // until they walk to the information office and press F themselves.
            await this.ready;
            this.townModelScene.sleepingAnna.root.visible = false;
            this.townModelScene.player.storyYaw = this.townModelScene.player.storyTarget = this.townModelScene.player.storyCamera = null;
            this.townModelScene.conversationCamera?.reset(this.townModelScene.camera);
            await enterInformationAfterMoa(this);
            await waitForDestination(this, positions[place], '안내소', { guidanceTitle: '모아가 안내소에서 기다리고 있어요. 문 앞에서 F로 들어가보자' });
        }
        else if (walking) await walkVillageTour(this, positions[place]);
        const target = STORY_BUILDINGS[place];
        if (target && positions[this.place] && this.place !== target.outside) {
            const returningHome = place === 'home' && this.place === 'storeOutside';
            await waitForDestination(this, positions[target.outside], target.label,
                returningHome ? { guidanceTitle: '집으로 돌아가 보자' } : {});
            this.place = target.outside;
        } else if (!target && positions[place] && positions[this.place] && !walking && !preservePosition) {
            await waitForDestination(this, positions[place], place === 'notice' ? '게시판' : place === 'bench' ? '벤치' : '목적지');
        }
        if (target) await waitForDoorF(this, target.id);
        const finishEntry = async () => {
        if (place === 'information' && this.place === 'informationOutside' && !this.informationEntered) await enterInformationAfterMoa(this);
        else if (place === 'information' && this.place === 'informationOutside') await enterBuildingOnFoot(this.townModelScene, target.id);
        if (place === 'bank' && this.place === 'bankOutside') {
            if (!this.bankEntered) await enterBankOnFoot(this);
            else await enterBuildingOnFoot(this.townModelScene, target.id);
            this.bankEntered = true;
        }
        const homeEntry = place === 'home' && this.place === 'homeOutside' && !this.homeEntered;
        if (homeEntry) await enterHomeAfterMoa(this);
        else if (place === 'home') await enterBuildingOnFoot(this.townModelScene, target.id);
        if (place === 'home') this.homeEntered = true;
        if (place === 'store' && positions[this.place]) {
            await this.prepareRoom('store');
            await enterStoreDoorOnFoot(this.townModelScene);
        }
        if (place === 'stock' && positions[this.place]) {
            if (this.place !== 'stockOutside') await walkVillageTour(this, positions.stockOutside);
            this.place = 'stockOutside';
            await this.prepareRoom('stock');
            await enterExteriorDoorOnFoot(this.townModelScene, 'cipher_securities');
        }
        this.place = place;
        for (const room of this.rooms.values()) room.hide();
        this.townStage.containerEl.classList.add('hidden');
        if (positions[place]) {
            this.townStage.containerEl.classList.remove('hidden');
            this.townModelScene.draw(); return;
        }
        const room = await this.prepareRoom(place);
        if (this.place === place) {
            room.show();
            if (place === 'home') { room.controller.charPosX = HOME_STORY_STOP.x; room.controller.charPosY = HOME_STORY_STOP.z * P; room.player.update(0); }

            this.storeAwaitingTalk = place === 'store';
            this.informationAwaitingTalk = place === 'information';
            this.bankAwaitingTalk = place === 'bank';
        }
        };
        if (target) await quickFade(finishEntry); else await finishEntry();
        if (place === 'store') await this.rooms.get('store').greetingReady;
    }
    async prepareRoom(place) {
        let room = this.rooms.get(place);
        if (!room) {
            const back = () => this.show(STORY_BUILDINGS[place].outside, { preservePosition: true });
            if (place === 'home') room = new HomeModelScene(this.container, back);
            else if (place === 'store') room = new VivianModelScene(this.container, back, () => {});
            else {
                const options = { automaticExit: false, nearbyDoor: () => null };
                if (place === 'information') Object.assign(options, { layout: INFORMATION_ROOM,
                    buildRoom: buildInformationModelRoom, canStand: informationCanStand,
                    stageId: 'exhibitionInformation', label: '모아 안내소' });
                if (place === 'bank') Object.assign(options, { layout: BANK_ROOM, buildRoom: buildBankModelRoom,
                    canStand: bankCanStand, stageId: 'exhibitionBank', label: '차곡 은행' });
                room = new CipherLobbyScene(this.container, back, options);
            }
            this.rooms.set(place, room);
        }
        await room.ready;
        return room;
    }
    setTime(sunset, { asleep = false, immediate = false } = {}) {
        const stage = exhibitionSkyTime({ sunset, asleep });
        this.townModelScene.scene.userData.storySkyTime = stage;
        document.body.classList.toggle('exhibition-sunset', stage === 'sunset');
        this.townModelScene.landscape?.sky.update(performance.now(), immediate);
    }
}
