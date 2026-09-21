/**
 * SmartphoneUI Component
 * Unity equivalent: SmartphoneOSController.cs / UIHTSManager.cs
 * Renders the smartphone device shell, status bar, home screen,
 * and the main CyberM HTS trading application (Home, Market, News, Profile tabs).
 */

import { SECTORS } from '../data/stocksData.js';
import { createGeometricAvatarSVG } from './GeometricAvatar.js';

export class SmartphoneUI {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.selectedSector = 'ALL';
        this.selectedSortMode = 'POPULAR';
        this.activeAppTab = 'Home';
        this.favorites = this.loadFavorites();
        this.recentlyViewedIds = ['CLOUDBERRY', 'SOCIALMIX', 'ECOBATTERY', 'COZYPAY'];
        this.statusClockTimer = null;
        this.currentBubbleChannel = 'rumor';
        this.bubbleUserMessages = {
            rumor: [],
            anna: [],
            quant: []
        };
        this.latestState = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.initStatusClock();
    }

    render() {
        const html = `
            <!-- Smartphone Wrapper Container -->
            <div class="device-container">
                <!-- Physical Phone Shell -->
                <div class="phone-shell">
                    <div class="phone-speaker"></div>
                    <div class="phone-camera"></div>

                    <!-- Phone Screen -->
                    <div class="phone-screen">
                        <!-- Status Bar -->
                        <div class="status-bar">
                            <div class="status-time" id="statusClock">09:41</div>
                            <div class="status-notch"></div>
                        </div>

                        <!-- OS Home Screen (Default when smartphone opens) -->
                        <div id="homeScreen" class="os-screen active">
                            <div class="os-widget">
                                <div class="widget-title">사이퍼M Market Summary</div>
                                <div class="widget-body">
                                    <div class="widget-val" id="widgetIndex">Cipher 2,485.12</div>
                                    <div class="widget-sub gainer" id="widgetIndexSub">+1.42% Today</div>
                                </div>
                            </div>

                            <div class="app-grid">
                                <div class="app-icon-item" id="iconStockApp">
                                    <div class="app-icon stock-app-bg">
                                        <span class="app-emoji">📈</span>
                                        <span class="app-badge">HTS</span>
                                    </div>
                                    <div class="app-label">사이퍼M</div>
                                </div>
                                <div class="app-icon-item" id="iconBubbleApp">
                                    <div class="app-icon bubble-app-bg">
                                        <span class="app-emoji">💬</span>
                                        <span class="app-badge">3</span>
                                    </div>
                                    <div class="app-label">Bubble</div>
                                </div>
                                <div class="app-icon-item" id="iconMemoApp">
                                    <div class="app-icon memo-app-bg">
                                        <span class="app-emoji">📝</span>
                                    </div>
                                    <div class="app-label">메모</div>
                                </div>
                                <div class="app-icon-item" id="iconAchieveApp">
                                    <div class="app-icon achieve-app-bg">
                                        <span class="app-emoji">🏆</span>
                                    </div>
                                    <div class="app-label">업적</div>
                                </div>
                                <div class="app-icon-item" id="iconSettingsApp">
                                    <div class="app-icon option-app-bg">
                                        <span class="app-emoji">⚙️</span>
                                    </div>
                                    <div class="app-label">설정</div>
                                </div>
                            </div>
                        </div>

                        <!-- 사이퍼M HTS Main Application -->
                        <div id="stockApp" class="os-screen hidden">
                            <!-- Stock App Header -->
                            <div class="app-header">
                                <div class="app-title-area">
                                    <div class="app-logo">
                                        <span class="logo-icon">📈</span>
                                        <span class="logo-text">사이퍼M</span>
                                    </div>
                                    <div class="header-day-tag" id="headerDayBadge">Day 1 / 7</div>
                                </div>
                            </div>

                            <!-- Ticker Marquee Banner -->
                            <div class="ticker-marquee-wrapper">
                                <div class="ticker-content" id="tickerMarquee">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>

                            <!-- App Body Views -->
                            <div class="app-body">
                                <!-- VIEW 1: HOME TAB -->
                                <div id="tabHomeView" class="tab-view active">
                                    <!-- Portfolio Summary Card -->
                                    <div class="summary-card clickable-card" id="summaryCard" title="내 계좌/포트폴리오 상세 보기">
                                        <div class="card-header-row">
                                            <span class="card-title">내 자산 총액</span>
                                            <span class="settlement-badge" id="settlementDDay">정산 D-7</span>
                                        </div>
                                        <div class="net-worth-amount" id="homeNetWorth">5,000 Gold</div>
                                        <div class="card-stat-grid">
                                            <div class="stat-box">
                                                <div class="stat-lbl">보유 현금</div>
                                                <div class="stat-val" id="homeCash">5,000G</div>
                                            </div>
                                            <div class="stat-box">
                                                <div class="stat-lbl">주식 평가금</div>
                                                <div class="stat-val" id="homePortfolioVal">0G</div>
                                            </div>
                                            <div class="stat-box">
                                                <div class="stat-lbl">평가 손익</div>
                                                <div class="stat-val" id="homeProfitLoss">0G (0.0%)</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Target Rent Goal Progress -->
                                    <div class="rent-goal-box">
                                        <div class="goal-header">
                                            <span>🎯 1차 정산 목표 (월세 & 부채 이자)</span>
                                            <span class="goal-val" id="rentGoalText">5,000G 중 5,000G</span>
                                        </div>
                                        <div class="goal-progress-bar">
                                            <div class="goal-progress-fill" id="rentProgressFill" style="width: 100%;"></div>
                                        </div>
                                    </div>

                                    <!-- Cipher Index Banner -->
                                    <div class="cipher-index-banner">
                                        <div class="cipher-info">
                                            <span class="cipher-name">🏛️ 사이퍼 종합 주가지수</span>
                                            <span class="cipher-val" id="bannerCipherVal">2,485.12 pts</span>
                                        </div>
                                        <span class="cipher-change gainer" id="bannerCipherChange">+1.42%</span>
                                    </div>

                                    <!-- Recently Viewed Stocks Quick Grid -->
                                    <div class="section-title">👀 최근 조회한 종목</div>
                                    <div class="hot-stocks-grid" id="recentStocksGrid">
                                        <!-- Populated dynamically -->
                                    </div>
                                </div>

                                <!-- VIEW 2: MARKET TAB -->
                                <div id="tabMarketView" class="tab-view">
                                    <!-- Search & Sector Filters -->
                                    <div class="market-controls">
                                        <div class="search-bar">
                                            <span class="search-icon">🔍</span>
                                            <input type="text" id="searchInput" placeholder="종목명 또는 ID 검색...">
                                        </div>
                                        <div class="sector-chips" id="sectorChips">
                                            <button class="chip-btn active" data-sector="ALL">전체</button>
                                            <button class="chip-btn fav-chip" data-sector="FAV">⭐ 관심</button>
                                            <button class="chip-btn" data-sector="IT">IT</button>
                                            <button class="chip-btn" data-sector="Entertainment">엔터</button>
                                            <button class="chip-btn" data-sector="Bio">바이오</button>
                                            <button class="chip-btn" data-sector="Energy">에너지</button>
                                            <button class="chip-btn" data-sector="Finance">금융</button>
                                            <button class="chip-btn" data-sector="Aerospace">우주</button>
                                            <button class="chip-btn" data-sector="Infrastructure">인프라</button>
                                            <button class="chip-btn" data-sector="Retail">유통</button>
                                        </div>
                                        <div class="market-sort-bar" id="marketSortBar">
                                            <span class="sort-label">📊 정렬</span>
                                            <div class="sort-select-wrapper">
                                                <select id="marketSortSelect" class="market-sort-select">
                                                    <option value="POPULAR">🔥 인기순</option>
                                                    <option value="CHANGE">📈 변동률순</option>
                                                    <option value="PRICE">💰 높은가격순</option>
                                                    <option value="NAME">🔤 종목명순</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Stock List -->
                                    <div class="stock-list-container" id="stockListContainer">
                                        <!-- Populated dynamically -->
                                    </div>
                                </div>

                                <!-- VIEW 3: NEWS TAB -->
                                <div id="tabNewsView" class="tab-view">
                                    <div class="section-title">📰 증시 뉴스 & 공시</div>
                                    <div class="news-list" id="newsListContainer">
                                        <!-- Populated dynamically -->
                                    </div>
                                </div>

                                <!-- VIEW 4: PROFILE TAB -->
                                <div id="tabProfileView" class="tab-view">
                                    <div class="profile-card">
                                        <div class="profile-avatar">👨‍💼</div>
                                        <div class="profile-details">
                                            <div class="profile-name">트레이더 파트너</div>
                                            <div class="profile-title">초보 주식 트레이더 • 레벨 1</div>
                                            <div class="partner-status">🤝 매니저 안나(Anna) 협력 중</div>
                                        </div>
                                    </div>

                                    <!-- Sector Allocation Chart Card -->
                                    <div class="sector-allocation-card">
                                        <div class="section-title">📊 섹터별 투자 비중</div>
                                        <div class="allocation-body">
                                            <div class="donut-chart-wrapper">
                                                <canvas id="sectorDonutChart" width="110" height="110"></canvas>
                                                <div class="donut-center-info">
                                                    <span class="donut-center-lbl">보유</span>
                                                    <span class="donut-center-val" id="donutCenterVal">0개</span>
                                                </div>
                                            </div>
                                            <div class="allocation-legend-list" id="allocationLegendList">
                                                <!-- Legend items populated dynamically -->
                                            </div>
                                        </div>
                                    </div>

                                    <div class="section-title">💼 내 주식 포트폴리오</div>
                                    <div class="portfolio-list" id="portfolioListContainer">
                                        <!-- Populated dynamically -->
                                    </div>

                                    <div class="profile-actions">
                                        <button class="action-btn warning" id="btnProfileSettlement">
                                            🧾 7일차 정산 테스트 실행
                                        </button>
                                        <button class="action-btn danger" id="btnProfileReset">
                                            🔄 데이터 초기화
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom App Navigation Tabs -->
                            <div class="app-nav-bar">
                                <button class="nav-tab active" data-tab="Home">
                                    <span class="nav-icon">🏠</span>
                                    <span class="nav-label">홈</span>
                                </button>
                                <button class="nav-tab" data-tab="Market">
                                    <span class="nav-icon">📈</span>
                                    <span class="nav-label">주식 거래</span>
                                </button>
                                <button class="nav-tab" data-tab="News">
                                    <span class="nav-icon">📰</span>
                                    <span class="nav-label">공식 뉴스</span>
                                </button>
                                <button class="nav-tab" data-tab="Profile">
                                    <span class="nav-icon">👤</span>
                                    <span class="nav-label">내 계좌</span>
                                </button>
                            </div>
                        </div>

                        <!-- 3. Bubble Messenger Application (익명 찌라시 & 실시간 메신저) -->
                        <div id="bubbleApp" class="os-screen hidden">
                            <!-- Bubble App Header -->
                            <div class="bubble-header">
                                <button class="bubble-back-btn" id="btnBubbleBack" title="OS 홈 화면으로">
                                    <span class="back-arrow">←</span>
                                </button>
                                <div class="bubble-header-info">
                                    <div class="bubble-title-row">
                                        <span class="bubble-logo-icon">💬</span>
                                        <span class="bubble-title">Bubble</span>
                                        <span class="bubble-verified-tag">SECRET</span>
                                    </div>
                                    <div class="bubble-status-sub" id="bubbleActiveChannelName">🔥 여의도 참새방앗간 (익명 찌라시 룸)</div>
                                </div>
                                <button class="bubble-action-btn" id="btnBubbleRefresh" title="메시지 새로고침">
                                    <span>🔄</span>
                                </button>
                            </div>

                            <!-- Bubble Channel Selection Bar -->
                            <div class="bubble-channel-bar">
                                <button class="bubble-chan-tab active" data-channel="rumor">
                                    <span class="chan-icon">🔥</span>
                                    <span class="chan-name">참새방앗간</span>
                                    <span class="chan-badge" id="badgeRumorCount">2</span>
                                </button>
                                <button class="bubble-chan-tab" data-channel="anna">
                                    <span class="chan-icon">💼</span>
                                    <span class="chan-name">매니저 안나</span>
                                    <span class="chan-badge dot"></span>
                                </button>
                                <button class="bubble-chan-tab" data-channel="quant">
                                    <span class="chan-icon">⚡</span>
                                    <span class="chan-name">퀀트 AI</span>
                                </button>
                            </div>

                            <!-- Bubble Chat Feed Area -->
                            <div class="bubble-chat-feed" id="bubbleChatFeed">
                                <!-- Messages rendered dynamically -->
                            </div>

                            <!-- Bubble Bottom Message Input Bar -->
                            <div class="bubble-input-bar">
                                <input type="text" class="bubble-input" id="bubbleMsgInput" placeholder="익명 메시지 입력..." maxlength="60">
                                <button class="bubble-send-btn" id="btnBubbleSend">전송</button>
                            </div>
                        </div>

                    </div>

                    <!-- Classic iPhone Physical Home Button (Bottom Bezel) -->
                    <div class="phone-bottom-bezel">
                        <button class="physical-home-btn" id="btnPhysicalHome" title="물리 홈 버튼">
                            <div class="home-btn-ring">
                                <div class="home-btn-square"></div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating Off-Screen Smartphone Toggle Button (Bottom-Right) -->
            <button id="floatingPhoneBtn" class="floating-phone-btn" title="스마트폰 HTS 열기">
                <div class="mini-phone-shell">
                    <div class="mini-phone-speaker"></div>
                    <div class="mini-phone-screen"></div>
                    <div class="mini-phone-home-btn"></div>
                </div>
            </button>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
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

        // Bubble Messenger DOM
        this.btnBubbleBack = document.getElementById('btnBubbleBack');
        this.btnBubbleRefresh = document.getElementById('btnBubbleRefresh');
        this.bubbleActiveChannelName = document.getElementById('bubbleActiveChannelName');
        this.bubbleChatFeed = document.getElementById('bubbleChatFeed');
        this.bubbleMsgInput = document.getElementById('bubbleMsgInput');
        this.btnBubbleSend = document.getElementById('btnBubbleSend');
        this.badgeRumorCount = document.getElementById('badgeRumorCount');
        this.bubbleBadgeHome = document.querySelector('#iconBubbleApp .app-badge');

        this.headerDayBadge = document.getElementById('headerDayBadge');
        this.tickerMarquee = document.getElementById('tickerMarquee');

        // Home tab
        this.summaryCard = document.getElementById('summaryCard');
        this.settlementDDay = document.getElementById('settlementDDay');
        this.homeNetWorth = document.getElementById('homeNetWorth');
        this.homeCash = document.getElementById('homeCash');
        this.homePortfolioVal = document.getElementById('homePortfolioVal');
        this.homeProfitLoss = document.getElementById('homeProfitLoss');
        this.rentGoalText = document.getElementById('rentGoalText');
        this.rentProgressFill = document.getElementById('rentProgressFill');
        this.bannerCipherVal = document.getElementById('bannerCipherVal');
        this.bannerCipherChange = document.getElementById('bannerCipherChange');
        this.widgetIndex = document.getElementById('widgetIndex');
        this.widgetIndexSub = document.getElementById('widgetIndexSub');
        this.recentStocksGrid = document.getElementById('recentStocksGrid');

        // Market tab
        this.searchInput = document.getElementById('searchInput');
        this.sectorChips = document.getElementById('sectorChips');
        this.marketSortSelect = document.getElementById('marketSortSelect');
        this.stockListContainer = document.getElementById('stockListContainer');

        // News tab
        this.newsListContainer = document.getElementById('newsListContainer');

        // Profile tab
        this.profileAvatar = document.querySelector('.profile-avatar');
        this.profileName = document.querySelector('.profile-name');
        this.profileTitle = document.querySelector('.profile-title');
        this.portfolioListContainer = document.getElementById('portfolioListContainer');
        this.sectorDonutChart = document.getElementById('sectorDonutChart');
        this.donutCenterVal = document.getElementById('donutCenterVal');
        this.allocationLegendList = document.getElementById('allocationLegendList');
        this.btnProfileSettlement = document.getElementById('btnProfileSettlement');
        this.btnProfileReset = document.getElementById('btnProfileReset');

        // Nav tabs
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.tabViews = document.querySelectorAll('.tab-view');
        this.btnPhysicalHome = document.getElementById('btnPhysicalHome');
        this.btnMinimizeHeader = document.getElementById('btnMinimizeHeader');
        this.floatingPhoneBtn = document.getElementById('floatingPhoneBtn');
    }

    updateUserProfile(profile) {
        if (!profile) return;
        if (this.profileAvatar) {
            this.profileAvatar.innerHTML = createGeometricAvatarSVG(profile, 48);
            this.profileAvatar.style.width = '48px';
            this.profileAvatar.style.height = '48px';
        }
        if (this.profileName) {
            this.profileName.textContent = profile.nickname || '사이퍼 트레이더';
        }
        if (this.profileTitle && profile.trait) {
            this.profileTitle.textContent = `${profile.trait.title} • 레벨 1 (${profile.trait.statName})`;
        }
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
        this.renderBubbleChannel(this.currentBubbleChannel || 'rumor');
    }

    initEventListeners() {
        // App launch & Home switch
        this.iconStockApp?.addEventListener('click', () => {
            this.showStockApp();
            if (this.callbacks.onStockAppOpened) {
                this.callbacks.onStockAppOpened();
            }
        });

        this.iconBubbleApp?.addEventListener('click', () => {
            this.showBubbleApp();
        });

        this.iconMemoApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('📝 메모장: 주식 매매 일지 작성 기능 준비중');
        });
        this.iconAchieveApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('🏆 업적 시스템: [초보 탈출] 달성 완료');
        });
        this.iconSettingsApp?.addEventListener('click', () => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('⚙️ 스마트폰 설정: 버전 v1.0.4');
        });

        // Bubble Messenger Controls
        this.btnBubbleBack?.addEventListener('click', () => {
            this.showHomeScreen();
        });

        this.btnBubbleRefresh?.addEventListener('click', () => {
            this.renderBubbleChannel(this.currentBubbleChannel);
            if (this.callbacks.onShowToast) this.callbacks.onShowToast('🔄 Bubble 채널 메시지를 새로고침했습니다.');
        });

        document.querySelectorAll('.bubble-chan-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const chan = btn.dataset.channel;
                document.querySelectorAll('.bubble-chan-tab').forEach(b => b.classList.toggle('active', b === btn));
                this.currentBubbleChannel = chan;
                if (this.bubbleActiveChannelName) {
                    if (chan === 'rumor') this.bubbleActiveChannelName.textContent = '🔥 여의도 참새방앗간 (익명 찌라시 룸)';
                    else if (chan === 'anna') this.bubbleActiveChannelName.textContent = '💼 매니저 안나 (1:1 멘토링)';
                    else if (chan === 'quant') this.bubbleActiveChannelName.textContent = '⚡ 퀀트 AI 급등락 시그널';
                }
                this.renderBubbleChannel(chan);
            });
        });

        this.btnBubbleSend?.addEventListener('click', () => this.handleSendBubbleMessage());
        this.bubbleMsgInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSendBubbleMessage();
            }
        });

        // Physical iPhone Home Button
        this.btnPhysicalHome?.addEventListener('click', () => {
            if (this.stockApp?.classList.contains('active') || this.bubbleApp?.classList.contains('active')) {
                this.showHomeScreen();
            } else {
                this.showStockApp();
            }
        });

        // Summary Card click -> Switch to Profile Tab
        this.summaryCard?.addEventListener('click', () => this.switchTab('Profile'));

        // Nav Tabs Click
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Sector filter horizontal scroll & drag
        if (this.sectorChips) {
            const el = this.sectorChips;
            el.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            let isDown = false, startX, scrollLeft;
            el.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - el.offsetLeft;
                scrollLeft = el.scrollLeft;
            });
            el.addEventListener('mouseleave', () => isDown = false);
            el.addEventListener('mouseup', () => isDown = false);
            el.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                el.scrollLeft = scrollLeft - (x - startX) * 1.5;
            });

            // Sector Filter Click
            el.addEventListener('click', (e) => {
                const btn = e.target.closest('.chip-btn');
                if (btn) {
                    el.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedSector = btn.dataset.sector;
                    if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
                }
            });
        }

        // Market Sort Select
        this.marketSortSelect?.addEventListener('change', (e) => {
            this.selectedSortMode = e.target.value;
            if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
        });

        // Search Input
        this.searchInput?.addEventListener('input', () => {
            if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
        });

        // Profile Actions
        this.btnProfileSettlement?.addEventListener('click', () => {
            if (this.callbacks.onTriggerSettlement) this.callbacks.onTriggerSettlement();
        });
        this.btnProfileReset?.addEventListener('click', () => {
            if (this.callbacks.onReset) this.callbacks.onReset();
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
            if (this.callbacks.onPhoneOpened) {
                this.callbacks.onPhoneOpened();
            }
        };

        this.floatingPhoneBtn?.addEventListener('click', restorePhone);
        this.btnMinimizeHeader?.addEventListener('click', minimizePhone);

        // Click outside phone shell to minimize (rooftop area)
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

        if (this.callbacks.onSwitchTab) {
            this.callbacks.onSwitchTab(tabName);
        }
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('stockwars_favorites');
            if (saved) return new Set(JSON.parse(saved));
        } catch (e) {}
        return new Set();
    }

    saveFavorites() {
        try {
            localStorage.setItem('stockwars_favorites', JSON.stringify(Array.from(this.favorites)));
        } catch (e) {}
    }

    toggleFavorite(stockId) {
        if (!stockId) return;
        if (this.favorites.has(stockId)) {
            this.favorites.delete(stockId);
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(`☆ ${stockId} 종목이 관심 종목에서 해제되었습니다.`);
        } else {
            this.favorites.add(stockId);
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(`⭐ ${stockId} 종목이 관심 종목으로 등록되었습니다!`);
        }
        this.saveFavorites();
        if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
    }

    recordRecentlyViewed(stockId) {
        if (!stockId) return;
        this.recentlyViewedIds = [stockId, ...this.recentlyViewedIds.filter(id => id !== stockId)].slice(0, 4);
    }

    updateState(state) {
        if (this.headerDayBadge) {
            this.headerDayBadge.textContent = `Day ${state.day} / ${state.maxDays}`;
        }

        // Cipher Index
        if (state.cipherIndex) {
            const isPos = state.cipherIndex.diffPct >= 0;
            const sign = isPos ? '+' : '';
            const text = `${state.cipherIndex.val} pts`;
            const changeText = `${sign}${state.cipherIndex.diffPct.toFixed(2)}%`;

            if (this.bannerCipherVal) this.bannerCipherVal.textContent = text;
            if (this.bannerCipherChange) {
                this.bannerCipherChange.textContent = changeText;
                this.bannerCipherChange.className = `cipher-change ${isPos ? 'gainer' : 'loser'}`;
            }
            if (this.widgetIndex) this.widgetIndex.textContent = `Cipher ${text}`;
            if (this.widgetIndexSub) {
                this.widgetIndexSub.textContent = `${changeText} Today`;
                this.widgetIndexSub.className = `widget-sub ${isPos ? 'gainer' : 'loser'}`;
            }
        }

        // Home View Summary
        if (this.homeNetWorth) this.homeNetWorth.textContent = `${state.totalNetWorth.toLocaleString()} Gold`;
        if (this.homeCash) this.homeCash.textContent = `${state.cash.toLocaleString()}G`;
        if (this.homePortfolioVal) this.homePortfolioVal.textContent = `${state.portfolioValue.toLocaleString()}G`;

        if (this.homeProfitLoss) {
            const isPos = state.totalProfitLoss >= 0;
            const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / (state.initialCash || 5000)) * 100 : 0;
            this.homeProfitLoss.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()}G (${isPos ? '+' : ''}${pct.toFixed(1)}%)`;
            this.homeProfitLoss.className = `stat-val ${isPos ? 'gainer' : 'loser'}`;
        }

        if (this.settlementDDay) this.settlementDDay.textContent = `정산 D-${state.maxDays - state.day + 1}`;

        // Rent progress
        const rentPct = Math.min(100, Math.max(0, (state.totalNetWorth / state.targetRent) * 100));
        if (this.rentGoalText) this.rentGoalText.textContent = `${state.totalNetWorth.toLocaleString()}G 중 ${state.targetRent.toLocaleString()}G`;
        if (this.rentProgressFill) this.rentProgressFill.style.width = `${rentPct}%`;

        // Render sub-sections
        this.latestState = state;
        const rumorCount = (state.news || []).filter(n => n.type === '찌라시').length;
        if (this.badgeRumorCount) this.badgeRumorCount.textContent = rumorCount;
        if (this.bubbleBadgeHome) this.bubbleBadgeHome.textContent = rumorCount;

        if (this.bubbleApp && this.bubbleApp.classList.contains('active')) {
            this.renderBubbleChannel(this.currentBubbleChannel || 'rumor');
        }

        this.renderTickerMarquee(state.cipherIndex);
        this.renderRecentlyViewedStocks(state.stocks);
        this.renderStockList(state.stocks);
        this.renderNews(state.news);
        this.renderPortfolio(state.portfolio);
        this.renderSectorAllocation(state.portfolio);
    }

    renderTickerMarquee(cipherIndex) {
        if (!this.tickerMarquee || !cipherIndex) return;
        const isPos = cipherIndex.diffPct >= 0;
        const sign = isPos ? '▲+' : '▼';

        const itemHtml = `
            <div class="ticker-item index-item">
                <span class="ticker-index-label">🌐 글로벌 사이퍼 지수</span>
                <span class="ticker-index-val ${isPos ? 'gainer' : 'loser'}">${cipherIndex.val} pts</span>
                <span class="ticker-index-pct ${isPos ? 'gainer' : 'loser'}">(${sign}${cipherIndex.diffPct.toFixed(2)}%)</span>
            </div>
        `;
        this.tickerMarquee.innerHTML = itemHtml.repeat(6);
    }

    renderRecentlyViewedStocks(stocks) {
        if (!this.recentStocksGrid) return;
        const stockMap = new Map(stocks.map(s => [s.id, s]));
        let items = (this.recentlyViewedIds || []).map(id => stockMap.get(id)).filter(Boolean);

        if (items.length < 4) {
            for (const s of stocks) {
                if (items.length >= 4) break;
                if (!items.find(x => x.id === s.id)) items.push(s);
            }
        }

        this.recentStocksGrid.innerHTML = items.slice(0, 4).map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };

            return `
                <div class="hot-stock-card" data-id="${s.id}">
                    <div class="hot-card-top">
                        <span class="hot-stock-name">${s.name}</span>
                        <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                    </div>
                    <div class="hot-card-price">${s.price.toLocaleString()}G</div>
                    <div class="hot-card-change ${isPos ? 'gainer' : 'loser'}">
                        ${isPos ? '▲' : '▼'} ${Math.abs(diffPct).toFixed(2)}%
                    </div>
                </div>
            `;
        }).join('');

        this.recentStocksGrid.querySelectorAll('.hot-stock-card').forEach(card => {
            card.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(card.dataset.id);
                }
            });
        });
    }

    renderStockList(stocks) {
        if (!this.stockListContainer) return;
        const query = (this.searchInput?.value || '').toLowerCase().trim();

        const filtered = stocks.filter(s => {
            const matchSector = this.selectedSector === 'FAV'
                ? (this.favorites && this.favorites.has(s.id))
                : (this.selectedSector === 'ALL' || s.sector === this.selectedSector);
            const matchQuery = !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
            return matchSector && matchQuery;
        });

        const sortMode = this.selectedSortMode || 'POPULAR';
        filtered.sort((a, b) => {
            const diffPctA = a.prevPrice > 0 ? Math.abs((a.price - a.prevPrice) / a.prevPrice) * 100 : 0;
            const diffPctB = b.prevPrice > 0 ? Math.abs((b.price - b.prevPrice) / b.prevPrice) * 100 : 0;

            if (sortMode === 'POPULAR') {
                const favA = (this.favorites && this.favorites.has(a.id)) ? 1000 : 0;
                const favB = (this.favorites && this.favorites.has(b.id)) ? 1000 : 0;
                const recA = (this.recentlyViewedIds && this.recentlyViewedIds.includes(a.id)) ? 500 : 0;
                const recB = (this.recentlyViewedIds && this.recentlyViewedIds.includes(b.id)) ? 500 : 0;
                return (favB + recB + diffPctB * 100 + (b.price / 10)) - (favA + recA + diffPctA * 100 + (a.price / 10));
            } else if (sortMode === 'CHANGE') {
                return diffPctB - diffPctA;
            } else if (sortMode === 'PRICE') {
                return b.price - a.price;
            } else if (sortMode === 'NAME') {
                return a.name.localeCompare(b.name, 'ko');
            }
            return 0;
        });

        if (filtered.length === 0) {
            this.stockListContainer.innerHTML = `
                <div class="empty-list-msg">
                    <span class="empty-icon">⭐</span>
                    <p>${this.selectedSector === 'FAV' ? '등록된 관심 종목이 없습니다.<br>종목 상단의 별(⭐) 아이콘을 눌러 관심 종목으로 등록해보세요!' : '검색 결과가 없습니다.'}</p>
                </div>
            `;
            return;
        }

        this.stockListContainer.innerHTML = filtered.map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };
            const isFav = this.favorites && this.favorites.has(s.id);

            return `
                <div class="stock-item-row" data-id="${s.id}">
                    <div class="item-left">
                        <div class="item-name-area">
                            <button class="item-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${s.id}" title="관심 종목 토글">⭐</button>
                            <span class="item-name">${s.name}</span>
                            <span class="item-code">${s.id}</span>
                            <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                        </div>
                        <div class="item-desc">${s.desc}</div>
                    </div>
                    <div class="item-right">
                        <div class="item-price">${s.price.toLocaleString()}G</div>
                        <div class="item-change ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '+' : ''}${diffPct.toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.stockListContainer.querySelectorAll('.item-fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.favId);
            });
        });

        this.stockListContainer.querySelectorAll('.stock-item-row').forEach(row => {
            row.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(row.dataset.id);
                }
            });
        });
    }

    renderNews(newsList) {
        if (!this.newsListContainer) return;
        // The stock trading app only displays official news and corporate disclosures
        const officialNews = (newsList || []).filter(n => n.type !== '찌라시');

        if (officialNews.length === 0) {
            this.newsListContainer.innerHTML = `<div class="item-desc" style="padding:24px; text-align:center;">등록된 공식 공시 및 시장 뉴스가 없습니다.</div>`;
            return;
        }

        this.newsListContainer.innerHTML = officialNews.map(n => `
            <div class="news-card" data-news-id="${n.id}">
                <div class="news-header">
                    <span class="news-type-tag ${n.type === '공시' ? 'type-disclosure' : 'type-news'}">${n.type}</span>
                    <span class="news-time">${n.time}</span>
                </div>
                <div class="news-title">${n.title}</div>
                <div class="news-content">${n.content}</div>
                <div class="news-footer">
                    <span class="impact-tag ${n.isPositive ? 'gainer' : 'loser'}">예상 파급력: ${n.impact}</span>
                    <button class="news-trade-link" data-id="${n.stockId}">차트 보기 및 거래 ➔</button>
                </div>
            </div>
        `).join('');

        this.newsListContainer.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('news-trade-link')) return;
                if (this.callbacks.onOpenNewsDetailModal) {
                    this.callbacks.onOpenNewsDetailModal(card.dataset.newsId);
                }
            });
        });

        this.newsListContainer.querySelectorAll('.news-trade-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(btn.dataset.id);
                }
            });
        });
    }

    renderPortfolio(portfolio) {
        if (!this.portfolioListContainer) return;
        if (portfolio.length === 0) {
            this.portfolioListContainer.innerHTML = `<div class="item-desc" style="text-align:center; padding:20px;">보유 중인 주식이 없습니다.</div>`;
            return;
        }

        this.portfolioListContainer.innerHTML = portfolio.map(item => {
            const isPos = item.profitLoss >= 0;
            const modeBadge = item.isShort ? `<span class="lock-tag" style="background:#ff3b5c; color:#fff;">SHORT ${item.leverage}x</span>` : (item.leverage > 1 ? `<span class="lock-tag" style="background:#00e5ff; color:#000;">LONG ${item.leverage}x</span>` : '');

            return `
                <div class="portfolio-item" data-id="${item.id}">
                    <div>
                        <div class="port-stock-name">${item.stock.name} (${item.id}) ${modeBadge}</div>
                        <div class="port-stock-sub">보유: ${item.qty}주 • 평균가: ${item.avgPrice.toLocaleString()}G</div>
                    </div>
                    <div class="port-right">
                        <div class="port-val">${Math.round(item.currentVal).toLocaleString()}G</div>
                        <div class="port-pl ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '+' : ''}${Math.round(item.profitLoss).toLocaleString()}G (${isPos ? '+' : ''}${item.profitLossPct.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.portfolioListContainer.querySelectorAll('.portfolio-item').forEach(el => {
            el.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(el.dataset.id);
                }
            });
        });
    }

    renderSectorAllocation(portfolio) {
        if (!this.sectorDonutChart) return;
        const canvas = this.sectorDonutChart;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const sectorWeights = new Map();
        let totalVal = 0;

        portfolio.forEach(item => {
            const sec = item.stock.sector || '기타';
            const val = item.currentVal;
            totalVal += val;
            sectorWeights.set(sec, (sectorWeights.get(sec) || 0) + val);
        });

        if (this.donutCenterVal) {
            this.donutCenterVal.textContent = `${sectorWeights.size}개`;
        }

        if (totalVal <= 0 || sectorWeights.size === 0) {
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 44, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 14;
            ctx.stroke();

            if (this.allocationLegendList) {
                this.allocationLegendList.innerHTML = `<div class="item-desc">보유 종목이 없습니다.</div>`;
            }
            return;
        }

        let startAngle = -Math.PI / 2;
        let legendHtml = '';

        sectorWeights.forEach((val, secKey) => {
            const sec = SECTORS[secKey] || { name: secKey, color: '#00e5ff' };
            const sliceAngle = (val / totalVal) * Math.PI * 2;
            const pct = ((val / totalVal) * 100).toFixed(1);

            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 44, startAngle, startAngle + sliceAngle);
            ctx.strokeStyle = sec.color;
            ctx.lineWidth = 14;
            ctx.stroke();

            startAngle += sliceAngle;

            legendHtml += `
                <div class="legend-row">
                    <span class="legend-dot" style="background: ${sec.color};"></span>
                    <span class="legend-name">${sec.name}</span>
                    <span class="legend-pct">${pct}%</span>
                </div>
            `;
        });

        if (this.allocationLegendList) {
            this.allocationLegendList.innerHTML = legendHtml;
        }
    }

    renderBubbleChannel(channel = 'rumor') {
        if (!this.bubbleChatFeed) return;
        const state = this.latestState;
        const stocksMap = state ? new Map(state.stocks.map(s => [s.id, s])) : new Map();

        let html = '';

        if (channel === 'rumor') {
            const rawRumors = (state?.news || []).filter(n => n.type === '찌라시');
            
            html += `
                <div class="bubble-date-divider">
                    <span>📅 오늘 • 익명 찌라시 라운지 (1,420명 참여 중)</span>
                </div>
                <div class="bubble-system-notice">
                    ⚠️ <b>주의:</b> 본 채널의 정보는 시장 루머(찌라시)입니다. 공식 뉴스는 주식앱에서 확인하세요.
                </div>
            `;

            rawRumors.forEach((r, idx) => {
                const stock = stocksMap.get(r.stockId);
                const stockName = stock ? stock.name : r.stockId;
                const isPos = r.isPositive !== false;
                const senders = [
                    { name: '여의도 우주갈매기', avatar: '🦅', role: '세력 포착' },
                    { name: '익명의 펀드매니저', avatar: '🕵️‍♂️', role: 'VIP 소식통' },
                    { name: '증권가 찌라시통', avatar: '📡', role: '루머 헌터' }
                ];
                const s = senders[idx % senders.length];

                html += `
                    <div class="bubble-msg-row">
                        <div class="bubble-avatar">${s.avatar}</div>
                        <div class="bubble-msg-content">
                            <div class="bubble-msg-author">
                                <span class="author-name">${s.name}</span>
                                <span class="author-role">${s.role}</span>
                                <span class="msg-time">${r.time || '방금 전'}</span>
                            </div>
                            <div class="bubble-bubble rumor-bubble">
                                <div class="rumor-headline">
                                    <span class="rumor-badge">${isPos ? '🔥 급등 찌라시' : '⚠️ 급락 루머'}</span>
                                    <span class="rumor-impact ${isPos ? 'gainer' : 'loser'}">${r.impact}</span>
                                </div>
                                <div class="rumor-text">${r.content}</div>
                                <div class="rumor-meta">
                                    <span>🔍 신뢰도: ${r.credibility || 'Tier 1 Rumor'}</span>
                                </div>
                                <div class="rumor-actions">
                                    <button class="bubble-trade-btn" data-stock-id="${r.stockId}">
                                        📈 [${stockName}] 차트 & 매매 바로가기 ➔
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Append user custom chat in rumor channel
            (this.bubbleUserMessages.rumor || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
                if (msg.reply) {
                    html += `
                        <div class="bubble-msg-row">
                            <div class="bubble-avatar">🦅</div>
                            <div class="bubble-msg-content">
                                <div class="bubble-msg-author">
                                    <span class="author-name">여의도 우주갈매기</span>
                                    <span class="msg-time">${msg.time}</span>
                                </div>
                                <div class="bubble-bubble">${msg.reply}</div>
                            </div>
                        </div>
                    `;
                }
            });

        } else if (channel === 'anna') {
            html += `
                <div class="bubble-date-divider">
                    <span>📅 오늘 • 매니저 안나 1:1 상담실</span>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">👩‍💼</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">전담 매니저 안나</span>
                            <span class="author-role">멘토</span>
                            <span class="msg-time">09:00</span>
                        </div>
                        <div class="bubble-bubble anna-bubble">
                            파트너님, 좋은 아침이에요! ☀️<br>
                            오늘도 시장 수급을 잘 파악해서 7일차 정산 목표(5,000G)를 완수해 보아요!
                        </div>
                    </div>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">👩‍💼</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">전담 매니저 안나</span>
                            <span class="author-role">멘토</span>
                            <span class="msg-time">09:15</span>
                        </div>
                        <div class="bubble-bubble anna-bubble">
                            💡 <b>투자 가이드:</b><br>
                            스마트폰의 [공식 뉴스] 탭은 정식 검증된 기업 공시만 제공되며,<br>
                            이곳 [Bubble 참새방앗간]에는 빠르고 은밀한 시장 찌라시가 올라옵니다. 둘을 교차 확인하며 매매 기회를 잡아보세요!
                        </div>
                    </div>
                </div>
            `;

            // Append user custom chat in anna channel
            (this.bubbleUserMessages.anna || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
                if (msg.reply) {
                    html += `
                        <div class="bubble-msg-row">
                            <div class="bubble-avatar">👩‍💼</div>
                            <div class="bubble-msg-content">
                                <div class="bubble-msg-author">
                                    <span class="author-name">전담 매니저 안나</span>
                                    <span class="msg-time">${msg.time}</span>
                                </div>
                                <div class="bubble-bubble anna-bubble">${msg.reply}</div>
                            </div>
                        </div>
                    `;
                }
            });

        } else if (channel === 'quant') {
            html += `
                <div class="bubble-date-divider">
                    <span>⚡ AI 퀀트 알고리즘 실시간 탐지 피드</span>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">🤖</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">Cipher Quant AI</span>
                            <span class="author-role">시스템</span>
                            <span class="msg-time">실시간</span>
                        </div>
                        <div class="bubble-bubble quant-bubble">
                            📊 <b>[시그널 감지]</b> 글로벌 사이퍼 지수 모멘텀 우상향 지속 중.<br>
                            우량주 중심의 기관 순매수 유입 확인.
                        </div>
                    </div>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">🤖</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">Cipher Quant AI</span>
                            <span class="author-role">시스템</span>
                            <span class="msg-time">실시간</span>
                        </div>
                        <div class="bubble-bubble quant-bubble">
                            ⚡ <b>[변동성 경보]</b> 찌라시 유입 종목 단기 거래량 급증 포착.<br>
                            호가 스프레드가 확대될 수 있으니 분할 매매 권장.
                        </div>
                    </div>
                </div>
            `;

            (this.bubbleUserMessages.quant || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
            });
        }

        this.bubbleChatFeed.innerHTML = html;
        this.bubbleChatFeed.scrollTop = this.bubbleChatFeed.scrollHeight;

        // Wire trade action buttons inside rumors
        this.bubbleChatFeed.querySelectorAll('.bubble-trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stockId = btn.dataset.stockId;
                if (stockId && this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(stockId);
                }
            });
        });
    }

    handleSendBubbleMessage() {
        if (!this.bubbleMsgInput) return;
        const text = this.bubbleMsgInput.value.trim();
        if (!text) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const chan = this.currentBubbleChannel || 'rumor';

        let reply = null;
        if (chan === 'rumor') {
            const replies = [
                'ㅋㅋㅋ 그 정보 진짜야? 세력 붙은 것 같은데 가보자!',
                '차트 5일선 지지받는 거 보니까 찌라시 힘 받겠네',
                '익명 형님들 풀매수 때립니다 가즈아!',
                '단타 치고 빠질 각 재야겠음 ㄷㄷ'
            ];
            reply = replies[Math.floor(Math.random() * replies.length)];
        } else if (chan === 'anna') {
            const replies = [
                '네 파트너님! 언제나 무리한 베팅보다는 분할 매수로 안전하게 수익을 챙기세요!',
                '좋은 판단이에요! 포트폴리오 탭에서 평가 손익을 꾸준히 확인해 주세요.',
                '응원하고 있어요! 파트너님의 성공적인 7일 생존을 믿어요 ✨'
            ];
            reply = replies[Math.floor(Math.random() * replies.length)];
        }

        this.bubbleUserMessages[chan].push({ text, time, reply });
        this.bubbleMsgInput.value = '';
        this.renderBubbleChannel(chan);
    }
}

