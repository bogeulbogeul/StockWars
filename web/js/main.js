/**
 * StockWars Web App Main Bootstrap & Orchestrator
 * Unity equivalent: GameManager.cs / SceneManager.cs
 * Assembles and initializes all UI components (Prefabs) and binds MarketEngine state.
 */

import { marketEngine } from './engine/marketEngine.js';
import { weatherService } from './engine/weatherService.js';
import { toastManager } from './components/ToastManager.js';
import { TitleScreen } from './components/TitleScreen.js';
import { CharacterCreation } from './components/CharacterCreation.js';
import { TopDemoBar } from './components/TopDemoBar.js';
import { MainHUD } from './components/MainHUD.js';
import { OfficeStage } from './components/OfficeStage.js';
import { SmartphoneUI } from './components/SmartphoneUI.js';
import { TradeModal } from './components/TradeModal.js';
import { DetailedChartModal } from './components/DetailedChartModal.js';
import { NewsDetailModal } from './components/NewsDetailModal.js';
import { SettlementModal } from './components/SettlementModal.js';
import { ServerSelectModal } from './components/ServerSelectModal.js';
import { TownStage } from './components/TownStage.js';
import { AnnaTutorial } from './components/AnnaTutorial.js';
import { LogisticsMiniGame } from './components/LogisticsMiniGame.js';

class StockWarsApplication {
    constructor() {
        this.appContainer = document.getElementById('app') || document.body;
        this.userProfile = null;
        this.initComponents();
        this.bindEngine();
    }

    initComponents() {
        // 1. Top Presentation Demo Controls Bar
        this.topDemoBar = new TopDemoBar(this.appContainer, {
            onShowTitle: () => this.showTitleScreen(),
            onToggleStage: () => this.toggleStage(),
            onToggleFrame: () => this.togglePhoneFrame(),
            onOpenLogistics: () => this.logisticsMiniGame?.open(),
            onUnlockLevel20: () => this.toggleLevel20(),
            onNextDay: () => this.nextDay(),
            onTriggerSettlement: () => this.openSettlement(),
            onReset: () => this.reset()
        });

        // 2. Main Top Financial HUD Bar
        this.mainHUD = new MainHUD(this.appContainer, {
            onWeatherClick: () => {
                const w = weatherService.currentWeather;
                toastManager.show(`📍 실시간 로컬 날씨 (${w.city}): ${w.icon} ${w.text} ${w.temp}°C (습도: ${w.humidity}%)`);
            },
            onStaminaClick: (stamina) => {
                toastManager.show(`❤️ 체력 (스테미너): ${stamina.current} / ${stamina.max} | 알바 노동, 서점 속독 등 행동에 소모됩니다.`);
            },
            onRanking: () => toastManager.show('🏆 랭킹 시스템: 데모 버전 준비중입니다.'),
            onHelp: () => toastManager.show('❓ 도움말: 7일 동안 주식 투자로 수익을 극대화하여 월세를 지불하세요!'),
            onSettings: () => toastManager.show('⚙️ 환경 설정: 데모 옵션')
        });

        // 3. 3D Isometric Rooftop Office Stage Background
        this.officeStage = new OfficeStage(this.appContainer, {
            onOpenServerSelect: () => this.openServerSelect()
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
            getPriceHistory: (id) => marketEngine.priceHistory.get(id),
            getOrderBook: (id) => marketEngine.getOrderBook(id),
            getNews: () => marketEngine.news,
            isFavorite: (id) => this.smartphoneUI.favorites.has(id),
            isLevel20Unlocked: () => marketEngine.isLevel20Unlocked,
            onToggleFavorite: (id) => this.smartphoneUI.toggleFavorite(id),
            onOpenDetailedChart: (id) => this.openDetailedChart(id),
            onOpenNewsDetailModal: (newsId) => this.openNewsDetailModal(newsId),
            onShowToast: (msg, isSuccess) => toastManager.show(msg, isSuccess),
            getMaxQty: (id, lev) => {
                const s = marketEngine.stocks.get(id);
                if (!s || s.price <= 0) return 1;
                return Math.max(1, Math.floor((marketEngine.cash * lev) / s.price));
            },
            onBuy: (id, qty, lev) => {
                const res = marketEngine.buyStock(id, qty, lev);
                toastManager.show(res.msg, res.success);
                if (res.success) {
                    this.tradeModal.updateContent();
                    this.annaTutorial?.notifyStockPurchased(id);
                }
            },
            onSell: (id, qty) => {
                const res = marketEngine.sellStock(id, qty);
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
            },
            onShort: (id, qty, lev) => {
                const res = marketEngine.shortStock(id, qty, lev);
                toastManager.show(res.msg, res.success);
                if (res.success) this.tradeModal.updateContent();
            }
        });

        this.detailedChartModal = new DetailedChartModal(this.appContainer, {
            getStock: (id) => marketEngine.stocks.get(id),
            getPriceHistory: (id) => marketEngine.priceHistory.get(id)
        });

        this.newsDetailModal = new NewsDetailModal(this.appContainer, {
            getNewsItem: (id) => marketEngine.news.find(n => n.id === id),
            onOpenTradeModal: (stockId) => this.openTradeModal(stockId)
        });

        this.settlementModal = new SettlementModal(this.appContainer, {
            onClose: () => toastManager.show('7일차 정산 보고서 확인 완료')
        });

        // Server Selection Modal (Office Door Town Gateway)
        this.serverSelectModal = new ServerSelectModal(this.appContainer, {
            onConnect: (server) => this.enterTown(server)
        });

        // Logistics Mini-Game (Bit Logistics 60-second delivery)
        this.logisticsMiniGame = new LogisticsMiniGame(this.appContainer, {
            onComplete: (result) => {
                marketEngine.cash += result.goldReward;
                marketEngine.notify();
                toastManager.show(`📦 [비트 물류] 정산 완료: +${result.goldReward.toLocaleString()}G 급여 및 ${result.expReward} EXP가 지급되었습니다!`);
                if (result.hasRumor) {
                    setTimeout(() => {
                        toastManager.show('💌 [찌라시 알림] 비트 물류 동료가 보낸 주가 복선 정보가 스마트폰 메일함에 도착했습니다!');
                    }, 1200);
                }
            }
        });

        // 6. 2D Side-Scrolling Public Town Stage
        this.townStage = new TownStage(this.appContainer, {
            onReturnOffice: () => this.enterOffice(),
            onOpenLogistics: () => {
                this.logisticsMiniGame.open();
            },
            onOpenStore: () => {
                toastManager.show('🏪 [비비안 잡화점] 비비안: "어서 오세요! 기력 회복용 특제 에너지 드링크와 찌라시가 준비되어 있어요."');
            },
            onOpenFurniture: () => {
                toastManager.show('🛋️ [모던 프레임 가구점] 줄리안: "8x8 오피스를 품격 있게 바꿔줄 맞춤형 데스크와 인테리어 소품을 둘러보세요."');
            },
            onOpenApparel: () => {
                toastManager.show('👗 [테일러드 의상실] 클레어: "트레이더의 신뢰도를 높여주는 명품 수트와 커스텀 코스튬 쇼룸입니다."');
            },
            onOpenBookstore: () => {
                toastManager.show('📚 [데이터 잉크 서점] 사서 소피아: "영구 스탯을 강화해주는 투자 전문 도서와 섹터별 심층 인사이트 리포트입니다."');
            },
            onOpenSecurities: () => {
                toastManager.show('🏛️ [사이퍼 증권 본점] 에이전트 K: "중앙 트레이딩 플로어와 아레나 배틀룸에 오신 것을 환영합니다."');
                this.switchTab('exchange');
            },
            onOpenBank: () => {
                toastManager.show('🏦 [노드 파이낸스 은행] 지점장 샤일록: "4주 정기 적금과 긴급 신용 대출 상담 창구입니다. 연체는 용납하지 않습니다."');
            },
            onOpenPub: () => {
                toastManager.show('🍸 [미드나잇 펍] 브로커 안드레: "5% 노이즈가 제거된 확정형 찌라시 거래와 지하 블랙잭 테이블을 취급하지."');
            },
            onOpenBarter: () => {
                toastManager.show('⚖️ [더 바터 전당포] 전당포주 바터: "보유 가구나 주식을 담보로 LTV 60% 즉시 현금 대출이 가능하네."');
            }
        });

        // 6. Character Creation & Trader Registration Kiosk (GDD CORE_GDD_08)
        this.characterCreation = new CharacterCreation(this.appContainer, {
            onComplete: (userProfile) => this.onCharacterCreated(userProfile)
        });

        // 7. Title Screen (Game Entry / Main Menu)
        this.titleScreen = new TitleScreen(this.appContainer, {
            onStartGame: (mode) => {
                if (mode === 'CONTINUE') {
                    this.startGame('CONTINUE');
                } else {
                    this.characterCreation.open(mode);
                }
            },
            onOpenSettings: () => toastManager.show('⚙️ 게임 설정: 사운드 및 그래픽 옵션')
        });

        // 8. Anna Visual Novel Tutorial System (GDD CORE_GDD_10)
        this.annaTutorial = new AnnaTutorial(this.appContainer, {
            onGrantInitialFunds: (amount = 5000) => {
                if (marketEngine.cash === 0) {
                    marketEngine.cash = amount;
                    marketEngine.initialCash = amount;
                    marketEngine.notify();
                    toastManager.show(`💰 [입금 완료] 초기 지원금 +${amount.toLocaleString()} Gold가 계좌로 입금되었습니다!`, true);
                }
            },
            onOpenPhone: () => {
                document.body.classList.remove('phone-minimized');
                document.body.classList.add('phone-view-active');
                if (this.topDemoBar?.txtFrameToggle) {
                    this.topDemoBar.txtFrameToggle.textContent = '스마트폰 최소화';
                }
            },
            onSwitchTab: (tabName) => {
                this.smartphoneUI.switchTab(tabName);
            },
            onOpenTradeModal: (stockId) => {
                this.openTradeModal(stockId);
            },
            onComplete: ({ skipped }) => {
                marketEngine.setTutorialActive(false);
                if (marketEngine.cash === 0) {
                    marketEngine.cash = 5000;
                    marketEngine.initialCash = 5000;
                    marketEngine.notify();
                }
                if (!skipped) {
                    toastManager.show('🎉 안나 매니저와의 첫 실전 매매 튜토리얼을 완수했습니다! 자산 증식을 시작하세요.');
                } else {
                    toastManager.show('⏩ 튜토리얼을 건너뛰었습니다. (초기 지원금 5,000G 입금 완료)');
                }
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
    }

    updateAll(state) {
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
        this.startGame(userProfile.mode || 'NEW');
        const recommendation = marketEngine.getRecommendedTutorialStock(userProfile);
        this.annaTutorial?.start(userProfile, recommendation);
        toastManager.show(`🎉 [출입증 발급 완료] ${userProfile.nickname} (${userProfile.trait.title}) 트레이더님 환영합니다!`);
    }

    startGame(mode) {
        if (mode === 'DEMO') {
            marketEngine.cash = 5000000;
            marketEngine.initialCash = 5000000;
            marketEngine.day = 1;
            marketEngine.portfolio.clear();
            marketEngine.notify();
            toastManager.show('⚡ 시현 데모 모드 시작! (보유 자금 5,000,000G)');
        } else if (mode === 'NEW') {
            // Start with 0 Gold before Anna gives the initial grant dialogue
            marketEngine.cash = 0;
            marketEngine.initialCash = 0;
            marketEngine.day = 1;
            marketEngine.portfolio.clear();
            marketEngine.notify();
            this.smartphoneUI?.favorites?.clear();
            this.smartphoneUI?.saveFavorites();
            toastManager.show('🎮 새로운 게임 시작! (Day 1 • 오피스 입장)');
        } else {
            toastManager.show('💾 저장된 게임 데이터를 불러왔습니다.');
        }

        // Enter Home Office view first (smartphone minimized in bottom-right)
        document.body.classList.remove('phone-view-active');
        document.body.classList.add('phone-minimized');
        if (this.topDemoBar?.txtFrameToggle) {
            this.topDemoBar.txtFrameToggle.textContent = '스마트폰 열기';
        }
    }

    showTitleScreen() {
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
            toastManager.show('🔓 [레벨 20 해금] 공매도 및 3x/5x 고배율 마진 레버리지가 활성화되었습니다!');
        } else {
            toastManager.show('🔒 [레벨 20 잠금] 초보자 모드로 복구되었습니다.');
        }
    }

    nextDay() {
        marketEngine.nextDay();
        toastManager.show(`📅 Day ${marketEngine.day} 일차가 시작되었습니다.`);
    }

    openSettlement() {
        this.settlementModal.open(marketEngine.getState());
    }

    reset() {
        marketEngine.reset();
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
        this.serverSelectModal?.open();
    }

    enterTown(server = { name: '타운 2', ping: 14 }) {
        this.serverSelectModal?.close();
        this.officeStage?.hide?.();
        this.townStage?.show(server);
        if (this.topDemoBar?.txtStageToggle) {
            this.topDemoBar.txtStageToggle.textContent = '오피스로 이동';
        }
        toastManager.show(`🏙️ [${server.name}] 마을 광장에 도착했습니다! (A/D로 이동, 드래그/휠로 스크롤)`, true);
    }

    enterOffice() {
        this.townStage?.hide();
        this.officeStage?.show?.();
        if (this.topDemoBar?.txtStageToggle) {
            this.topDemoBar.txtStageToggle.textContent = '타운으로 이동';
        }
        toastManager.show('🏢 [홈 오피스] 개인 트레이딩 룸으로 복귀했습니다.', true);
    }

    toggleStage() {
        const isTownActive = document.body.classList.contains('town-mode-active');
        if (isTownActive) {
            this.enterOffice();
        } else {
            this.enterTown({ name: '타운 2', ping: 14 });
        }
    }

    switchTab(tabName) {
        this.smartphoneUI.switchTab(tabName);
    }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.stockWarsApp = new StockWarsApplication();
});
