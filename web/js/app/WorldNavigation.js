import { toastManager } from '../components/ToastManager.js';

export const worldNavigation = {
    async enterTown(server = null, spawnLocation = null) {
        const bridge = window.stockWarsPresence;
        if (bridge) {
            const result = await bridge.join(server?.id || 'town-1');
            if (result.error) { toastManager.show(result.error); return false; }
            const selected = result.snapshot.channels.find(ch => ch.id === result.snapshot.currentChannelId);
            server = { ...selected, ping: result.snapshot.ping };
            this.serverSelectModal?.applyPresence(result);
        } else {
            server ||= { id: 'town-1', name: '타운 1', ping: null };
        }
        this.serverSelectModal?.close();
        this.officeStage?.hide?.();
        this.townStage?.show(server, spawnLocation);
        document.body.classList.add('town-mode-active');
        if (this.topDemoBar?.txtStageToggle) {
            this.topDemoBar.txtStageToggle.textContent = '오피스로 이동';
        }
        if (spawnLocation === 'logistics' || spawnLocation === 'bit_logistics') {
            toastManager.show(`📦 [비트 물류 앞] 마을 거리에 복귀했습니다!`, true);
        } else if (spawnLocation === 'vivian_store' || spawnLocation === 'vivian') {
            toastManager.show(`🏪 [비비안 잡화점 앞] 보급품 상점 거리에 복귀했습니다!`, true);
        } else {
            toastManager.show(`🏙️ [${server.name}] 마을 광장에 도착했습니다! (A/D로 이동, 드래그/휠로 스크롤)`, true);
        }
        this.annaTutorial?.notifyTownEntered();
        return true;
    },

    openVivianStore() {
        this.vivianStoreModal?.open();
    },

    enterOffice() {
        void window.stockWarsPresence?.leave();
        this.serverSelectModal?.close();
        this.townStage?.hide();
        this.officeStage?.show?.();
        document.body.classList.remove('town-mode-active');
        if (this.topDemoBar?.txtStageToggle) {
            this.topDemoBar.txtStageToggle.textContent = '타운으로 이동';
        }
        toastManager.show('🏢 [홈 오피스] 개인 트레이딩 룸으로 복귀했습니다.', true);
    },

    toggleStage() {
        const isTownActive = document.body.classList.contains('town-mode-active');
        if (isTownActive) {
            this.enterOffice();
        } else {
            this.enterTown();
        }
    },

};
