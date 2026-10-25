import { TOWN_ARRIVAL } from '../../data/townLandscapeLayout.js';
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
import { placeSomangi } from './SomangiPresentation.js';
import { walkVillageTour } from './TourWalk.js';
import { enterInformationAfterMoa } from './InformationEntry.js';

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
        const draw = () => { this.townModelScene.draw(); this.frame = requestAnimationFrame(draw); };
        draw(); this.container = container;
    }
    async show(place, { preservePosition = false, tour = false } = {}) {
        if (place === this.place) return;
        const previousMoa = this.rooms.get(this.place)?.room?.userData.moa || this.townModelScene.sleepingAnna;
        if (previousMoa && !previousMoa.root.userData.sleeping) await previousMoa.setMood('calm', 'smile');
        const walking = tour && positions[this.place] && positions[place];
        if (walking) await walkVillageTour(this, positions[place]);
        if (place === 'information' && this.place === 'informationOutside' && !this.informationEntered) await enterInformationAfterMoa(this);
        this.place = place;
        for (const room of this.rooms.values()) room.hide();
        this.townStage.containerEl.classList.add('hidden');
        if (positions[place]) {
            const [x, y] = positions[place];
            if (!preservePosition && !walking) Object.assign(this.townStage.playerController, { charPosX: x, charPosY: y });
            this.townStage.containerEl.classList.remove('hidden');
            this.townModelScene.draw(); return;
        }
        const room = await this.prepareRoom(place);
        if (this.place === place) {
            room.show();
            this.informationAwaitingTalk = place === 'information';
            if (!this.informationAwaitingTalk) placeSomangi(this, room);
        }
    }
    async prepareRoom(place) {
        let room = this.rooms.get(place);
        if (!room) {
            const back = () => this.show('homeOutside');
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
    setTime(sunset) {
        document.body.classList.toggle('exhibition-sunset', sunset);
    }
}
