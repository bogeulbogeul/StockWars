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
        this.dialog.querySelector('.cozy-phone__close').onclick = () => this.close();
        this.dialog.querySelector('.cozy-phone__back').onclick = () => this.showHome();
        this.dialog.querySelector('.cozy-phone__home-key').onclick = () => this.showHome();
        this.dialog.querySelectorAll('[data-phone-app]').forEach(button => {
            button.onclick = () => this.openApp(button.dataset.phoneApp);
        });
        this.dialog.addEventListener('close', () => {
            clearInterval(this.timer);
            this.appCleanup?.(); this.appCleanup = null;
            this.opener?.focus?.({ preventScroll: true });
        });
        this.dialog.addEventListener('click', event => {
            if (event.target === this.dialog) this.close();
        });
        // Stop world shortcuts while the modal is open, without swallowing native Tab/Escape.
        this.keyHandler = event => {
            if (!this.dialog.open) return;
            event.stopImmediatePropagation();
            if (event.type === 'keydown' && event.code === 'KeyP' && !event.repeat
                && !event.target.closest('input, textarea, [contenteditable="true"]')) {
                event.preventDefault(); this.close();
            }
        };
        window.addEventListener('keydown', this.keyHandler, true);
        window.addEventListener('keyup', this.keyHandler, true);
    }
    open() {
        if (this.dialog.open || !this.canOpen()) return this.dialog.open;
        if (document.querySelector('dialog[open]')) return false;
        this.opener = document.activeElement;
        this.showHome(false); this.updateClock();
        this.dialog.querySelector('[data-phone-app="stock"]').hidden = !this.canUseStock();
        this.dialog.showModal();
        this.timer = setInterval(() => this.updateClock(), 1000);
        this.onOpen?.();
        return true;
    }
    close() { this.dialog.close(); }
    showHome(focus = true) {
        this.appCleanup?.(); this.appCleanup = null;
        this.home.hidden = false; this.detail.hidden = true;
        if (focus) this.dialog.querySelector(`[data-phone-app="${this.activeApp || 'stock'}"]:not([hidden])`)?.focus();
    }
    openApp(id) {
        const app = PHONE_APPS.find(item => item[0] === id);
        if (!app || (id === 'stock' && !this.canUseStock())) return;
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
        if (id === 'stock' && mounted) content.querySelector('h2')?.focus(); else title.focus();
    }
    updateClock() {
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
