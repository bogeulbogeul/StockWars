/**
 * SmartphoneShellTemplate
 * Contains HTML shell markup for SmartphoneUI OS container, screens, and floating button.
 */

export function getSmartphoneShellHtml() {
    return `
        <div class="device-container">
            <div class="phone-shell">
                <div class="phone-speaker"></div>
                <div class="phone-camera"></div>

                <div class="phone-screen">
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
                        <div class="app-header">
                            <div class="app-title-area">
                                <div class="app-logo">
                                    <span class="logo-icon">📈</span>
                                    <span class="logo-text">사이퍼M</span>
                                </div>
                            </div>
                            <div class="header-day-tag" id="headerDayBadge">Day 1 / 7</div>
                        </div>

                        <div class="ticker-marquee-wrapper">
                            <div class="ticker-content" id="tickerMarquee"></div>
                        </div>

                        <div class="app-body">
                            <!-- VIEW 1: HOME TAB -->
                            <div id="tabHomeView" class="tab-view active">
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

                                <div class="rent-goal-box">
                                    <div class="goal-header">
                                        <span>🎯 1차 정산 목표 (월세 & 부채 이자)</span>
                                        <span class="goal-val" id="rentGoalText">5,000G 중 5,000G</span>
                                    </div>
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" id="rentProgressFill" style="width: 100%;"></div>
                                    </div>
                                </div>

                                <div class="cipher-index-banner">
                                    <div class="cipher-info">
                                        <span class="cipher-name">🏛️ 사이퍼 종합 주가지수</span>
                                        <span class="cipher-val" id="bannerCipherVal">2,485.12 pts</span>
                                    </div>
                                    <span class="cipher-change gainer" id="bannerCipherChange">+1.42%</span>
                                </div>

                                <div class="section-title">👀 최근 조회한 종목</div>
                                <div class="hot-stocks-grid" id="recentStocksGrid"></div>
                            </div>

                            <!-- VIEW 2: MARKET TAB -->
                            <div id="tabMarketView" class="tab-view">
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

                                <div class="stock-list-container" id="stockListContainer"></div>
                            </div>

                            <!-- VIEW 3: NEWS TAB -->
                            <div id="tabNewsView" class="tab-view">
                                <div class="section-title">📰 증시 뉴스 & 공시</div>
                                <div class="news-list" id="newsListContainer"></div>
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
                                        <div class="allocation-legend-list" id="allocationLegendList"></div>
                                    </div>
                                </div>

                                <div class="section-title">💼 내 주식 포트폴리오</div>
                                <div class="portfolio-list" id="portfolioListContainer"></div>

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

                    <!-- 3. Bubble Messenger Application -->
                    <div id="bubbleApp" class="os-screen hidden">
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

                        <div class="bubble-chat-feed" id="bubbleChatFeed"></div>

                        <div class="bubble-input-bar">
                            <input type="text" class="bubble-input" id="bubbleMsgInput" placeholder="익명 메시지 입력..." maxlength="60">
                            <button class="bubble-send-btn" id="btnBubbleSend">전송</button>
                        </div>
                    </div>
                </div>

                <div class="phone-bottom-bezel">
                    <button class="physical-home-btn" id="btnPhysicalHome" title="물리 홈 버튼">
                        <div class="home-btn-ring">
                            <div class="home-btn-square"></div>
                        </div>
                    </button>
                </div>
            </div>
        </div>

        <button id="floatingPhoneBtn" class="floating-phone-btn" title="스마트폰 HTS 열기">
            <div class="mini-phone-shell">
                <div class="mini-phone-speaker"></div>
                <div class="mini-phone-screen"></div>
                <div class="mini-phone-home-btn"></div>
            </div>
        </button>
    `;
}
