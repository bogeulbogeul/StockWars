/** Game title and entry menu. Existing NEW / DEMO / CONTINUE callbacks are preserved. */
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
        this.container.insertAdjacentHTML('beforeend', `
            <section id="titleScreen" class="title-screen-overlay" aria-label="StockWars 타이틀">
                <div class="title-scenery" aria-hidden="true">
                    <div class="title-sun"></div>
                    <div class="title-cloud title-cloud-one"></div>
                    <div class="title-cloud title-cloud-two"></div>
                    <div class="title-city title-city-far"></div>
                    <div class="title-city title-city-near"></div>
                    <div class="title-scene-shade"></div>
                </div>
                <div class="title-topline">
                    <span class="title-world-mark">SW <span>사이퍼 시티</span></span>
                    <span class="title-build-label">개발 중인 버전</span>
                </div>
                <div class="title-content-wrapper">
                    <header class="title-header-area">
                        <p class="title-eyebrow">작은 오피스에서 시작되는 나의 투자 라이프</p>
                        <h1 class="title-main-logo" aria-label="Stock Wars">
                            <span class="logo-stock">STOCK</span><span class="logo-wars">WARS<span class="title-logo-dot">.</span></span>
                        </h1>
                        <p class="title-sub-text">시장은 매일 달라지고,<br>당신의 이야기는 이제 시작됩니다.</p>
                    </header>
                    <nav class="title-menu-container" aria-label="게임 메뉴">
                        <button type="button" class="title-btn primary-start-btn" id="btnTitleNewGame">
                            <span class="btn-text-group"><span class="btn-title">새 게임</span><span class="btn-sub">나만의 트레이더로 첫 출근하기</span></span>
                            <span class="btn-arrow" aria-hidden="true">↗</span>
                        </button>
                        <div class="title-sub-btn-group">
                            <button type="button" class="title-sub-btn" id="btnTitleContinue">이어하기 <span aria-hidden="true">→</span></button>
                            <button type="button" class="title-sub-btn" id="btnTitleSettings">설정 <span aria-hidden="true">⚙</span></button>
                        </div>
                    </nav>
                    <div class="title-partner-card">
                        <div class="partner-avatar-ring"><span class="anna-portrait" data-expression="Smile" role="img" aria-label="미소 짓는 안나"></span></div>
                        <div><span class="partner-name-tag">YOUR PARTNER · 안나</span><p class="partner-msg">“첫 투자는 제가 함께할게요.”</p></div>
                    </div>
                </div>
                <div class="title-scene-caption" aria-hidden="true"><span>WELCOME TO</span><strong>CIPHER CITY</strong><p>새로운 하루, 새로운 가능성.</p></div>
                <footer class="title-footer">
                    <div class="title-ticker-bar" aria-label="게임 내 시장 시세">
                        <span class="ticker-live-badge"><i></i> GAME MARKET</span>
                        <div class="ticker-ribbon-text" id="titleTickerText"><span>오늘의 시장을 준비하고 있습니다.</span></div>
                    </div>
                    <div class="title-bottom-row">
                        <span class="title-copyright">© 2026 StockWars</span>
                        <button type="button" class="title-dev-btn" id="btnTitleStartDemo" aria-describedby="titleDevHint"><span aria-hidden="true">⌘</span> 개발자 모드 <span aria-hidden="true">↗</span></button>
                        <span class="title-dev-hint" id="titleDevHint">새 게임 진행 · 디버그 툴바</span>
                    </div>
                </footer>
            </section>
        `);
    }

    initDOM() {
        this.overlay = this.container.querySelector('#titleScreen');
        this.btnStartDemo = this.overlay.querySelector('#btnTitleStartDemo');
        this.btnNewGame = this.overlay.querySelector('#btnTitleNewGame');
        this.btnContinue = this.overlay.querySelector('#btnTitleContinue');
        this.btnSettings = this.overlay.querySelector('#btnTitleSettings');
        this.titleTickerText = this.overlay.querySelector('#titleTickerText');
    }

    initEventListeners() {
        for (const [button, mode] of [[this.btnNewGame, 'NEW'], [this.btnStartDemo, 'DEMO'], [this.btnContinue, 'CONTINUE']]) {
            button.addEventListener('click', () => {
                if (!this.isVisible || !this.callbacks.onStartGame) return;
                this.hide();
                this.callbacks.onStartGame(mode);
            });
        }
        this.btnSettings.addEventListener('click', () => this.callbacks.onOpenSettings?.());
    }

    show() {
        if (!this.overlay) return;
        this.isVisible = true;
        this.overlay.inert = false;
        this.overlay.classList.remove('fade-out', 'hidden');
        this.btnNewGame.focus({ preventScroll: true });
    }

    hide() {
        if (!this.overlay) return;
        this.isVisible = false;
        this.overlay.inert = true;
        this.overlay.classList.add('fade-out');
        setTimeout(() => {
            if (!this.isVisible) this.overlay.classList.add('hidden');
        }, 500);
    }

    updateTicker(cipherIndex, stocks = []) {
        if (!this.titleTickerText) return;
        const change = value => `${value >= 0 ? '▲ +' : '▼ '}${Math.abs(value).toFixed(2)}%`;
        const items = [];
        if (cipherIndex) items.push(`사이퍼 지수 ${cipherIndex.val} (${change(cipherIndex.diffPct)})`);
        for (const stock of stocks.slice(0, 4)) {
            const diff = stock.prevPrice > 0 ? (stock.price - stock.prevPrice) / stock.prevPrice * 100 : 0;
            items.push(`${stock.name} ${stock.price.toLocaleString()}G ${change(diff)}`);
        }
        this.titleTickerText.textContent = items.join('     /     ');
    }
}
