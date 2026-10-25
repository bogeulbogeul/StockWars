import { createDialogueNext } from '../../components/dialogue/DialogueNext.js';
import { applyDialogueTheme, clearDialogueTheme } from '../../components/dialogue/dialogueTheme.js';
import { assets } from './State.js';
import { MoneyHUD } from '../../components/MoneyHUD.js?v=3';
import { HeartHUD } from '../../components/HeartHUD.js?v=1';
import { PhoneHome } from '../../components/phone/PhoneHome.js';
import { decoratePhoneLauncher } from '../../components/phone/PhoneLauncher.js';
import { renderExhibitionPhoneApp } from './PhoneApps.js';
import { exhibitionStockSource } from './PhoneStockSource.js';
import { mountStockPhoneApp } from '../../components/phone/stock/MountStockApp.js';

export function el(tag, className, text) {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
export function button(text, action, className = '') {
    const node = el('button', className, text); node.type = 'button';
    node.addEventListener('click', action); return node;
}
export class ExhibitionView {
    constructor(onRestart, stockTrading = {}) {
        this.root = el('section', 'exhibition-ui');
        this.root.setAttribute('aria-label', '포포리 마을 첫날 전시 체험');
        this.header = el('header', 'exhibition-header');
        this.location = el('span', 'exhibition-location', '포포리 마을');
        this.wallet = el('span', 'exhibition-wallet'); this.assets = el('span', 'exhibition-assets');
        this.phone = button('스마트폰', () => this.openPhone(), 'exhibition-phone');
        decoratePhoneLauncher(this.phone);
        const stockSource = exhibitionStockSource(() => this.state, stockTrading);
        this.moneyHUD = new MoneyHUD();
        this.heartHUD = new HeartHUD();
        this.moneySource = stockSource;
        this.phoneHome = new PhoneHome({
            canOpen: () => this.canOpenPhone(),
            canUseStock: () => !!this.state?.flags.certificate,
            renderApp: (id, content) => mountStockPhoneApp(this.phoneHome, stockSource, id, content)
                || renderExhibitionPhoneApp(this.state, id, content)
        });
        this.header.append(this.location, this.wallet, this.assets, this.phone,
            button('처음부터', onRestart, 'exhibition-reset'));
        this.panel = el('section', 'exhibition-panel');
        this.panel.setAttribute('aria-label', '이야기와 선택');
        // Keep header state detached for the existing story and phone callbacks.
        this.root.append(this.phone, this.panel); document.body.append(this.root);
        this.root.hidden = true;
    }
    sync(state) {
        this.state = state;
        this.heartHUD.update(state.stamina);
        this.moneyHUD.update(this.moneySource.getState(), {
            bank: !!state.flags.bank,
            stock: !!state.flags.certificate
        });
        this.wallet.hidden = !state.flags.bank; this.assets.hidden = !state.flags.certificate;
        this.phone.hidden = !state.flags.phoneReady;
        this.syncPhoneAvailability();
        this.wallet.textContent = `보유 ${state.cash.toLocaleString()}잎`;
        this.assets.textContent = `자산 ${assets(state).toLocaleString()}잎`;
        this.root.dataset.stage = String(state.cursor);
    }
    clear(title, speaker = '포포리의 첫날') {
        clearDialogueTheme(this.panel);
        this.panel.classList.remove('dialogue-has-next', 'residence-panel', 'bank-application-panel', 'investment-certificate-panel', 'investment-exam-panel');
        this.panel.replaceChildren();
        this.panel.append(el('p', 'exhibition-speaker', speaker));
        if (title) this.panel.append(el('h1', '', title));
    }
    text(text) { this.panel.append(el('p', 'exhibition-text', text)); }
    choices(choices) {
        const row = el('div', 'exhibition-choices');
        choices.forEach(([text, action]) => row.append(button(text, action)));
        this.panel.append(row); row.querySelector('button')?.focus({ preventScroll: true });
    }
    line(beat, next) {
        this.clear(null, beat.speaker === '소망이' ? this.state.nickname || '???' : beat.speaker);
        applyDialogueTheme(this.panel, beat.speaker);
        this.panel.querySelector('.exhibition-speaker')?.classList.add('vn-nameplate');
        this.text(beat.text.replaceAll('[닉네임]', this.state.nickname || '???'));
        this.panel.classList.add('dialogue-has-next');
        this.panel.append(createDialogueNext(() => { if (!this.phoneHome.dialog.open) next(); }));
        this.syncPhoneAvailability();
    }
    canOpenPhone() {
        return !!this.state?.flags.phoneReady
            && (!this.computerRequired || this.computerPowerRequested)
            && (this.phonePromptAllowed || this.panel.hidden || !this.panel.classList.contains('dialogue-has-next'))
            && !document.querySelector('.moa-wake-dialogue:not(.hidden)');
    }
    syncPhoneAvailability() {
        this.phone.disabled = !this.canOpenPhone();
        this.phone.title = this.phone.disabled ? '대화가 끝난 뒤 스마트폰을 열 수 있어요.' : '스마트폰 열기 (P)';
    }
    openPhone() {
        return this.phoneHome.open();
    }
    error(message) { this.text(message); }
}


