import { playRecoveryDrinkEffect } from '../components/RecoveryDrinkEffect.js';
import { marketEngine } from '../engine/marketEngine.js';
import { toastManager } from '../components/ToastManager.js';
import { CharacterCreation } from '../components/CharacterCreation.js?v=retirement';
import { ServerSelectModal } from '../components/ServerSelectModal.js';
import { TownStage } from '../components/TownStage.js';
import { CipherLobby } from '../components/CipherCanvasLobby.js';
import { SalonInterior } from '../components/salon/SalonInterior.js';
import { VivianStoreModal } from '../components/store/VivianStoreModal.js?v=vivian-effects-1';
import { initPackingGame } from './PackingEntrance.js';

export function initWorld() {
        // Server Selection Modal (Office Door Town Gateway)
        this.serverSelectModal = new ServerSelectModal(this.appContainer, {
            onConnect: (server) => this.enterTown(server)
        });

        // Vivian Store Modal (MOD_GDD_03_1)
        this.vivianStoreModal = new VivianStoreModal(this.appContainer, {
            onPurchaseItem: (id, qty, instant) => this.itemGameplay.purchase(id, qty, instant),
            getShopState: () => this.itemEngine?.state,
            getShopProgress: () => this.itemEngine?.progress(),
            getCash: () => marketEngine.cash,
            onDeductCash: (amt) => { marketEngine.cash = Math.max(0, marketEngine.cash - amt); marketEngine.notify(); },
            onInventoryAdd: (item) => this.inventoryModal?.addItem(item),
            onStaminaHeal: (amt = 1) => {
                const max = this.mainHUD?.stamina?.max || 3, cur = this.mainHUD?.stamina?.current ?? 0;
                this.mainHUD?.updateStamina(Math.min(max, cur + amt));
            },
            onStockBoost: (stockId) => {
                const s = marketEngine.stocks?.get(stockId);
                if (s) { s.price = Math.round(s.price * 1.005); marketEngine.notify(); }
            },
            onOpenInventory: () => this.inventoryModal?.open(),
            onClose: () => {
                if (document.body.classList.contains('town-mode-active')) this.enterTown(null, 'vivian_store');
            }
        });

        this.salonInterior = new SalonInterior(this.appContainer, {
            onClose: () => {
                if (document.body.classList.contains('town-mode-active')) this.enterTown(null, 'claire_apparel');
            }
        });
        this.cipherLobby = new CipherLobby(this.appContainer);
        this.cipherLobby.getQuestReward = () => this.getNpcReward?.('agent_k');
        this.cipherLobby.onClaimReward = id => this.claimNpcReward?.(id,'agent_k');
        this.cipherLobby.getQuestOffers = giver => this.getQuestOffers?.(giver) || [];
        this.cipherLobby.onAcceptQuest = (id, giver) => this.acceptQuest?.(id, giver);
        this.cipherLobby.competitionRoom.onMatchFinished = result => this.recordQuestEvent?.('arena', result);
        this.cipherLobby.trainingRoom.onAnalyze=(stockId)=>{
            // Keep the shared analysis overlay inside the active modal's top layer.
            this.cipherLobby.trainingRoom.dialog.append(this.detailedChartModal.modal);
            this.openDetailedChart(stockId);
        };
        this.cipherLobby.trainingRoom.dialog.addEventListener('close',()=>{
            this.detailedChartModal.close();
            this.appContainer.append(this.detailedChartModal.modal);
        });

        // 6. 2D Side-Scrolling Public Town Stage
        this.townStage = new TownStage(this.appContainer, {
            externalPresence:true,
            onOpenPlayerProfile: player => this.playerSocial?.open(player),
            onPlayerEncounter: player => this.playerSocial?.encounter(player),
            getPlayerSocialProfile: () => ({ level: this.itemEngine?.playerLevel() || 1, trait: this.userProfile?.trait?.title || '' }),
            getVendingState: () => {
                this.itemEngine.tick();
                return { cash: marketEngine.cash, purchased: this.itemEngine.state.purchases.item_energy_drink || 0,
                    owned: this.itemEngine.state.inventory.find(item => item.id === 'item_energy_drink')?.quantity || 0 };
            },
            onPurchaseDrink: instant => this.itemGameplay.purchase('item_energy_drink', 1, instant, { deferDrinkEffect: true }),
            onDrinkCollected: () => playRecoveryDrinkEffect(),
            isInputBlocked: () => this.packingGame?.isOpen === true || this.salonInterior?.isOpen === true || this.playerSocial?.dialog.open === true || this.cipherLobby?.isOpen === true || this.cipherLobby?.competitionRoom.dialog.open === true || this.cipherLobby?.trainingRoom.dialog.open === true || this.settingsModal?.dialog.open === true || this.playerProfileModal?.dialog.open === true || this.vivianStoreModal?.isOpen === true,
e4467a027e8cbbb4b3332b7d0218b1384450c9cd
            onReturnOffice: () => this.enterOffice(),
            onHeal: () => {
                const result = this.itemGameplay.restOnBench();
                if (result.success) toastManager.show('💖 기력 완충! 오늘의 벤치 회복을 사용했습니다.', true);
                return result;
            },
            onOpenStore: () => this.openVivianStore(),
            onOpenFurniture: () => toastManager.show('🛋️ [모던 프레임 가구점] 우디: "8x8 오피스를 품격 있게 바꿔줄 맞춤형 데스크와 인테리어 소품을 둘러보세요."'),
            onOpenApparel: () => this.salonInterior.open(),
            onOpenBookstore: () => toastManager.show('📚 [데이터 잉크 서점] 사서 소담: "영구 스탯을 강화해주는 투자 전문 도서와 섹터별 심층 인사이트 리포트입니다."'),
            onOpenSecurities: () => {
                this.cipherLobby.open();
            },
            onOpenBank: () => toastManager.show('🏦 [노드 파이낸스 은행] 지점장 차곡: "4주 정기 적금과 긴급 신용 대출 상담 창구입니다. 연체는 용납하지 않습니다."'),
            onOpenPub: () => toastManager.show('🍸 [미드나잇 펍] 브로커 도란: "5% 노이즈가 제거된 확정형 찌라시 거래와 지하 블랙잭 테이블을 취급하지."'),
            onOpenBarter: () => toastManager.show('⚖️ [더 바터 전당포] 전당포주 바터: "보유 가구나 주식을 담보로 LTV 60% 즉시 현금 대출이 가능하네."')
        });

        initPackingGame(this);

        // 6. Character Creation & Trader Registration Kiosk (GDD CORE_GDD_08)
        this.characterCreation = new CharacterCreation(this.appContainer, {
            onComplete: (userProfile) => this.onCharacterCreated(userProfile)
        });

}
