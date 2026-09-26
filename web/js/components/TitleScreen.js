/**
 * TitleScreen Component
 * Unity equivalent: TitleSceneController.cs / UIMainMenu.cs
 * Renders the game's official Title Screen with animated Cyberpunk aesthetics,
 * Manager Anna greeting, live ticker teaser, game mode selector, and settings.
 */

export class TitleScreen {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.isVisible = true;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <!-- Fullscreen Animated Title Screen Overlay -->
            <div id="titleScreen" class="title-screen-overlay">
                <!-- Background Animated Stock Graph & Candlestick FX -->
                <div class="title-bg-glow"></div>
                <div class="title-grid-lines"></div>

                <!-- Floating Candlestick Neon Elements -->
                <div class="floating-candles">
                    <div class="candle-item green" style="top: 15%; left: 8%;"></div>
                    <div class="candle-item red" style="top: 35%; left: 18%;"></div>
                    <div class="candle-item green" style="top: 70%; left: 12%;"></div>
                    <div class="candle-item green" style="top: 25%; right: 14%;"></div>
                    <div class="candle-item red" style="top: 60%; right: 9%;"></div>
                </div>

                <div class="title-content-wrapper">
                    <!-- Top Game Branding & Logo -->
                    <div class="title-header-area">
                        <div class="title-badge-tag">
                            <span class="pulse-dot"></span> COZY MULTI-TRADING SIMULATION
                        </div>
                        <h1 class="title-main-logo">
                            <span class="logo-stock">STOCK</span><span class="logo-wars">WARS</span>
                        </h1>
                        <div class="title-sub-text">사이퍼M: 자본주의 7일 생존 주식 라이프</div>
                    </div>

                    <!-- Center Anna Companion Intro Card -->
                    <div class="title-partner-card">
                        <div class="partner-avatar-ring">
                            <span class="partner-avatar-emoji">👩‍💼</span>
                            <span class="partner-status-dot"></span>
                        </div>
                        <div class="partner-speech-bubble">
                            <div class="partner-name-tag">전담 매니저 안나(Anna)</div>
                            <div class="partner-msg">
                                "초보 트레이더님, 환영해요! 7일간의 치열한 주식 시장에서 시드머니를 불려 월세를 완납하고 최고의 펀드 매니저로 성장해보세요."
                            </div>
                        </div>
                    </div>

                    <!-- Live Market Ticker Ribbon Teaser -->
                    <div class="title-ticker-bar">
                        <span class="ticker-live-badge">LIVE MARKET</span>
                        <div class="ticker-ribbon-text" id="titleTickerText">
                            <span>🌐 사이퍼 지수 2,485.12 pts (▲+1.42%)</span>
                            <span>• 💻 클라우드 베리 850G (▲+2.4%)</span>
                            <span>• 🏦 코지 페이 900G (▲+1.1%)</span>
                            <span>• 🚀 오로라 에어로 160G (▲+5.3%)</span>
                        </div>
                    </div>

                    <!-- Main Navigation Menu Buttons -->
                    <div class="title-menu-container">
                        <button class="title-btn primary-start-btn" id="btnTitleStartDemo">
                            <span class="btn-icon">🛠️</span>
                            <div class="btn-text-group">
                                <span class="btn-title">개발자 모드</span>
                                <span class="btn-sub">디버그 툴바 활성화 & 500만G 빠른 시연</span>
                            </div>
                            <span class="btn-arrow">➔</span>
                        </button>

                        <button class="title-btn normal-start-btn" id="btnTitleNewGame">
                            <span class="btn-icon">🎮</span>
                            <div class="btn-text-group">
                                <span class="btn-title">새로운 게임 시작</span>
                                <span class="btn-sub">초기 지원금 5,000G로 1일차부터 정석 도전</span>
                            </div>
                            <span class="btn-arrow">➔</span>
                        </button>

                        <div class="title-sub-btn-group">
                            <button class="title-sub-btn" id="btnTitleContinue">
                                <span class="sub-icon">💾</span> 게임 이어하기
                            </button>
                            <button class="title-sub-btn" id="btnTitleSettings">
                                <span class="sub-icon">⚙️</span> 게임 설정
                            </button>
                        </div>
                    </div>

                    <!-- Version & Copyright Footer -->
                    <div class="title-footer">
                        <span>Ver 5.0.0 (Unified Final) • Built with Cozy Web Engine</span>
                        <span>© 2026 BogeulBogeul Corp. All rights reserved.</span>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.overlay = document.getElementById('titleScreen');
        this.btnStartDemo = document.getElementById('btnTitleStartDemo');
        this.btnNewGame = document.getElementById('btnTitleNewGame');
        this.btnContinue = document.getElementById('btnTitleContinue');
        this.btnSettings = document.getElementById('btnTitleSettings');
        this.titleTickerText = document.getElementById('titleTickerText');
    }

    initEventListeners() {
        this.btnStartDemo?.addEventListener('click', () => {
            this.hide();
            if (this.callbacks.onStartGame) {
                this.callbacks.onStartGame('DEMO');
            }
        });

        this.btnNewGame?.addEventListener('click', () => {
            this.hide();
            if (this.callbacks.onStartGame) {
                this.callbacks.onStartGame('NEW');
            }
        });

        this.btnContinue?.addEventListener('click', () => {
            this.hide();
            if (this.callbacks.onStartGame) {
                this.callbacks.onStartGame('CONTINUE');
            }
        });

        this.btnSettings?.addEventListener('click', () => {
            if (this.callbacks.onOpenSettings) {
                this.callbacks.onOpenSettings();
            }
        });
    }

    show() {
        if (!this.overlay) return;
        this.isVisible = true;
        this.overlay.classList.remove('fade-out');
        this.overlay.classList.remove('hidden');
    }

    hide() {
        if (!this.overlay) return;
        this.isVisible = false;
        this.overlay.classList.add('fade-out');
        setTimeout(() => {
            if (!this.isVisible) this.overlay.classList.add('hidden');
        }, 500);
    }

    updateTicker(cipherIndex, stocks = []) {
        if (!this.titleTickerText) return;
        const indexStr = cipherIndex
            ? `🌐 사이퍼 지수 ${cipherIndex.val} pts (${cipherIndex.diffPct >= 0 ? '▲+' : '▼'}${cipherIndex.diffPct.toFixed(2)}%)`
            : '';

        const stocksStr = stocks.slice(0, 4).map(s => {
            const diffPct = s.prevPrice > 0 ? ((s.price - s.prevPrice) / s.prevPrice) * 100 : 0;
            const sign = diffPct >= 0 ? '▲+' : '▼';
            return `• ${s.name} ${s.price.toLocaleString()}G (${sign}${diffPct.toFixed(1)}%)`;
        }).join(' ');

        this.titleTickerText.innerHTML = `<span>${indexStr}</span> <span>${stocksStr}</span>`;
    }
}
