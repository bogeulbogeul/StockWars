import { TownModelScene } from '../../components/town3d/TownModelScene.js';
import { HomeModelScene } from '../../components/home3d/HomeModelScene.js';
import { CipherLobbyScene } from '../../components/cipher3d/CipherLobbyScene.js';
import { VivianModelScene } from '../../components/store3d/VivianModelScene.js';
import { INFORMATION_ROOM, informationCanStand } from '../../data/informationModelRoom.js';
import { BANK_ROOM, bankCanStand } from '../../data/bankModelRoom.js';
import { buildInformationModelRoom } from '../../components/information3d/InformationModelRoom.js';
import { buildBankModelRoom } from '../../components/bank3d/BankModelRoom.js';
import { TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { placeSomangi } from './SomangiPresentation.js';

const positions = { arrival: [1080, 2355], tree: [1660, 1430], bench: [1460, 1420], notice: [1650, 2140],
    homeOutside: [900, 1040], storeOutside: [2150, 1240], stockOutside: [2150, 1900],
    bankOutside: [2600, 2190], informationOutside: [1400, 2190], furniture: [850, 1900],
    pub: [2600, 990], bookstore: [2600, 1590], post: [1760, 1550] };

export class ExhibitionScenes {
    constructor(container) {
        this.rooms = new Map();
        const host = document.createElement('div'); host.className = 'exhibition-world';
        container.append(host);
        const controller = { charPosX: 1080, charPosY: 2355, cameraX: 0, cameraY: 0,
            worldWidth: 6000, worldHeight: 5000, facing: 'up', keysHeld: new Set(), canStand: () => true,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.townStage = { containerEl: host, viewportEl: host, playerController: controller,
            callbacks: { isInputBlocked: () => true } };
        this.townModelScene = new TownModelScene(this.townStage);
        this.ready = this.townModelScene.ready;
        const draw = () => { this.townModelScene.draw(); this.frame = requestAnimationFrame(draw); };
        draw(); this.container = container;
    }
    async show(place) {
        if (place === this.place) return;
        this.place = place;
        for (const room of this.rooms.values()) room.hide();
        this.townStage.containerEl.classList.add('hidden');
        if (positions[place]) {
            const [x, y] = positions[place];
            Object.assign(this.townStage.playerController, { charPosX: x, charPosY: y });
            this.townStage.containerEl.classList.remove('hidden');
            this.townModelScene.draw(); return;
        }
        let room = this.rooms.get(place);
        if (!room) {
            const back = () => this.show('homeOutside');
            if (place === 'home') room = new HomeModelScene(this.container, back);
            else if (place === 'store') room = new VivianModelScene(this.container, back, () => {});
            else {
                const options = { automaticExit: false, nearbyDoor: () => null };
                if (place === 'information') Object.assign(options, { layout: INFORMATION_ROOM,
                    buildRoom: buildInformationModelRoom, canStand: informationCanStand,
                    stageId: 'exhibitionInformation', label: '포포리 안내소' });
                if (place === 'bank') Object.assign(options, { layout: BANK_ROOM, buildRoom: buildBankModelRoom,
                    canStand: bankCanStand, stageId: 'exhibitionBank', label: '은행' });
                room = new CipherLobbyScene(this.container, back, options);
            }
            this.rooms.set(place, room);
        }
        await room.ready;
        if (this.place === place) { room.show(); placeSomangi(this, room); }
    }
    setTime(sunset) {
        document.body.classList.toggle('exhibition-sunset', sunset);
    }
}
