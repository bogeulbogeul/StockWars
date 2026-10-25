import { toastManager } from '../components/ToastManager.js';
import { registerNickname } from '../engine/NicknameRegistration.js';
import { HomeModelScene } from '../components/home3d/HomeModelScene.js';
import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { enterBuildingOnFoot, leaveBuildingOnFoot } from './OnFootNavigation.js';

export const worldNavigation = {
    async enterTown(server = null, spawnLocation = null, { fromDoor = false } = {}) {
        const interior = [this.cipherLobbyScene?.trainingRoomScene, this.cipherLobbyScene?.simulationRoomScene,
            this.homeModelScene, this.bankModelScene, this.informationModelScene, this.vivianModelScene, this.cipherLobbyScene]
            .find(scene => scene?.active);
        if (interior && !fromDoor) { await interior.exit(); return true; }
        if (!fromDoor && document.body.classList.contains('town-mode-active')) return true;
        const bridge = this.isLocalSession ? null : window.stockWarsPresence;
        if (this.isLocalSession) server = { id: 'local', name: '로컬 마을', ping: 0 };
        if (bridge) {
            try {
                const registered = await registerNickname(this.userProfile?.nickname, bridge);
                if (registered.pending) throw new Error('닉네임 중복 확인을 완료한 뒤 입장해 주세요.');
                this.userProfile.nickname = registered.nickname;
                this.userProfile.nicknamePending = false;
            } catch (error) { toastManager.show(error.message, false); return false; }
            const result = await bridge.join(server?.id || 'town-1');
            if (result.error) { toastManager.show(result.error); return false; }
            const selected = result.snapshot.channels.find(ch => ch.id === result.snapshot.currentChannelId);
            server = { ...selected, ping: result.snapshot.ping };
            this.serverSelectModal?.applyPresence(result);
        } else {
            server ||= { id: 'town-1', name: '타운 1', ping: null };
        }
        this.serverSelectModal?.close();
        this.homeModelScene?.hide();
        this.bankModelScene?.hide();
        this.informationModelScene?.hide();
        this.vivianModelScene?.hide();
        this.cipherLobbyScene?.hide();
        this.officeStage?.hide?.();
        this.townStage?.show(server, spawnLocation);
        document.body.classList.add('town-mode-active');
        if (spawnLocation === 'vivian_store' || spawnLocation === 'vivian') {
            toastManager.show(`🏪 [봉봉 잡화점 앞] 보급품 상점 거리에 복귀했습니다!`, true);
        } else {
            toastManager.show(`🏙️ [${server.name}] 마을 광장에 도착했습니다! (A/D로 이동, 드래그/휠로 스크롤)`, true);
        }
        this.annaTutorial?.notifyTownEntered();
        return true;
    },

    openVivianStore() {
        if (this.enterVivianModel && document.body.classList.contains('town-mode-active')) {
            this.enterVivianModel();
            return;
        }
        this.vivianStoreModal?.open();
    },

    async enterOffice() {
        if (this.homeModelScene?.active) return true;
        if (this.homeEntryActive) return false;
        const home = TOWN_MODEL_BUILDINGS.find(building => building.id === 'home_office_tower');
        const returningFromTown = document.body.classList.contains('town-mode-active');
        if (returningFromTown) {
            const c = this.townStage.playerController;
            if (Math.abs(c.charPosX - home.x - (home.entranceOffsetX || 0)) >= 85
                || c.charPosY < home.y + 15 || c.charPosY >= home.y + 145) return false;
        } else if (['informationModelScene', 'bankModelScene', 'vivianModelScene', 'cipherLobbyScene']
            .some(key => this[key]?.active)) return false;
        this.homeEntryActive = true;
        try {
        this.homeModelScene ||= new HomeModelScene(this.appContainer, async () => {
            await leaveBuildingOnFoot({ room: this.homeModelScene, town: this.townModelScene,
                id: home.id, showTown: () => this.enterTown(null, home.id, { fromDoor: true }) });
        });
        await this.homeModelScene.ready;
        if (returningFromTown) await enterBuildingOnFoot(this.townModelScene, home.id);
        this.informationModelScene?.hide();
        this.bankModelScene?.hide();
        this.vivianModelScene?.hide();
        this.cipherLobbyScene?.hide();
        void window.stockWarsPresence?.leave();
        this.serverSelectModal?.close();
        this.townStage?.hide();
        this.officeStage?.hide?.();
        this.homeModelScene.show();
        document.body.classList.remove('town-mode-active');
        if (returningFromTown) toastManager.show('소망이네 집으로 돌아왔습니다.', true);
        } finally { this.homeEntryActive = false; }
    },

    toggleStage() {
        const isTownActive = document.body.classList.contains('town-mode-active');
        if (isTownActive) {
            this.enterOffice();
        } else {
            const interior = ['homeModelScene', 'informationModelScene', 'bankModelScene', 'vivianModelScene', 'cipherLobbyScene']
                .map(key => this[key]).find(scene => scene?.active);
            if (interior) void interior.exit(); else this.enterTown();
        }
    },

};
