import { VIVIAN_ITEM_REGISTRY } from '../data/vivianStoreData.js';
import { marketEngine } from '../engine/marketEngine.js';
import { toastManager } from '../components/ToastManager.js';
import { MainHUD } from '../components/MainHUD.js?v=heart-hud-v1';
import { PlayerProfileModal } from '../components/PlayerProfileModal.js?v=retirement';
import { SettingsModal } from '../components/SettingsModal.js';
import { OfficeStage } from '../components/OfficeStage.js?v=door-seam-v2';
import { SmartphoneUI } from '../components/SmartphoneUI.js';
import { TradeModal } from '../components/TradeModal.js';
import { DetailedChartModal } from '../components/DetailedChartModal.js';
import { NewsDetailModal } from '../components/NewsDetailModal.js';
import { SettlementModal } from '../components/SettlementModal.js';
import { GameInventory as InventoryModal } from '../components/inventory/GameInventory.js';
import { FurnitureEditModal } from '../components/FurnitureEditModal.js?v=default-layout-v4';
import { FriendModal } from '../components/FriendModal.js';
import { RankingModal } from '../components/RankingModal.js';
import { AnnaDialogueModal } from '../components/AnnaDialogueModal.js';
import { finishDemo } from './DemoLifecycle.js';

export function initInterface() {
        // Main in-game status and navigation HUD.
        this.mainHUD = new MainHUD(this.appContainer, {
            onProfile: () => this.playerProfileModal.open(),
            onStaminaClick: (s) => toastManager.show(`❤️ 체력 (스테미너): ${s.current} / ${s.max} | 알바, 속독 등에 소모`),
            onInventory: () => this.inventoryModal.toggle(),
            onFurnitureEdit: () => this.furnitureEditModal.toggle(),
            onRanking: () => this.rankingModal.show(),
            onSettings: () => this.settingsModal.open()
        });

        // 3. 3D Isometric Rooftop Office Stage Background
        this.officeStage = new OfficeStage(this.appContainer, {
            onOpenComputer: () => { this.smartphoneUI.showPhone(); this.smartphoneUI.showStockApp(); },
            onRoomMessage: message => toastManager.show(message),
            onFurnitureEdit: () => this.furnitureEditModal.open(),
            isTutorialActive: () => !!this.annaTutorial?.isActive,
            isAnnaMarriageCompleted: () => this.userProfile?.annaMarriageCompleted === true,
            onOpenServerSelect: () => this.openServerSelect(),
            onTalkToAnna: () => this.annaDialogueModal?.show()
        });

        // 4. Smartphone Shell & CyberM HTS App
        this.smartphoneUI = new SmartphoneUI(this.appContainer, {
            onRequestRender: () => this.render(),
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            onOpenTradeModal: (stockId) => this.openTradeModal(stockId),
            onOpenNewsDetailModal: (newsId) => this.openNewsDetailModal(newsId),
            onTriggerSettlement: () => this.openSettlement(),
            onReset: () => this.reset(),
            onPhoneOpened: () => this.annaTutorial?.notifyPhoneOpened(),
            onStockAppOpened: () => this.annaTutorial?.notifyStockAppOpened(),
            onSwitchTab: (tabName) => this.annaTutorial?.notifyTabSwitched(tabName)
        });

        // 5. Modals (Trade, Detailed Chart, News Detail, Settlement)
        this.tradeModal = new TradeModal(this.appContainer, {
            onOrderScreenOpened: () => this.annaTutorial?.notifyOrderScreenOpened(),
            onTutorialSubtab: tab => {
                const tutorial = this.annaTutorial;
                if (!tutorial?.isActive) return;
                const step = tutorial.historyCursor != null ? tutorial.dialogueHistory[tutorial.historyCursor] : tutorial.steps[tutorial.currentStepIdx];
                if ((step?.id === 'open_company_info' && tab === 'Info') || (step?.id === 'company_info_return' && tab === 'Chart')) {
                    if (tutorial.historyCursor != null) tutorial.advanceHistory(); else tutorial.nextStep();
                }
            },
            onClose: () => this.annaTutorial?.notifyTradeModalClosed(),
            getStock: (id) => marketEngine.stocks.get(id),
            getPendingOrders: id => marketEngine.limitOrders.filter(order => order.stockId === id),
            onCancelOrder: id => marketEngine.cancelLimitOrder(id),
            getTutorialOrderError: (id, isShort) => marketEngine.tutorialOrderError(id, isShort),
            getSellPreview: (id, qty, limit) => marketEngine.getSellPreview(id, qty, 'phone', limit),
            getExecutionPreview: (side, id, qty, lev) => marketEngine.getExecutionPreview(side, id, qty, lev, 'phone'),
            getOrderQuote: (price, qty, lev) => marketEngine.getOrderQuote(price, qty, lev, 'phone'),
            getPriceHistory: (id) => marketEngine.priceHistory.get(id),
            getChartHistory: id => marketEngine.getChartHistory(id),
            getOrderBook: (id) => marketEngine.getOrderBook(id),
            getNews: () => marketEngine.news,
            isFavorite: (id) => this.smartphoneUI.favorites.has(id),
            isLevel10Unlocked: () => marketEngine.isLevel10Unlocked,
            onToggleFavorite: (id) => this.smartphoneUI.toggleFavorite(id),
            onOpenDetailedChart: (id) => this.openDetailedChart(id),
            onOpenNewsDetailModal: (newsId) => this.openNewsDetailModal(newsId),
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            getAccountSummary: id => {
                const positions = [...marketEngine.portfolio.values()].filter(p => p.id === id && !p.isShort);
                const quantity = positions.reduce((sum, p) => sum + p.qty, 0);
                return { cash: marketEngine.cash, quantity, averagePrice: quantity ? positions.reduce((sum, p) => sum + p.qty * p.avgPrice, 0) / quantity : 0 };
            },
            getMaxSellQty: id => Math.min(marketEngine.heldQuantity(id), this.itemEngine?.orderLimit() || Infinity),
            getMaxQty: (id, lev, limitPrice, isShort) => {
                const s = marketEngine.stocks.get(id);
                if (!s || s.price <= 0) return 1;
                return Math.max(1, Math.min(this.itemEngine?.orderLimit() || Infinity, limitPrice ? marketEngine.getMaxOrderQty(limitPrice, lev, 'phone') : marketEngine.getExecutionPreview(isShort ? 'short' : 'buy', id, Number.MAX_SAFE_INTEGER, lev, 'phone').quantity));
            },
            onBuy: (id, qty, lev, limit) => {
                this.annaTutorial?.reviewRecommendation();
                const res = limit === null || limit === undefined ? marketEngine.buyStock(id, qty, lev) : marketEngine.placeLimitOrder('buy', id, qty, lev, limit);
                this.annaTutorial?.syncRecommendation();
                toastManager.show(res.msg, res.success);
                if (res.success) { this.tradeModal.updateContent(); if (res.quantity > 0) this.annaTutorial?.notifyStockPurchased(id); }
            },
            onSell: (id, qty, limit) => {
                const res = limit === null || limit === undefined ? marketEngine.sellStock(id, qty) : marketEngine.placeLimitOrder('sell', id, qty, 1, limit);
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
                if (res.achievement) this.smartphoneUI.bubbleAppModule.offerAchievementShare(res.achievement, this.userProfile?.name || '나');
            },
            onShort: (id, qty, lev, limit) => {
                this.annaTutorial?.reviewRecommendation();
                const res = limit === null || limit === undefined ? marketEngine.shortStock(id, qty, lev) : marketEngine.placeLimitOrder('short', id, qty, lev, limit);
                this.annaTutorial?.syncRecommendation();
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
            }
        });

        this.detailedChartModal = new DetailedChartModal(this.appContainer, {
            onClose: () => this.annaTutorial?.notifyDetailedChart(false),
            getStock: (id) => marketEngine.stocks.get(id), getPriceHistory: (id) => marketEngine.priceHistory.get(id), getChartHistory: id => marketEngine.getChartHistory(id)
        });
        this.newsDetailModal = new NewsDetailModal(this.appContainer, {
            getNewsItem: (id) => marketEngine.news.find(n => n.id === id), onOpenTradeModal: (stockId) => this.openTradeModal(stockId)
        });
        this.settlementModal = new SettlementModal(this.appContainer, {
            onClose: final => { if (final) { marketEngine.stopEngine(); void finishDemo(this); } }
        });

        // Friend & Social System Modal (MOD_GDD_09)
        this.friendModal = new FriendModal(this.appContainer, {
            getRankingProfile: () => ({ name: this.userProfile?.nickname, title: this.userProfile?.trait?.title || '트레이더', netWorth: marketEngine.getState().totalNetWorth }),
            onOpenBubbleChat: (friend) => {
                this.smartphoneUI.openBubbleAppWithFriend(friend);
            }
        });

        this.settingsModal = new SettingsModal(this.appContainer, {
            onQuit: () => this.quit(),
            canQuit: () => true,
            isTutorialActive: () => this.isTutorialNavigationBlocked()
        });
        this.playerProfileModal = new PlayerProfileModal(this.appContainer, {
            getProfile: () => this.userProfile,
            getPlayerLevel: () => this.itemEngine?.playerLevel() ?? 1,
            getLevelProgress: () => this.itemEngine?.playerLevelProgress(),
            getMarketState: () => marketEngine.getState(),
            getStats: () => this.itemEngine?.stats(),
            getStamina: () => this.mainHUD.stamina
        });

        // Dedicated Social Ranking Leaderboard Modal
        this.rankingModal = new RankingModal(this.appContainer, {
            getProfile: () => ({ name: this.userProfile?.nickname, title: this.userProfile?.trait?.title || '트레이더', netWorth: marketEngine.getState().totalNetWorth, weeklyReturn: null }),
            getRecords: async () => {
                if (this.isLocalSession || !window.stockWarsPresence?.leaderboard) return { records: [], error: '내 실제 플레이 기록 · 온라인 전체 랭킹은 서버 연결 후 이용할 수 있습니다.' };
                const profile = { netWorth: marketEngine.getState().totalNetWorth, title: this.userProfile?.trait?.title || '트레이더' };
                return window.stockWarsPresence.leaderboard(profile);
            }
        });

        // Manager Anna Interactive Dialogue Modal (MOD_GDD_07_1)
        this.annaDialogueModal = new AnnaDialogueModal(this.appContainer, {
            onGainStamina: (amount) => {
                const max = this.mainHUD.stamina.max;
                const next = Math.min(max, this.mainHUD.stamina.current + amount);
                this.mainHUD.updateStamina(next);
            }
        });

        // Inventory Modal (Player Bag & Item Storage)
        this.inventoryModal = new InventoryModal(this.appContainer, {
            onChanged: () => this.itemGameplay?.sync(),
            onRumorOpened: (item, decoded) => { this.annaTutorial?.explainOpenedRumor(item, decoded); },
            onRumorClosed: () => {
                const tutorial = this.annaTutorial;
                if (tutorial?.isActive && tutorial.historyCursor == null && tutorial.steps[tutorial.currentStepIdx]?.id === 'rumor_actual_close') tutorial.nextStep();
            },
            getAnalysisLevel: () => this.itemEngine?.stats().analysis ?? 1,
            getAnalysisProgress: () => this.itemEngine?.analysisProgress(),
            beginRumorQuiz: itemId => {
                const result = this.itemEngine.beginRumorQuiz(itemId);
                this.itemGameplay.sync();
                return result;
            },
            submitRumorQuiz: (itemId, questionKey, choiceIndex) => {
                const result = this.itemEngine.submitRumorQuiz(itemId, questionKey, choiceIndex);
                this.itemGameplay.sync();
                return result;
            },
            getDecoderTargets: () => this.itemEngine?.decoderTargets() ?? [],
            decodeRumor: (rumorId, powderId = 'item_crypto_decoder') => {
                const result = this.itemEngine.use(powderId, { rumorId });
                this.itemGameplay.sync();
                return result;
            },
            onActivateItem: item => {
                if (!VIVIAN_ITEM_REGISTRY.some(product => product.id === item.id)) return false;
                this.itemGameplay.activate(item.id);
                return true;
            },
            onOpen: () => this.annaTutorial?.notifyInventoryOpened(),
            onClose: () => {
                const tutorial = this.annaTutorial;
                if (!tutorial?.isActive) return;
                if (tutorial.historyCursor != null) {
                    if (tutorial.dialogueHistory[tutorial.historyCursor]?.id === 'close_inventory_guide') tutorial.advanceHistory();
                } else if (tutorial.steps[tutorial.currentStepIdx]?.id === 'close_inventory_guide') tutorial.nextStep();
            },
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            onUseConsumable: (item) => {
                const addStamina = ['item_caffeine_shot', 'item_energy_drink'].includes(item.id) ? 1 : 0;
                if (addStamina > 0) {
                    const max = this.mainHUD.stamina.max;
                    const next = Math.min(max, this.mainHUD.stamina.current + addStamina);
                    this.mainHUD.updateStamina(next);
                    toastManager.show(`✨ [${item.name}] 섭취! 스테미너 +${addStamina} 충전 (${next}/${max})`, true);
                } else {
                    toastManager.show(`✨ [${item.name}] 아이템을 사용했습니다.`, true);
                }
            }
        });

        // Furniture Edit Modal (Dedicated 8x8 Office Customizer)
        this.furnitureEditModal = new FurnitureEditModal(this.appContainer, {
            stage: this.officeStage,
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            onSaveLayout: (list) => toastManager.show(`💾 [오피스 인테리어] 총 ${list.filter(f => f.placed).length}개 가구 저장 완료!`, true)
        });

}
