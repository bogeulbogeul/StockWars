import { setPlayerCharacterStyle } from '../components/CharacterSprite.js';
import { marketEngine } from '../engine/marketEngine.js';
import { weatherService } from '../engine/weatherService.js';
import { timeOfDayService } from '../engine/timeOfDayService.js';
import { toastManager } from '../components/ToastManager.js';
import { DiaryModal } from '../components/DiaryModal.js';

export const applicationActions = {
    async enterGame() {
        this.isLocalSession = false;
        await window.stockWarsPresence?.setLocalMode?.(false);
        if (!this.userProfile?.nickname) { this.characterCreation.open('NEW'); return; }
        this.smartphoneUI.updateUserProfile(this.userProfile);
        this.officeStage.updateUserProfile(this.userProfile);
        this.townStage.updateUserProfile(this.userProfile);
        await this.startGame('CONTINUE');
    },
    bindEngine() {
        marketEngine.onLimitOrderResult = (order, result) => {
            toastManager.show(result.success ? '지정가 주문 체결: ' + result.msg : '지정가 주문 취소: ' + result.msg, result.success);
            if (result.success && order.side === 'buy') this.annaTutorial?.notifyStockPurchased(order.stockId);
        };
        marketEngine.subscribe(state => this.updateAll(state));
        this.updateAll(marketEngine.getState());

        weatherService.subscribe(weather => {
            this.mainHUD.updateWeather(weather);
        });
        weatherService.init();

        timeOfDayService.init();
    },

    updateAll(state) {
        if (this.demoEnded) return;
        if (state.day >= 7 && this.userProfile?.nickname && !this.demoSettlementShown) {
            this.demoSettlementShown = true;
            queueMicrotask(() => this.openSettlement());
        }
        this.syncTutorialNavigation();
        this.annaTutorial?.notifyMarketUpdated(state);
        this.mainHUD.updateState(state);
        this.smartphoneUI.updateState(state);


        if (this.detailedChartModal && !this.detailedChartModal.modal.classList.contains('hidden')) {
            this.detailedChartModal.updateContent();
        }
        if (this.tradeModal.isOpen()) {
            this.tradeModal.updateContent();
        }
    },

    async onCharacterCreated(userProfile) {
        setPlayerCharacterStyle(userProfile.styleId);
        this.userProfile = { ...userProfile, firstTutorialCompleted: false, tutorialCheckpoint: 'welcome_1' };
        this.smartphoneUI.updateUserProfile(this.userProfile);
        this.officeStage?.updateUserProfile(userProfile);
        this.townStage?.updateUserProfile(userProfile);
        await this.startGame(userProfile.mode || 'NEW');
        const recommendation = marketEngine.getRecommendedTutorialStock(userProfile);
        this.annaTutorial?.start(userProfile, recommendation);
    },

    async startGame(mode) {
        if (!['NEW', 'CONTINUE'].includes(mode)) throw new Error('지원하지 않는 시작 방식입니다.');
        toastManager.setQuietMode(mode !== 'CONTINUE' || this.userProfile?.firstTutorialCompleted === false);
        this.isLocalSession = false;
        await window.stockWarsPresence?.setLocalMode?.(this.isLocalSession);
        if (this.annaTutorial) this.annaTutorial.lessonEnabled = mode === 'CONTINUE' && this.userProfile?.firstTutorialCompleted === true;
        if (mode !== 'CONTINUE') { marketEngine.firstTradeLesson = null; marketEngine.limitOrders = []; marketEngine.tradeHistory = []; marketEngine.orderBooks.clear(); }
        if (mode !== 'CONTINUE') this.itemGameplay.reset();
        void this.playerSocial?.refresh();
        this.officeStage?.anna?.resetForGameStart();
        if (mode === 'NEW') {
            // Start with 0 Gold before Anna gives the initial grant dialogue
            marketEngine.rentSettlement = null;
            marketEngine.cash = 0;
            marketEngine.initialCash = 0;
            marketEngine.day = 1;
            marketEngine.portfolio.clear();
            marketEngine.isLevel10Unlocked = false;
            marketEngine.notify();
            this.smartphoneUI?.favorites?.clear();
            this.smartphoneUI?.saveFavorites();

            // Enter Home Office view first (smartphone minimized in bottom-right)
            this.enterOffice();
            document.body.classList.remove('phone-view-active');
            document.body.classList.add('phone-minimized');


        } else {
            this.enterOffice();
            document.body.classList.remove('phone-view-active');
            document.body.classList.add('phone-minimized');

            toastManager.show('💾 저장된 게임 데이터를 불러왔습니다.');
        }
        this.itemGameplay.start();
        if (mode === 'CONTINUE' && this.userProfile?.firstTutorialCompleted === false) {
            let checkpoint = this.userProfile.tutorialCheckpoint || 'welcome_1';
            if (['logistics_intro', 'enter_logistics', 'logistics_completed', 'rumor_inventory_guide', 'stamina_recovery_guide'].includes(checkpoint)) checkpoint = 'stock_basics_budget';
            const lesson = marketEngine.firstTradeLesson;
            if (lesson && ['welcome_1', 'open_phone'].includes(checkpoint)) checkpoint = 'celebrate';
            if (this.itemEngine.state.tutorialRecoveryDrinkClaimed && checkpoint === 'stamina_recovery_guide') checkpoint = 'stock_basics_budget';
            const recommendation = lesson
                ? { stock: marketEngine.stocks.get(lesson.stockId) }
                : marketEngine.getRecommendedTutorialStock(this.userProfile, marketEngine.cash || 5000);
            marketEngine.isTutorialActive = true;
            if (lesson) marketEngine.tutorialStockId = lesson.stockId;
            this.annaTutorial.start(this.userProfile, recommendation, checkpoint);
        }
    },

    isTutorialNavigationBlocked() {
        return false; // Tutorial chapters can now be saved and resumed.
    },

    syncTutorialNavigation() {
        toastManager.setQuietMode(this.annaTutorial?.isActive === true);
        this.settingsModal?.syncNavigation();
        const active = this.isTutorialNavigationBlocked();
        if (this.lastTutorialLock !== active) {
            this.lastTutorialLock = active;
            window.stockWarsDesktop?.setTutorialActive?.(active);
        }
    },

    async quit() {
        if (this.isTutorialNavigationBlocked()) return { error: '튜토리얼 완료 후 게임을 종료할 수 있어요.' };
        this.settingsModal?.dialog.close();
        this.diaryModal ||= new DiaryModal(this);
        this.diaryModal.open();
        return {};
    },


    render() {
        this.updateAll(marketEngine.getState());
    },







    openSettlement() {
        if (this.demoEnded) return;
        if (marketEngine.day >= 7) this.demoSettlementShown = true;
        this.settlementModal.open(marketEngine.settleRent());
        this.itemGameplay.save();
    },

    reset() {
        marketEngine.reset();
        this.itemGameplay.reset();
        this.mainHUD?.updateStamina(this.itemEngine.maxStamina());
        this.smartphoneUI?.favorites?.clear();
        this.smartphoneUI?.saveFavorites();
        toastManager.show('🔄 게임 데이터가 초기화되었습니다.');
    },

    openTradeModal(stockId) {
        this.smartphoneUI.recordRecentlyViewed(stockId);
        this.tradeModal.open(stockId);
        this.annaTutorial?.notifyTradeModalOpened(stockId);
    },

    openDetailedChart(stockId) {
        this.detailedChartModal.open(stockId);
        this.annaTutorial?.notifyDetailedChart(true);
    },

    openNewsDetailModal(newsId) {
        this.newsDetailModal.open(newsId);
    },

    openServerSelect() {
        if (this.isLocalSession) { void this.enterTown(); return; }
        this.serverSelectModal?.open();
        this.annaTutorial?.notifyServerSelectOpened();
    },

    switchTab(tabName) {
        this.smartphoneUI.switchTab(tabName);
    },};
