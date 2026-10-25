import { PHONE_APPS, phoneIcon } from './PhoneHomeData.js';
import { phoneHomeTemplate } from './PhoneHomeTemplate.js';
import { weatherService } from '../../engine/weatherService.js';

// A separate UI keeps retired neon views and their entry points disconnected.
export class PhoneHome {
    constructor({ canOpen = () => true, canUseStock = () => true, renderApp, onOpen } = {}) {
        Object.assign(this, { canOpen, canUseStock, renderApp, onOpen });
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'cozy-phone';
        this.dialog.setAttribute('aria-label', '스마트폰');
        this.dialog.innerHTML = phoneHomeTemplate();
        document.body.append(this.dialog);
        this.home = this.dialog.querySelector('.cozy-phone__home');
        this.detail = this.dialog.querySelector('.cozy-phone__detail');
        this.dialog.querySelector('.cozy-phone__back').onclick = () => this.showHome();
        this.dialog.querySelectorAll('[data-phone-app]').forEach(button => {
            button.onclick = () => this.openApp(button.dataset.phoneApp);
        });
        this.dialog.addEventListener('close', () => {
            if (this.dialog.open) return;
            clearInterval(this.timer);
            this.appCleanup?.(); this.appCleanup = null;
            if (this.opener?.matches?.('.phone-launcher')) this.opener.blur();
            else this.opener?.focus?.({ preventScroll: true });
        });
        this.dialog.addEventListener('click', event => {
            if (event.target === this.dialog) this.close();
        });
        // Stop world shortcuts while the modal is open, without swallowing native Tab/Escape.
        this.keyHandler = event => {
            if (!this.dialog.open) {
                if (event.type === 'keydown' && event.code === 'KeyP' && !event.repeat
                    && !event.ctrlKey && !event.altKey && !event.metaKey
                    && !document.body.classList.contains('title-screen-active')
                    && !event.target.closest?.('input, textarea, select, [contenteditable="true"]')
                    && this.open()) {
                    event.preventDefault(); event.stopImmediatePropagation();
                }
                return;
            }
            if (event.type === 'keydown' && this.captureSettingsKey?.(event)) {
                event.preventDefault(); event.stopImmediatePropagation(); return;
            }
            if (event.type === 'keydown' && this.captureAppKey?.(event)) {
                event.preventDefault(); event.stopImmediatePropagation(); return;
            }
            event.stopImmediatePropagation();
            if (event.type === 'keydown' && event.code === 'KeyP' && !event.repeat
                && !event.ctrlKey && !event.altKey && !event.metaKey) {
                event.preventDefault(); this.close();
            }
        };
        window.addEventListener('keydown', this.keyHandler, true);
        window.addEventListener('keyup', this.keyHandler, true);
    }
    open() {
        if (this.dialog.open || !this.canOpen()) return this.dialog.open;
        if (document.querySelector('dialog[open]')) return false;
        clearInterval(this.timer);
        this.opener = document.activeElement;
        this.showHome(false); this.updateClock();
        this.dialog.showModal();
        this.timer = setInterval(() => this.updateClock(), 1000);
        this.onOpen?.();
        return true;
    }
    close() {
        clearInterval(this.timer);
        this.appCleanup?.(); this.appCleanup = null;
        this.dialog.close();
    }
    showHome(focus = true) {
        this.appCleanup?.(); this.appCleanup = null;
        this.detail.querySelector('.cozy-phone__content').replaceChildren();
        this.detail.scrollTop = 0;
        this.home.hidden = false; this.detail.hidden = true;
        this.dialog.querySelector('[data-phone-notice]').hidden = true;
        this.updateStockAccess();
        if (focus) this.dialog.querySelector(`[data-phone-app="${this.activeApp || 'stock'}"]:not([hidden])`)?.focus();
    }
    openApp(id) {
        const app = PHONE_APPS.find(item => item[0] === id);
        if (!app) return;
        if (id === 'stock' && !this.canUseStock()) {
            this.showHome(false);
            const notice = this.dialog.querySelector('[data-phone-notice]');
            notice.textContent = '토리에게 투자 자격증을 받으면 주식 앱을 사용할 수 있어요.';
            notice.hidden = false;
            return false;
        }
        this.appCleanup?.(); this.appCleanup = null;
        this.activeApp = id; this.home.hidden = true; this.detail.hidden = false;
        const title = this.detail.querySelector('h2'); title.textContent = app[1];
        const content = this.detail.querySelector('.cozy-phone__content'); content.replaceChildren();
        const mounted = this.renderApp?.(id, content);
        if (typeof mounted === 'function') this.appCleanup = mounted;
        if (!mounted) {
            const message = document.createElement('p');
            message.textContent = '새 화면을 준비하고 있어요.'; content.append(message);
        }
        this.detail.scrollTop = 0;
        if (['stock', 'news'].includes(id) && mounted) content.querySelector('h2')?.focus(); else title.focus();
    }
    updateStockAccess() {
        const button = this.dialog.querySelector('[data-phone-app="stock"]');
        const locked = !this.canUseStock();
        button.hidden = false;
        button.setAttribute('aria-disabled', String(locked));
        button.setAttribute('aria-label', locked ? '주식 · 투자 자격증 필요' : '주식');
        button.querySelector('.cozy-phone__lock').hidden = !locked;
    }
    updateClock() {
        this.updateStockAccess();
        const now = new Date();
        const time = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
        this.dialog.querySelector('[data-phone-status]').textContent = time;
        this.dialog.querySelector('[data-phone-time]').textContent = time;
        this.dialog.querySelector('[data-phone-time]').dateTime = now.toISOString();
        this.dialog.querySelector('[data-phone-date]').textContent = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(now);
        const weather = weatherService.currentWeather;
        const category = weather?.category;
        const id = category === 'snow' ? 'snow' : ['rain', 'thunderstorm'].includes(category) ? 'rain'
            : ['overcast', 'partly_cloudy'].includes(category) ? 'cloud' : 'sun';
        const icon = this.dialog.querySelector('[data-phone-weather]');
        icon.innerHTML = phoneIcon(id); icon.setAttribute('role', 'img');
        icon.setAttribute('aria-label', weather?.text || '맑음');
        icon.dataset.weather = id;
    }
    destroy() {
        if (this.dialog.open) this.close();
        clearInterval(this.timer);
        window.removeEventListener('keydown', this.keyHandler, true);
        window.removeEventListener('keyup', this.keyHandler, true);
        this.dialog.remove();
    }
}
