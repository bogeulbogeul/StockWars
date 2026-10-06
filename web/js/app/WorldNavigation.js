import { toastManager } from '../components/ToastManager.js';

export const worldNavigation = {
    async enterTown(server = null, spawnLocation = null) {
        const bridge = window.stockWarsPresence;
        if (bridge) {
            if (!bridge.claimNickname) {
                toastManager.show('온라인 마을 입장 전 닉네임 확인이 필요합니다. 게임 앱을 재실행해 주세요.', false);
                return false;
            }
            if (bridge.claimNickname) {
                const claimed = await bridge.claimNickname(this.userProfile?.nickname || '사이퍼 트레이더');
                if (claimed.error) {
                    const unsupported = claimed.error === '잘못된 요청입니다.' || claimed.status === 404;
                    toastManager.show(unsupported ? '서버 업데이트가 필요합니다. 온라인 마을은 닉네임 중복 확인 지원 후 입장할 수 있습니다.' : claimed.error, false);
                    return false;
                }
                if (this.userProfile) this.userProfile.nicknamePending = false;
            }
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
