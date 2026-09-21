/**
 * MainHUD Component
 * Unity equivalent: HUDInitializer.cs / UIHUDBar.cs
 * Renders and manages the top financial status HUD bar (Day, Clock, Real-time Local Weather, Assets).
 */

export class MainHUD {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.clockTimer = null;
        this.stamina = { current: 3, max: 3 };
        this.render();
        this.initDOM();
        this.initEventListeners();
        this.initClock();
    }

    render() {
        const html = `
            <div class="main-hud-bar">
                <!-- Left Group: Time & Calendar Status -->
                <div class="hud-group hud-time-group">
                    <div class="hud-badge day-badge">
                        <span class="hud-label">DAY</span>
                        <span class="hud-val" id="hudDayVal">1</span>
                    </div>
                    <div class="hud-item market-clock">
                        <span class="hud-icon">⏰</span>
                        <span class="hud-time-txt" id="hudTimeVal">09:00:00 AM</span>
                    </div>
                    <div class="hud-item weather-item" id="hudWeatherItem" title="실시간 로컬 날씨 조회 중...">
                        <span class="hud-icon" id="hudWeatherIcon">☀️</span>
                        <span class="hud-txt" id="hudWeatherTxt">맑음</span>
                    </div>
                    <div class="hud-item stamina-item" id="hudStaminaItem" title="체력 (스테미너): 3 / 3 (알바 노동, 서점 속독, 활동 등에 소모)">
                        <span class="hud-stamina-label">체력</span>
                        <div class="hud-heart-container" id="hudHeartContainer"></div>
                    </div>
                </div>

                <!-- Center Group: Player Asset Summary Header -->
                <div class="hud-group hud-asset-group">
                    <div class="hud-asset-item">
                        <span class="asset-label">보유 현금</span>
                        <span class="asset-val gold" id="hudCashVal">5,000 G</span>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-asset-item">
                        <span class="asset-label">총 평가 자산</span>
                        <span class="asset-val total" id="hudTotalAssetVal">5,000 G</span>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-asset-item">
                        <span class="asset-label">당일 손익</span>
                        <span class="asset-val pnl neutral" id="hudPnlVal">+0 G (0.00%)</span>
                    </div>
                </div>

                <!-- Right Group: Quick Navigation Menu Buttons -->
                <div class="hud-group hud-menu-group">
                    <button class="hud-nav-btn" id="btnHudRanking" title="랭킹">
                        <span class="nav-icon">🏆</span>
                        <span class="nav-label">랭킹</span>
                    </button>
                    <button class="hud-nav-btn" id="btnHudHelp" title="도움말">
                        <span class="nav-icon">❓</span>
                        <span class="nav-label">도움말</span>
                    </button>
                    <button class="hud-nav-btn" id="btnHudSettings" title="설정">
                        <span class="nav-icon">⚙️</span>
                        <span class="nav-label">설정</span>
                    </button>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.hudDayVal = document.getElementById('hudDayVal');
        this.hudTimeVal = document.getElementById('hudTimeVal');
        this.hudWeatherItem = document.getElementById('hudWeatherItem');
        this.hudWeatherIcon = document.getElementById('hudWeatherIcon');
        this.hudWeatherTxt = document.getElementById('hudWeatherTxt');
        this.hudCashVal = document.getElementById('hudCashVal');
        this.hudTotalAssetVal = document.getElementById('hudTotalAssetVal');
        this.hudPnlVal = document.getElementById('hudPnlVal');
        this.hudStaminaItem = document.getElementById('hudStaminaItem');
        this.hudHeartContainer = document.getElementById('hudHeartContainer');

        this.btnHudRanking = document.getElementById('btnHudRanking');
        this.btnHudHelp = document.getElementById('btnHudHelp');
        this.btnHudSettings = document.getElementById('btnHudSettings');

        this.renderHearts(this.stamina.current, this.stamina.max);
    }

    initEventListeners() {
        this.hudWeatherItem?.addEventListener('click', () => {
            if (this.callbacks.onWeatherClick) this.callbacks.onWeatherClick();
        });
        this.hudStaminaItem?.addEventListener('click', () => {
            if (this.callbacks.onStaminaClick) {
                this.callbacks.onStaminaClick(this.stamina);
            }
        });

        this.btnHudRanking?.addEventListener('click', () => {
            if (this.callbacks.onRanking) this.callbacks.onRanking();
        });
        this.btnHudHelp?.addEventListener('click', () => {
            if (this.callbacks.onHelp) this.callbacks.onHelp();
        });
        this.btnHudSettings?.addEventListener('click', () => {
            if (this.callbacks.onSettings) this.callbacks.onSettings();
        });
    }

    initClock() {
        const update = () => {
            const now = new Date();
            const hours24 = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = String(hours24 % 12 || 12).padStart(2, '0');

            if (this.hudTimeVal) {
                this.hudTimeVal.textContent = `${hours12}:${minutes}:${seconds} ${ampm}`;
            }
        };

        update();
        this.clockTimer = setInterval(update, 1000);
    }

    updateWeather(weather) {
        if (!weather) return;
        if (this.hudWeatherIcon) {
            this.hudWeatherIcon.textContent = weather.icon || '☀️';
        }
        if (this.hudWeatherTxt) {
            this.hudWeatherTxt.textContent = `${weather.text} ${weather.temp}°C`;
        }
        if (this.hudWeatherItem) {
            this.hudWeatherItem.title = `실시간 로컬 날씨: ${weather.text} ${weather.temp}°C (습도: ${weather.humidity}%)`;
        }
    }

    updateState(state) {
        if (this.hudDayVal) this.hudDayVal.textContent = state.day;
        if (this.hudCashVal) this.hudCashVal.textContent = `${state.cash.toLocaleString()} G`;
        if (this.hudTotalAssetVal) this.hudTotalAssetVal.textContent = `${state.totalNetWorth.toLocaleString()} G`;

        if (this.hudPnlVal) {
            const isPos = state.totalProfitLoss >= 0;
            const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / (state.initialCash || 5000)) * 100 : 0;
            this.hudPnlVal.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()} G (${isPos ? '+' : ''}${pct.toFixed(2)}%)`;
            this.hudPnlVal.className = `asset-val pnl ${isPos ? 'positive' : 'negative'}`;
        }
    }

    getHeartSVG(isFilled) {
        if (isFilled) {
            return `<svg class="hud-heart filled" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#ff3366" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`;
        }
        return `<svg class="hud-heart empty" viewBox="0 0 24 24" width="16" height="16">
            <path fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;
    }

    renderHearts(current = 3, max = 3) {
        this.stamina = { current, max };
        if (!this.hudHeartContainer) return;
        let html = '';
        for (let i = 1; i <= max; i++) {
            const isFilled = i <= current;
            html += this.getHeartSVG(isFilled);
        }
        this.hudHeartContainer.innerHTML = html;
        if (this.hudStaminaItem) {
            this.hudStaminaItem.title = `체력 (스테미너): ${current} / ${max} (알바 노동, 서점 속독, 활동 등에 소모)`;
        }
    }

    updateStamina(current, max = this.stamina.max) {
        this.renderHearts(current, max);
    }

    destroy() {
        if (this.clockTimer) clearInterval(this.clockTimer);
    }
}
