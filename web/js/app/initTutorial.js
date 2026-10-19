import { playRecoveryDrinkEffect } from '../components/RecoveryDrinkEffect.js';
import { annaTradeTab } from '../components/tutorial/annaTradeFocus.js';
import { marketEngine } from '../engine/marketEngine.js';
import { toastManager } from '../components/ToastManager.js';
import { AnnaTutorial } from '../components/AnnaTutorial.js';

export function initTutorial() {
        // 8. Anna Visual Novel Tutorial System (GDD CORE_GDD_10)
        this.annaTutorial = new AnnaTutorial(this.appContainer, {
            onRumorPreview: preview => {
                const popup = this.inventoryModal.rumorPopup;
                popup.docText.textContent = preview.text;
                popup.analysisStatus.textContent = `${preview.actual ? '현재 해석' : '해석 미리보기'} · 분석 LV ${preview.level}`;
            },
            onPutPhoneAway: () => this.smartphoneUI.minimizePhone(),
            onTutorialTradeStep: stepId => {
                if (stepId === 'close_inventory_guide' && this.inventoryModal.modal.classList.contains('hidden')) this.inventoryModal.open();
                if (stepId.startsWith('server_')) this.serverSelectModal?.open();
                if (!this.tradeModal.isOpen()) return;
                this.tradeModal.switchSubtab(annaTradeTab(stepId));
                if (['market_order_guide', 'limit_order_guide', 'buy_stock'].includes(stepId)) {
                    const limit = stepId === 'limit_order_guide';
                    this.tradeModal.orderTypeInput.value = limit ? 'limit' : 'market';
                    this.tradeModal.limitPriceInput.disabled = !limit;
                    if (limit && !this.tradeModal.limitPriceInput.value) this.tradeModal.limitPriceInput.value = marketEngine.stocks.get(this.tradeModal.selectedStockId)?.price || '';
                    this.tradeModal.updateCalculations();
                }
            },
            onRestoreLessonScreen: (screen, stockId) => {
                this.detailedChartModal.close(false);
                this.tradeModal.close();
                if (!screen.phone) { this.smartphoneUI.minimizePhone(); return; }
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                if (screen.phone === 'Home') this.smartphoneUI.showHomeScreen();
                else {
                    this.smartphoneUI.showStockApp();
                    this.smartphoneUI.switchTab(screen.tab);
                    if (screen.trade && stockId) this.tradeModal.open(stockId);
                }
            },
            onTutorialChartVisibility: visible => {
                if (visible && this.detailedChartModal.modal.classList.contains('hidden')) this.detailedChartModal.open(this.tradeModal.selectedStockId);
                else if (!visible) this.detailedChartModal.close(false);
            },
            getCurrentTutorialTab: () => this.smartphoneUI.activeAppTab,
            isTradeModalOpen: () => this.tradeModal.isOpen(),
            onActivityChanged: () => this.syncTutorialNavigation(),
            onInputStepChanged: () => {
                this.officeStage?.keysHeld.clear();
                if (this.officeStage) this.officeStage.targetTile = null;
                this.officeStage?.roomPackage?.cancel();
                this.townStage?.playerController?.keysHeld.clear();
            },
            getMarketState: () => marketEngine.getState(),
            getFirstTradeLesson: () => marketEngine.firstTradeLesson,
            onSaveLesson: () => this.itemGameplay?.save(),
            onCheckpoint: checkpoint => {
                if (checkpoint && this.userProfile?.firstTutorialCompleted === false) {
                    this.userProfile.tutorialCheckpoint = checkpoint;
                    this.itemGameplay?.save();
                }
            },
            onSkipTutorialChapter: checkpoint => {
                this.tradeModal.close();
                this.inventoryModal.close();
                if (checkpoint === 'celebrate') {
                    this.smartphoneUI.showStockApp();
                    document.body.classList.remove('phone-minimized');
                    document.body.classList.add('phone-view-active');
                    this.smartphoneUI.switchTab('Market');
                } else {
                    this.smartphoneUI.minimizePhone();
                }
            },
            onRestoreTutorialChapter: checkpoint => {
                if (checkpoint === 'celebrate') {
                    this.smartphoneUI.showStockApp();
                    document.body.classList.remove('phone-minimized');
                    document.body.classList.add('phone-view-active');
                    this.smartphoneUI.switchTab('Market');
                }
            },
            onTutorialRecoveryDrink: async () => {
                const result = this.itemEngine.claimTutorialRecoveryDrink();
                this.itemGameplay.sync();
                if (result.success && !result.stored && result.recovered !== undefined && !result.message.startsWith('이미')) await playRecoveryDrinkEffect();
                toastManager.show(result.message, result.success);
                return result;
            },
            onOpenSellGuide: (stockId) => {
                this.smartphoneUI.showStockApp();
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                this.smartphoneUI.switchTab('Profile');
                this.openTradeModal(stockId);
            },
            onGrantInitialFunds: (amount = 5000) => {
                if (!this.userProfile.initialFundsGranted && marketEngine.cash === 0) {
                    this.userProfile.initialFundsGranted = true;
                    marketEngine.cash = amount;
                    marketEngine.initialCash = amount;
                    marketEngine.notify();
                    toastManager.show(`💰 [입금 완료] 초기 지원금 +${amount.toLocaleString()} Gold가 계좌로 입금되었습니다!`, true);
                }
            },
            onRefreshRecommendation: () => marketEngine.refreshTutorialRecommendation(),
            getTutorialTargetId: () => marketEngine.tutorialStockId,
            onRecommendationChanged: () => marketEngine.notify(),
            onOpenPhone: () => {
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');

            },
            onNavigateTutorial: (tabName) => {
                if (this.tradeModal.isOpen()) document.getElementById('btnCloseTradeModal')?.click();
                this.smartphoneUI.showStockApp();
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                this.smartphoneUI.switchTab(tabName);
            },
            onSwitchTab: (tabName) => this.smartphoneUI.switchTab(tabName),
            onOpenTradeModal: (stockId) => this.openTradeModal(stockId),
            onComplete: ({ skipped }) => {
                marketEngine.setTutorialActive(false);
                if (marketEngine.cash === 0) {
                    marketEngine.cash = 5000; marketEngine.initialCash = 5000; marketEngine.notify();
                }
                if (this.userProfile) this.userProfile.firstTutorialCompleted = true;
                const reward = this.itemEngine.claimTutorialReward(skipped);
                this.itemGameplay.sync();
                toastManager.show(skipped ? (reward ? '⏩ 튜토리얼 건너뛰기 · 정착 지원금 +2,000G 지급 (기본 지원금 총 7,000G)' : '⏩ 튜토리얼을 건너뛰었습니다. 정착 지원금은 이미 지급됐어요.') : reward
                    ? '🎉 튜토리얼 완료! 정착 보너스 +2,000G가 입금되었습니다.'
                    : '🎉 안나 매니저와의 첫 실전 매매 튜토리얼을 완수했습니다!');
            }
        });
}
