/**
 * TradeModalTemplate
 * Contains HTML modal markup for TradeModal.
 */

export function getTradeModalHtml() {
    return `
        <div id="tradeModal" class="modal-overlay hidden">
            <div class="modal-card">
                <div class="modal-header">
                    <div class="modal-stock-title">
                        <span id="modalStockName" class="stock-name">클라우드 베리</span>
                        <button class="fav-btn" id="btnFavoriteStock" title="관심 종목 토글">⭐</button>
                        <span id="modalStockCode" class="stock-code">CLOUDBERRY</span>
                        <span id="modalStockSector" class="stock-sector-badge">IT</span>
                    </div>
                    <button class="modal-close-btn" id="btnCloseTradeModal">✕</button>
                </div>

                <!-- Sub Navigation Tabs inside Trade Modal -->
                <div class="trade-modal-subtabs">
                    <button class="subtab-btn active" id="btnSubtabChart">📊 차트 & 호가</button>
                    <button class="subtab-btn" id="btnSubtabInfo">ℹ️ 기업 정보 (Info)</button>
                </div>

                <div class="modal-body">
                    <!-- Stock Price Header -->
                    <div class="modal-price-header">
                        <div class="current-price" id="modalStockPrice">850 Gold</div>
                        <div class="price-change-tag" id="modalStockChange">+2.4%</div>
                    </div>

                    <!-- SUBTAB 1: CHART & ORDERBOOK CONTENT -->
                    <div id="tradeSubtabChartContent" class="subtab-content active">
                        <!-- Canvas Stock Chart -->
                        <div class="chart-container clickable-chart" id="btnExpandChart" title="클릭하여 전체화면 정밀 차트 열기">
                            <canvas id="stockCanvasChart"></canvas>
                        </div>

                        <!-- 5-Tier Orderbook & Buy/Sell Panel Grid -->
                        <div class="trade-grid">
                            <!-- Left: Orderbook -->
                            <div class="orderbook-panel">
                                <div class="panel-lbl">실시간 호가창</div>
                                <div class="orderbook-rows" id="orderbookRows">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>

                            <!-- Right: Trade Form Panel -->
                            <div class="trade-form-panel">
                                <!-- Order Type Selector (Long vs Short) -->
                                <div class="order-type-selector">
                                    <button class="order-type-btn active" id="btnOrderTypeLong">📈 현물 매수 (Long)</button>
                                    <button class="order-type-btn locked" id="btnOrderTypeShort">
                                        📉 공매도 (Short) <span class="lock-tag" id="shortLockTag">🔒 Lv.20</span>
                                    </button>
                                </div>

                                <!-- Leverage Selector -->
                                <div class="leverage-selector">
                                    <span class="panel-lbl">마진 레버리지</span>
                                    <div class="leverage-btn-group">
                                        <button class="lev-btn active" data-lev="1">1x</button>
                                        <button class="lev-btn" data-lev="2">2x</button>
                                        <button class="lev-btn locked" data-lev="3" id="lev3Btn">3x <span class="lock-tag">🔒</span></button>
                                        <button class="lev-btn locked" data-lev="5" id="lev5Btn">5x <span class="lock-tag">🔒</span></button>
                                    </div>
                                </div>

                                <div class="qty-selector">
                                    <span class="qty-lbl">수량</span>
                                    <div class="qty-input-group">
                                        <button class="qty-btn" id="btnQtyMinus">-</button>
                                        <input type="number" id="tradeQtyInput" value="1" min="1" max="9999">
                                        <button class="qty-btn" id="btnQtyPlus">+</button>
                                    </div>
                                </div>

                                <div class="quick-qty-btns">
                                    <button class="q-btn" data-qty="1">1주</button>
                                    <button class="q-btn" data-qty="5">5주</button>
                                    <button class="q-btn" data-qty="10">10주</button>
                                    <button class="q-btn" data-qty="MAX" id="btnQtyMax">MAX</button>
                                </div>

                                <div class="total-calc-box">
                                    <span>총 주문 금액 (증거금):</span>
                                    <span class="total-gold" id="modalTotalCost">850G</span>
                                </div>

                                <div class="order-action-btns">
                                    <button class="trade-action-btn buy-btn" id="btnBuyExecute">매수 (BUY)</button>
                                    <button class="trade-action-btn sell-btn" id="btnSellExecute">매도 (SELL)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SUBTAB 2: STOCK INFO CONTENT -->
                    <div id="tradeSubtabInfoContent" class="subtab-content hidden">
                        <div class="info-section">
                            <div class="info-section-title">🏢 기업 개요 (Company Overview)</div>
                            <div class="info-rich-desc" id="infoRichDesc">
                                기업 설명이 로드되는 중입니다...
                            </div>
                        </div>

                        <div class="info-section">
                            <div class="info-section-title">📊 핵심 투자 지표 & 재무 통계</div>
                            <div class="info-stats-grid">
                                <div class="info-stat-card">
                                    <span class="stat-name">PER (주가수익비율)</span>
                                    <span class="stat-val-num" id="infoPER">14.2 배</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">PBR (주가순자산비율)</span>
                                    <span class="stat-val-num" id="infoPBR">1.8 배</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">ROE (자기자본이익률)</span>
                                    <span class="stat-val-num" id="infoROE">12.7 %</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">주간 배당률</span>
                                    <span class="stat-val-num" id="infoDividend">3.0 %</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">시가총액 (Market Cap)</span>
                                    <span class="stat-val-num" id="infoMarketCap">8,500억G</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">52주 최고 / 최저</span>
                                    <span class="stat-val-num" id="infoHighLow">920G / 780G</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">위험도 등급 (Risk)</span>
                                    <span class="stat-val-num" id="infoRisk">Low</span>
                                </div>
                                <div class="info-stat-card">
                                    <span class="stat-name">변동성 티어 (Tier)</span>
                                    <span class="stat-val-num" id="infoTier">Tier C</span>
                                </div>
                            </div>
                        </div>

                        <div class="info-section">
                            <div class="info-section-title">📰 관련 공시 & 공식 뉴스</div>
                            <div class="related-news-list" id="infoRelatedNews">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
