import { worldNavigation } from './app/WorldNavigation.js';
import { OnlineSocialSync } from './app/OnlineSocialSync.js';
import { installItemGameplay } from './app/ItemGameplay.js';
import { VIVIAN_SHOP_CATALOG } from './data/vivianStoreData.js';
import { getRandomRumorItem } from './data/inventoryData.js';
/**
 * StockWars Web App Main Bootstrap & Orchestrator
 * Unity equivalent: GameManager.cs / SceneManager.cs
 * Assembles and initializes all UI components (Prefabs) and binds MarketEngine state.
 */

import { marketEngine } from './engine/marketEngine.js';
import { weatherService } from './engine/weatherService.js';
import { timeOfDayService } from './engine/timeOfDayService.js';
import { toastManager } from './components/ToastManager.js';
import { TitleScreen } from './components/TitleScreen.js';
import { CharacterCreation } from './components/CharacterCreation.js';
import { TopDemoBar } from './components/TopDemoBar.js';
import { MainHUD } from './components/MainHUD.js';
import { PlayerSocial } from './components/PlayerSocial.js';
import { PlayerProfileModal } from './components/PlayerProfileModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { OfficeStage } from './components/OfficeStage.js?v=door-seam-v2';
import { SmartphoneUI } from './components/SmartphoneUI.js';
import { TradeModal } from './components/TradeModal.js';
import { DetailedChartModal } from './components/DetailedChartModal.js';
import { NewsDetailModal } from './components/NewsDetailModal.js';
import { SettlementModal } from './components/SettlementModal.js';
import { ServerSelectModal } from './components/ServerSelectModal.js';
import { TownStage } from './components/TownStage.js';
import { CipherLobby } from './components/CipherCanvasLobby.js';
import { AnnaTutorial } from './components/AnnaTutorial.js';
import { LogisticsMiniGame } from './components/LogisticsMiniGame.js?v=art-2';
import { InventoryModal } from './components/InventoryModal.js?v=vivian-effects-1';
import { FurnitureEditModal } from './components/FurnitureEditModal.js?v=default-layout-v4';
import { WardrobeModal } from './components/WardrobeModal.js';
import { VivianStoreModal } from './components/store/VivianStoreModal.js?v=vivian-effects-1';
import { FriendModal } from './components/FriendModal.js';
import { RankingModal } from './components/RankingModal.js';
import { AnnaDialogueModal } from './components/AnnaDialogueModal.js';

class StockWarsApplication {
    constructor() {
        this.appContainer = document.getElementById('app') || document.body;
        this.userProfile = null;
        this.initComponents();
        this.playerSocial = new PlayerSocial(this);
        installItemGameplay(this, marketEngine);
        this.titleScreen.btnContinue.disabled = !this.userProfile?.nickname;
        this.bindEngine();
        this.onlineSocialSync=new OnlineSocialSync(this);
    }

    initComponents() {
        // 1. Top Presentation Demo Controls Bar
        this.topDemoBar = new TopDemoBar(this.appContainer, {
            onShowTitle: () => this.showTitleScreen(),
            onToggleStage: () => this.toggleStage(),
            onToggleFrame: () => this.togglePhoneFrame(),
            onOpenLogistics: () => this.openLogisticsJob(),
            onUnlockLevel20: () => this.toggleLevel20(),
            onNextDay: () => this.nextDay(),
            onAddPlayerLevel: () => {
                if (!this.isLocalSession || !this.topDemoBar.isVisible()) return;
                const result = this.itemEngine.addDeveloperLevel();
                if (result.success) this.itemGameplay.sync();
                toastManager.show(result.message);
            },
            onTriggerSettlement: () => this.openSettlement(),
            onReset: () => this.reset()
        });

        // 2. Main Top Financial HUD Bar
        this.mainHUD = new MainHUD(this.appContainer, {
            onProfile: () => this.playerProfileModal.open(),
            onTimeClick: () => {
                const nextMeta = timeOfDayService.cycleNext();
                toastManager.show(`⏱️ 하늘 시간대 전환: ${nextMeta.icon} ${nextMeta.label} - ${nextMeta.desc}`);
            },
            onStaminaClick: (s) => toastManager.show(`❤️ 체력 (스테미너): ${s.current} / ${s.max} | 알바, 속독 등에 소모`),
            onInventory: () => this.inventoryModal.toggle(),
            onFurnitureEdit: () => this.furnitureEditModal.toggle(),
            onRanking: () => this.rankingModal.show(),
            onHelp: () => toastManager.show('❓ 도움말: 7일 동안 주식 투자로 수익을 극대화하여 월세를 지불하세요!'),
            onSettings: () => this.settingsModal.open()
        });

        // 3. 3D Isometric Rooftop Office Stage Background
        this.officeStage = new OfficeStage(this.appContainer, {
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
            getStock: (id) => marketEngine.stocks.get(id),
            getSellPreview: (id, qty) => marketEngine.getSellPreview(id, qty),
            getPriceHistory: (id) => marketEngine.priceHistory.get(id),
            getOrderBook: (id) => marketEngine.getOrderBook(id),
            getNews: () => marketEngine.news,
            isFavorite: (id) => this.smartphoneUI.favorites.has(id),
            isLevel10Unlocked: () => marketEngine.isLevel10Unlocked,
            onToggleFavorite: (id) => this.smartphoneUI.toggleFavorite(id),
            onOpenDetailedChart: (id) => this.openDetailedChart(id),
            onOpenNewsDetailModal: (newsId) => this.openNewsDetailModal(newsId),
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            getMaxQty: (id, lev) => {
                const s = marketEngine.stocks.get(id);
                if (!s || s.price <= 0) return 1;
                return Math.max(1, Math.min(this.itemEngine?.orderLimit() || Infinity, Math.floor((marketEngine.cash * lev) / s.price)));
            },
            onBuy: (id, qty, lev) => {
                const res = marketEngine.buyStock(id, qty, lev);
                toastManager.show(res.msg, res.success);
                if (res.success) { this.tradeModal.updateContent(); this.annaTutorial?.notifyStockPurchased(id); }
            },
            onSell: (id, qty) => {
                const res = marketEngine.sellStock(id, qty);
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
                if (res.achievement) this.smartphoneUI.bubbleAppModule.offerAchievementShare(res.achievement, this.userProfile?.name || '나');
            },
            onShort: (id, qty, lev) => {
                const res = marketEngine.shortStock(id, qty, lev);
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
            }
        });

        this.detailedChartModal = new DetailedChartModal(this.appContainer, {
            getStock: (id) => marketEngine.stocks.get(id), getPriceHistory: (id) => marketEngine.priceHistory.get(id)
        });
        this.newsDetailModal = new NewsDetailModal(this.appContainer, {
            getNewsItem: (id) => marketEngine.news.find(n => n.id === id), onOpenTradeModal: (stockId) => this.openTradeModal(stockId)
        });
        this.settlementModal = new SettlementModal(this.appContainer, {
            onClose: () => toastManager.show('7일차 정산 보고서 확인 완료')
        });

        // Friend & Social System Modal (MOD_GDD_09)
        this.friendModal = new FriendModal(this.appContainer, {
            onOpenBubbleChat: (friend) => {
                this.smartphoneUI.openBubbleAppWithFriend(friend);
            }
        });

        this.settingsModal = new SettingsModal(this.appContainer, {
            onExit: () => this.showTitleScreen()
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
        this.rankingModal = new RankingModal(this.appContainer);

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
            getAnalysisLevel: () => this.itemEngine?.stats().analysis ?? 1,
            getDecoderTargets: () => this.itemEngine?.decoderTargets() ?? [],
            decodeRumor: rumorId => {
                const result = this.itemEngine.use('item_crypto_decoder', { rumorId });
                this.itemGameplay.sync();
                return result;
            },
            onActivateItem: item => {
                if (!VIVIAN_SHOP_CATALOG.some(product => product.id === item.id)) return false;
                this.itemGameplay.activate(item.id);
                return true;
            },
            onOpen: () => this.annaTutorial?.notifyInventoryOpened(),
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

        // Wardrobe & Dressing Room Modal (Owned Apparel Management)
        this.wardrobeModal = new WardrobeModal(this.appContainer, {
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            onEquipChange: (item) => {
                const invItem = this.inventoryModal.items.find(i => i.id === item.id);
                if (invItem) invItem.isEquipped = item.isEquipped;
            }
        });

        // Furniture Edit Modal (Dedicated 8x8 Office Customizer)
        this.furnitureEditModal = new FurnitureEditModal(this.appContainer, {
            stage: this.officeStage,
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            onSaveLayout: (list) => toastManager.show(`💾 [오피스 인테리어] 총 ${list.filter(f => f.placed).length}개 가구 저장 완료!`, true)
        });

        // Server Selection Modal (Office Door Town Gateway)
        this.serverSelectModal = new ServerSelectModal(this.appContainer, {
            onConnect: (server) => this.enterTown(server)
        });

        // Logistics Mini-Game (Bit Logistics 60-second delivery)
        this.logisticsMiniGame = new LogisticsMiniGame(this.appContainer, {
            getTime: () => this.itemEngine?.now() ?? Date.now(),
            onComplete: (result) => {
                this.itemEngine.finishLabor(result.goldReward, result.expReward);
                this.itemGameplay.sync();
                toastManager.show(`📦 [비트 물류] +${result.goldReward.toLocaleString()}G / ${result.expReward} EXP (체력 -${this.itemEngine.laborCost()}: ${this.itemEngine.state.stamina}/${this.itemEngine.maxStamina()})`);
                
                if (result.hasRumor) {
                    const rumorItem = getRandomRumorItem();
                    this.inventoryModal?.addItem(rumorItem);
                    setTimeout(() => toastManager.show(`💌 [찌라시 수신] 비트 물류 동료가 보낸 [${rumorItem.name}] 찌라시가 가방에 도착했습니다!`), 1200);
                }
                this.enterTown(null, 'bit_logistics');
                this.annaTutorial?.notifyLogisticsJobCompleted(result);
            },
            onClose: () => this.enterTown(null, 'bit_logistics')
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

        this.cipherLobby = new CipherLobby(this.appContainer);
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
            getPlayerSocialProfile: () => ({ level: this.itemEngine?.playerLevel() || 1, trait: this.userProfile?.trait?.title || '' }),
            getVendingState: () => {
                this.itemEngine.tick();
                return { cash: marketEngine.cash, purchased: this.itemEngine.state.purchases.item_energy_drink || 0,
                    owned: this.itemEngine.state.inventory.find(item => item.id === 'item_energy_drink')?.quantity || 0 };
            },
            onPurchaseDrink: instant => this.itemGameplay.purchase('item_energy_drink', 1, instant),
            getBillboardState: () => ({
                cipherIndex: marketEngine.getCipherIndex(),
                news: marketEngine.news.filter(item => marketEngine.stocks.has(item.stockId))
            }),
            isInputBlocked: () => this.playerSocial?.dialog.open === true || this.cipherLobby?.isOpen === true || this.cipherLobby?.competitionRoom.dialog.open === true || this.cipherLobby?.trainingRoom.dialog.open === true || this.settingsModal?.dialog.open === true || this.playerProfileModal?.dialog.open === true || this.logisticsMiniGame?.isOpen === true || this.vivianStoreModal?.isOpen === true,
            onReturnOffice: () => this.enterOffice(),
            onOpenLogistics: () => this.openLogisticsJob(),
            onHeal: () => {
                const result = this.itemGameplay.restOnBench();
                if (result.success) toastManager.show('💖 기력 완충! 오늘의 벤치 회복을 사용했습니다.', true);
                return result;
            },
            onOpenStore: () => this.openVivianStore(),
            onOpenFurniture: () => toastManager.show('🛋️ [모던 프레임 가구점] 줄리안: "8x8 오피스를 품격 있게 바꿔줄 맞춤형 데스크와 인테리어 소품을 둘러보세요."'),
            onOpenApparel: () => toastManager.show('👗 [테일러드 의상실] 클레어: "트레이더의 신뢰도를 높여주는 명품 수트와 커스텀 코스튬 쇼룸입니다."'),
            onOpenBookstore: () => toastManager.show('📚 [데이터 잉크 서점] 사서 소피아: "영구 스탯을 강화해주는 투자 전문 도서와 섹터별 심층 인사이트 리포트입니다."'),
            onOpenSecurities: () => {
                this.cipherLobby.open();
            },
            onOpenBank: () => toastManager.show('🏦 [노드 파이낸스 은행] 지점장 샤일록: "4주 정기 적금과 긴급 신용 대출 상담 창구입니다. 연체는 용납하지 않습니다."'),
            onOpenPub: () => toastManager.show('🍸 [미드나잇 펍] 브로커 안드레: "5% 노이즈가 제거된 확정형 찌라시 거래와 지하 블랙잭 테이블을 취급하지."'),
            onOpenBarter: () => toastManager.show('⚖️ [더 바터 전당포] 전당포주 바터: "보유 가구나 주식을 담보로 LTV 60% 즉시 현금 대출이 가능하네."')
        });

        // 6. Character Creation & Trader Registration Kiosk (GDD CORE_GDD_08)
        this.characterCreation = new CharacterCreation(this.appContainer, {
            onComplete: (userProfile) => this.onCharacterCreated(userProfile)
        });

        // 7. Title Screen (Game Entry / Main Menu)
        this.titleScreen = new TitleScreen(this.appContainer, {
            onStartGame: async (mode) => {
                const sessionMode = mode === 'CONTINUE' ? this.userProfile?.mode : mode;
                this.isLocalSession = sessionMode === 'DEMO' || sessionMode === 'DEV';
                await window.stockWarsPresence?.setLocalMode?.(this.isLocalSession);
                this.onlineSocialSync?.receive([], null);
                if (this.onlineSocialSync?.inviteDialog) {
                    this.onlineSocialSync.inviteDialog.close();
                    this.onlineSocialSync.inviteDialog.remove();
                    this.onlineSocialSync.inviteDialog = null;
                }
                if (mode === 'CONTINUE') {
                    if (!this.userProfile?.nickname) { this.titleScreen.show(); toastManager.show('저장된 플레이어가 없습니다. 새 게임을 시작해 주세요.', false); return; }
                    this.smartphoneUI.updateUserProfile(this.userProfile);
                    this.officeStage?.updateUserProfile(this.userProfile);
                    this.townStage?.updateUserProfile(this.userProfile);
                    this.startGame('CONTINUE');
                } else {
                    this.characterCreation.open(mode);
                }
            },
            onOpenSettings: () => toastManager.show('⚙️ 게임 설정: 사운드 및 그래픽 옵션')
        });

        // 8. Anna Visual Novel Tutorial System (GDD CORE_GDD_10)
        this.annaTutorial = new AnnaTutorial(this.appContainer, {
            getMarketState: () => marketEngine.getState(),
            getFirstTradeLesson: () => marketEngine.firstTradeLesson,
            onSaveLesson: () => this.itemGameplay?.save(),
            onOpenSellGuide: (stockId) => {
                this.smartphoneUI.showStockApp();
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                this.smartphoneUI.switchTab('Profile');
                this.openTradeModal(stockId);
            },
            onGrantInitialFunds: (amount = 5000) => {
                if (marketEngine.cash === 0) {
                    marketEngine.cash = amount;
                    marketEngine.initialCash = amount;
                    marketEngine.notify();
                    toastManager.show(`💰 [입금 완료] 초기 지원금 +${amount.toLocaleString()} Gold가 계좌로 입금되었습니다!`, true);
                }
            },
            onCheckTutorialBuyAffordability: (stockId) => {
                const subsidy = marketEngine.ensureTutorialAffordability(stockId);
                if (subsidy > 0) {
                    toastManager.show(`🎁 안나 매니저의 추천주 수급 지원금 +${subsidy.toLocaleString()} Gold가 추가 입금되었습니다!`, 'info');
                }
            },
            onOpenPhone: () => {
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                if (this.topDemoBar?.txtFrameToggle) {
                    this.topDemoBar.txtFrameToggle.textContent = '스마트폰 최소화';
                }
            },
            onSwitchTab: (tabName) => this.smartphoneUI.switchTab(tabName),
            onOpenTradeModal: (stockId) => this.openTradeModal(stockId),
            onComplete: ({ skipped }) => {
                marketEngine.setTutorialActive(false);
                if (marketEngine.cash === 0) {
                    marketEngine.cash = 5000; marketEngine.initialCash = 5000; marketEngine.notify();
                }
                const reward = this.itemEngine.claimTutorialReward(skipped);
                this.itemGameplay.sync();
                toastManager.show(skipped ? '⏩ 튜토리얼을 건너뛰었습니다. (초기 지원금 5,000G 입금 완료)' : reward
                    ? '🎉 튜토리얼 완료! 정착 보너스 +2,000G가 입금되었습니다.'
                    : '🎉 안나 매니저와의 첫 실전 매매 튜토리얼을 완수했습니다!');
            }
        });
    }

    bindEngine() {
        marketEngine.subscribe(state => this.updateAll(state));
        this.updateAll(marketEngine.getState());

        weatherService.subscribe(weather => {
            this.mainHUD.updateWeather(weather);
        });
        weatherService.init();

        timeOfDayService.init();
    }

    updateAll(state) {
        this.annaTutorial?.notifyMarketUpdated(state);
        this.topDemoBar.updateState(state);
        this.mainHUD.updateState(state);
        this.smartphoneUI.updateState(state);

        if (this.titleScreen) {
            this.titleScreen.updateTicker(state.cipherIndex, state.stocks);
        }

        if (this.tradeModal.isOpen()) {
            this.tradeModal.updateContent();
        }
    }

    onCharacterCreated(userProfile) {
        this.userProfile = userProfile;
        this.smartphoneUI.updateUserProfile(userProfile);
        this.officeStage?.updateUserProfile(userProfile);
        this.townStage?.updateUserProfile(userProfile);
        this.enterOffice();
        this.startGame(userProfile.mode || 'NEW');
        const recommendation = marketEngine.getRecommendedTutorialStock(userProfile);
        this.annaTutorial?.start(userProfile, recommendation);
        toastManager.show(`🎉 [출입증 발급 완료] ${userProfile.nickname} (${userProfile.trait.title}) 트레이더님 환영합니다!`);
    }

    async startGame(mode) {
        const sessionMode = mode === 'CONTINUE' ? this.userProfile?.mode : mode;
        this.isLocalSession = sessionMode === 'DEMO' || sessionMode === 'DEV';
        await window.stockWarsPresence?.setLocalMode?.(this.isLocalSession);
        if (this.annaTutorial) this.annaTutorial.lessonEnabled = mode === 'CONTINUE';
        if (mode !== 'CONTINUE') marketEngine.firstTradeLesson = null;
        if (mode !== 'CONTINUE') this.itemGameplay.reset();
        this.officeStage?.anna?.resetForGameStart();
        if (mode === 'NEW' || mode === 'DEMO' || mode === 'DEV') {
            const isDeveloperMode = mode === 'DEMO' || mode === 'DEV';
            // Start with 0 Gold before Anna gives the initial grant dialogue
            marketEngine.cash = 0;
            marketEngine.initialCash = 0;
            marketEngine.day = 1;
            marketEngine.portfolio.clear();
            marketEngine.isLevel10Unlocked = false;
            marketEngine.notify();
            if (isDeveloperMode) this.topDemoBar?.show();
            else this.topDemoBar?.hide();
            if (this.logisticsMiniGame) this.logisticsMiniGame.completedJobsCount = 0;
            this.smartphoneUI?.favorites?.clear();
            this.smartphoneUI?.saveFavorites();

            // Enter Home Office view first (smartphone minimized in bottom-right)
            this.enterOffice();
            document.body.classList.remove('phone-view-active');
            document.body.classList.add('phone-minimized');
            if (this.topDemoBar?.txtFrameToggle) {
                this.topDemoBar.txtFrameToggle.textContent = '스마트폰 열기';
            }
            toastManager.show(isDeveloperMode
                ? '🛠️ 개발자 모드 시작! (Day 1 • 새 게임 진행 / 디버그 툴바 활성화)'
                : '🎮 새로운 게임 시작! (Day 1 • 오피스 입장)');
        } else {
            if (this.isLocalSession) this.topDemoBar?.show();
            else this.topDemoBar?.hide();
            this.enterOffice();
            document.body.classList.remove('phone-view-active');
            document.body.classList.add('phone-minimized');
            if (this.topDemoBar?.txtFrameToggle) {
                this.topDemoBar.txtFrameToggle.textContent = '스마트폰 열기';
            }
            toastManager.show('💾 저장된 게임 데이터를 불러왔습니다.');
        }
        this.itemGameplay.start();
    }

    showTitleScreen() {
        this.itemGameplay?.pause();
        this.titleScreen.btnContinue.disabled = !this.userProfile?.nickname;
        this.topDemoBar?.hide();
        if (this.titleScreen) {
            this.titleScreen.show();
        }
    }

    render() {
        this.updateAll(marketEngine.getState());
    }

    togglePhoneFrame() {
        const isMinimized = document.body.classList.contains('phone-minimized');
        if (isMinimized) {
            document.body.classList.remove('phone-minimized');
            document.body.classList.add('phone-view-active');
            if (this.topDemoBar?.txtFrameToggle) {
                this.topDemoBar.txtFrameToggle.textContent = '스마트폰 최소화';
            }
            this.annaTutorial?.notifyPhoneOpened();
        } else {
            document.body.classList.add('phone-minimized');
            document.body.classList.remove('phone-view-active');
            if (this.topDemoBar?.txtFrameToggle) {
                this.topDemoBar.txtFrameToggle.textContent = '스마트폰 열기';
            }
        }
    }

    toggleLevel20() {
        const isUnlocked = marketEngine.toggleLevel20Unlock();
        if (isUnlocked) {
            toastManager.show('🔓 [레벨 10 해금] 공매도 및 3x/5x 고배율 마진 레버리지가 활성화되었습니다!');
        } else {
            toastManager.show('🔒 [레벨 10 잠금] 초보자 모드로 복구되었습니다.');
        }
    }

    openLogisticsJob() {
        const curStamina = this.mainHUD?.stamina?.current ?? 3;
        if (curStamina < this.itemEngine.laborCost()) {
            toastManager.show('💔 [체력 고갈] 스테미너 하트가 부족하여 알바를 할 수 없습니다! 잡화점 에너지 드링크를 마시거나 마을 벤치에서 휴식하세요.');
            return;
        }
        this.annaTutorial?.notifyLogisticsOpened();
        if (this.itemEngine.state.passUntil > this.itemEngine.now() && confirm('퀵-패스로 비트 물류를 즉시 완료할까요? (수수료 0%, 체력 소모)\n취소하면 미니게임을 직접 진행합니다.')) {
            const result = this.itemEngine.quickJob();
            this.itemGameplay.sync();
            toastManager.show(result.message, result.success);
            if (result.success) this.annaTutorial?.notifyLogisticsJobCompleted(result);
            return;
        }
        this.logisticsMiniGame?.open({ userNickname: this.userProfile?.nickname || '신입' });
    }

    nextDay() {
        if (marketEngine.day >= marketEngine.maxDays) {
            this.openSettlement();
            return;
        }
        marketEngine.nextDay();
        this.itemEngine.advanceDay();
        this.itemGameplay.sync();
        const maxStamina = this.mainHUD?.stamina?.max || 3;
        this.mainHUD?.updateStamina(maxStamina);
        if (marketEngine.day >= marketEngine.maxDays) {
            this.openSettlement();
            return;
        }
        toastManager.show(`📅 Day ${marketEngine.day} 일차가 시작되었습니다. (💖 체력 완충)`);
    }

    openSettlement() {
        this.settlementModal.open(marketEngine.getState());
    }

    reset() {
        marketEngine.reset();
        this.itemGameplay.reset();
        this.mainHUD?.updateStamina(this.itemEngine.maxStamina());
        if (this.logisticsMiniGame) this.logisticsMiniGame.completedJobsCount = 0;
        this.smartphoneUI?.favorites?.clear();
        this.smartphoneUI?.saveFavorites();
        toastManager.show('🔄 시현 데모 데이터가 초기화되었습니다.');
    }

    openTradeModal(stockId) {
        this.smartphoneUI.recordRecentlyViewed(stockId);
        this.tradeModal.open(stockId);
        this.annaTutorial?.notifyTradeModalOpened(stockId);
    }

    openDetailedChart(stockId) {
        this.detailedChartModal.open(stockId);
    }

    openNewsDetailModal(newsId) {
        this.newsDetailModal.open(newsId);
    }

    openServerSelect() {
        if (this.isLocalSession) { void this.enterTown(); return; }
        this.serverSelectModal?.open();
    }

    switchTab(tabName) {
        this.smartphoneUI.switchTab(tabName);
    }
}

Object.assign(StockWarsApplication.prototype, worldNavigation);

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.stockWarsApp = new StockWarsApplication();
});

