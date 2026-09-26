/**
 * SmartphoneUI Component (스마트폰 OS 쉘 & HTS 마스터 컨트롤러)
 * Unity equivalent: SmartphoneOSController.cs / UIHTSManager.cs
 * 
 * Modular architecture:
 * - HomeTab: Net worth, 7-day goal, cipher index, recent stocks
 * - StockListTab: Real-time stock list, filters, search, favorites, sorting, marquee
 * - NewsTab: Verified corporate news and disclosures
 * - PortfolioTab: User profile, stock holding list, sector allocation chart
 * - BubbleApp: In-game anonymous SNS and mentor messaging
 */

import { HomeTab } from './smartphone/HomeTab.js';
import { StockListTab } from './smartphone/StockListTab.js';
import { NewsTab } from './smartphone/NewsTab.js';
import { PortfolioTab } from './smartphone/PortfolioTab.js';
import { BubbleApp } from './smartphone/BubbleApp.js';
import { getSmartphoneShellHtml } from './smartphone/SmartphoneShellTemplate.js';

export class SmartphoneUI {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.activeAppTab = 'Home';
        this.statusClockTimer = null;

        this.render();
        this.initDOM();
        this.initSubComponents();
        this.initEventListeners();
        this.initStatusClock();
    }

    render() {
        this.container.insertAdjacentHTML('beforeend', getSmartphoneShellHtml());
    }

    initDOM() {
        this.statusClock = document.getElementById('statusClock');
        this.homeScreen = document.getElementById('homeScreen');
        this.stockApp = document.getElementById('stockApp');
        this.bubbleApp = document.getElementById('bubbleApp');
        this.iconStockApp = document.getElementById('iconStockApp');
        this.iconBubbleApp = document.getElementById('iconBubbleApp');
        this.iconMemoApp = document.getElementById('iconMemoApp');
        this.iconAchieveApp = document.getElementById('iconAchieveApp');
        this.iconSettingsApp = document.getElementById('iconSettingsApp');

        this.headerDayBadge = document.getElementById('headerDayBadge');
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.tabViews = document.querySelectorAll('.tab-view');
        this.btnPhysicalHome = document.getElementById('btnPhysicalHome');
        this.btnMinimizeHeader = document.getElementById('btnMinimizeHeader');
        this.floatingPhoneBtn = document.getElementById('floatingPhoneBtn');
    }

    initSubComponents() {
        this.homeTab = new HomeTab({
            summaryCard: document.getElementById('summaryCard'),
            settlementDDay: document.getElementById('settlementDDay'),
            homeNetWorth: document.getElementById('homeNetWorth'),
            homeCash: document.getElementById('homeCash'),
            homePortfolioVal: document.getElementById('homePortfolioVal'),
            homeProfitLoss: document.getElementById('homeProfitLoss'),
            rentGoalText: document.getElementById('rentGoalText'),
            rentProgressFill: document.getElementById('rentProgressFill'),
            bannerCipherVal: document.getElementById('bannerCipherVal'),
            bannerCipherChange: document.getElementById('bannerCipherChange'),
            widgetIndex: document.getElementById('widgetIndex'),
            widgetIndexSub: document.getElementById('widgetIndexSub'),
            recentStocksGrid: document.getElementById('recentStocksGrid')
        }, {
            onSwitchTab: (tab) => this.switchTab(tab),
            onOpenTradeModal: (stockId) => {
                if (this.callbacks.onOpenTradeModal) this.callbacks.onOpenTradeModal(stockId);
            }
        });

        this.stockListTab = new StockListTab({
            searchInput: document.getElementById('searchInput'),
            sectorChips: document.getElementById('sectorChips'),
            marketSortSelect: document.getElementById('marketSortSelect'),
            stockListContainer: document.getElementById('stockListContainer'),
            tickerMarquee: document.getElementById('tickerMarquee')
        }, {
            onRequestRender: () => {
                if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
            },
            onShowToast: (msg) => {
                if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg);
            },
            onOpenTradeModal: (stockId) => {
                this.recordRecentlyViewed(stockId);
                if (this.callbacks.onOpenTradeModal) this.callbacks.onOpenTradeModal(stockId);
            }
        });

        this.newsTab = new NewsTab({
            newsListContainer: document.getElementById('newsListContainer')
        }, {
            onOpenNewsDetailModal: (newsId) => {
                if (this.callbacks.onOpenNewsDetailModal) this.callbacks.onOpenNewsDetailModal(newsId);
            },
            onOpenTradeModal: (stockId) => {
                this.recordRecentlyViewed(stockId);
                if (this.callbacks.onOpenTradeModal) this.callbacks.onOpenTradeModal(stockId);
            }
        });

        this.portfolioTab = new PortfolioTab({
            profileAvatar: document.querySelector('.profile-avatar'),
            profileName: document.querySelector('.profile-name'),
            profileTitle: document.querySelector('.profile-title'),
            portfolioListContainer: document.getElementById('portfolioListContainer'),
            sectorDonutChart: document.getElementById('sectorDonutChart'),
            donutCenterVal: document.getElementById('donutCenterVal'),
            allocationLegendList: document.getElementById('allocationLegendList'),
            btnProfileSettlement: document.getElementById('btnProfileSettlement'),
            btnProfileReset: document.getElementById('btnProfileReset')
        }, {
            onTriggerSettlement: () => {
                if (this.callbacks.onTriggerSettlement) this.callbacks.onTriggerSettlement();
            },
            onReset: () => {
                if (this.callbacks.onReset) this.callbacks.onReset();
            },
            onOpenTradeModal: (stockId) => {
                this.recordRecentlyViewed(stockId);
                if (this.callbacks.onOpenTradeModal) this.callbacks.onOpenTradeModal(stockId);
            }
        });

        this.bubbleAppModule = new BubbleApp({
            bubbleApp: document.getElementById('bubbleApp'),
            btnBubbleBack: document.getElementById('btnBubbleBack'),
            btnBubbleRefresh: document.getElementById('btnBubbleRefresh'),
            bubbleActiveChannelName: document.getElementById('bubbleActiveChannelName'),
            bubbleChatFeed: document.getElementById('bubbleChatFeed'),
            bubbleMsgInput: document.getElementById('bubbleMsgInput'),
            btnBubbleSend: document.getElementById('btnBubbleSend'),
            badgeRumorCount: document.getElementById('badgeRumorCount'),
            bubbleBadgeHome: document.querySelector('#iconBubbleApp .app-badge')
        }, {
            onShowHomeScreen: () => this.showHomeScreen(),
            onShowToast: (msg) => {
                if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg);
            },
            onOpenTradeModal: (stockId) => {
                this.recordRecentlyViewed(stockId);
                if (this.callbacks.onOpenTradeModal) this.callbacks.onOpenTradeModal(stockId);
            }
        });
    }

    get favorites() {
        return this.stockListTab?.favorites || new Set();
    }

    saveFavorites() {
        this.stockListTab?.saveFavorites();
    }

    toggleFavorite(stockId) {
        this.stockListTab?.toggleFavorite(stockId);
    }

    updateUserProfile(profile) {
        this.portfolioTab?.updateUserProfile(profile);
    }

    recordRecentlyViewed(stockId) {
        this.homeTab?.recordRecentlyViewed(stockId);
    }

    showHomeScreen() {
        if (this.stockApp) {
            this.stockApp.classList.remove('active');
            this.stockApp.classList.add('hidden');
        }
        if (this.bubbleApp) {
            this.bubbleApp.classList.remove('active');
            this.bubbleApp.classList.add('hidden');
        }
        if (this.homeScreen) {
            this.homeScreen.classList.remove('hidden');
            this.homeScreen.classList.add('active');
        }
    }

    showStockApp() {
        if (this.homeScreen) {
            this.homeScreen.classList.remove('active');
            this.homeScreen.classList.add('hidden');
        }
        if (this.bubbleApp) {
            this.bubbleApp.classList.remove('active');
            this.bubbleApp.classList.add('hidden');
        }
        if (this.stockApp) {
            this.stockApp.classList.remove('hidden');
            this.stockApp.classList.add('active');
        }
    }

    showBubbleApp() {
        if (this.homeScreen) {
            this.homeScreen.classList.remove('active');
            this.homeScreen.classList.add('hidden');
        }
        if (this.stockApp) {
            this.stockApp.classList.remove('active');
            this.stockApp.classList.add('hidden');
        }
        if (this.bubbleApp) {
            this.bubbleApp.classList.remove('hidden');
            this.bubbleApp.classList.add('active');
        }
        this.bubbleAppModule?.renderBubbleChannel();
    }

    initEventListeners() {
        this.iconStockApp?.addEventListener('click', () => {
            this.showStockApp();
            if (this.callbacks.onStockAppOpened) this.callbacks.onStockAppOpened();
        });

        this.iconBubbleApp?.addEventListener('click', () => this.showBubbleApp());

        this.iconMemoApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('📝 메모장: 주식 매매 일지 작성 기능 준비중');
        });
        this.iconAchieveApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('🏆 업적 시스템: [초보 탈출] 달성 완료');
        });
        this.iconSettingsApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('⚙️ 스마트폰 설정: 버전 v1.0.4');
        });

        this.btnPhysicalHome?.addEventListener('click', () => {
            if (this.stockApp?.classList.contains('active') || this.bubbleApp?.classList.contains('active')) {
                this.showHomeScreen();
            } else {
                this.showStockApp();
            }
        });

        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        const minimizePhone = (e) => {
            if (e) e.stopPropagation();
            document.body.classList.add('phone-minimized');
            document.body.classList.remove('phone-view-active');
            const toggleTxt = document.getElementById('txtFrameToggle');
            if (toggleTxt) toggleTxt.textContent = '스마트폰 열기';
        };

        const restorePhone = (e) => {
            if (e) e.stopPropagation();
            this.showHomeScreen();
            document.body.classList.remove('phone-minimized');
            document.body.classList.add('phone-view-active');
            const toggleTxt = document.getElementById('txtFrameToggle');
            if (toggleTxt) toggleTxt.textContent = '스마트폰 최소화';
            if (this.callbacks.onPhoneOpened) this.callbacks.onPhoneOpened();
        };

        this.floatingPhoneBtn?.addEventListener('click', restorePhone);
        this.btnMinimizeHeader?.addEventListener('click', minimizePhone);

        const deviceContainer = document.querySelector('.device-container');
        const phoneShell = document.querySelector('.phone-shell');
        if (deviceContainer && phoneShell) {
            deviceContainer.addEventListener('click', (e) => {
                if (document.body.classList.contains('phone-view-active') &&
                    !phoneShell.contains(e.target) && 
                    !e.target.closest('.modal-overlay') && 
                    !e.target.closest('.demo-top-bar') &&
                    !e.target.closest('.vn-tutorial-overlay')) {
                    minimizePhone(e);
                }
            });
        }
    }

    initStatusClock() {
        const update = () => {
            const now = new Date();
            const hrs = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            if (this.statusClock) this.statusClock.textContent = `${hrs}:${mins}`;
        };
        update();
        this.statusClockTimer = setInterval(update, 1000);
    }

    switchTab(tabName) {
        if (!tabName) return;
        this.activeAppTab = tabName;
        this.navTabs.forEach(t => {
            if (t.dataset.tab === tabName) t.classList.add('active');
            else t.classList.remove('active');
        });
        this.tabViews.forEach(v => v.classList.remove('active'));
        const view = document.getElementById(`tab${tabName}View`);
        if (view) view.classList.add('active');

        if (this.callbacks.onSwitchTab) this.callbacks.onSwitchTab(tabName);
    }

    updateState(state) {
        if (!state) return;

        if (this.headerDayBadge) {
            this.headerDayBadge.textContent = `Day ${state.day} / ${state.maxDays}`;
        }

        this.homeTab?.updateState(state);
        this.stockListTab?.updateState(state);
        this.newsTab?.updateState(state);
        this.portfolioTab?.updateState(state);
        this.bubbleAppModule?.updateState(state);
    }
}