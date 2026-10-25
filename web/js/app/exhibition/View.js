import { assets } from './State.js';

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
    constructor(onRestart) {
        this.root = el('section', 'exhibition-ui');
        this.root.setAttribute('aria-label', '포포리 마을 첫날 전시 체험');
        this.header = el('header', 'exhibition-header');
        this.location = el('span', 'exhibition-location', '포포리 마을');
        this.wallet = el('span', 'exhibition-wallet'); this.assets = el('span', 'exhibition-assets');
        this.phone = button('휴대폰', () => this.openPhone(), 'exhibition-phone');
        this.header.append(this.location, this.wallet, this.assets, this.phone,
            button('처음부터', onRestart, 'exhibition-reset'));
        this.panel = el('section', 'exhibition-panel');
        this.panel.setAttribute('aria-label', '이야기와 선택');
        this.root.append(this.header, this.panel); document.body.append(this.root);
        this.root.hidden = true;
    }
    sync(state) {
        this.state = state;
        this.wallet.hidden = !state.flags.bank; this.assets.hidden = !state.flags.certificate;
        this.phone.hidden = !state.flags.phone;
        this.wallet.textContent = `보유 ${state.cash.toLocaleString()}잎`;
        this.assets.textContent = `자산 ${assets(state).toLocaleString()}잎`;
        this.root.dataset.stage = String(state.cursor);
    }
    clear(title, speaker = '포포리의 첫날') {
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
        this.clear(null, beat.speaker === '소망이' ? this.state.nickname || '소망이' : beat.speaker);
        this.text(beat.text.replaceAll('[닉네임]', this.state.nickname || '소망이'));
        this.choices([['다음 ›', next]]);
    }
    openPhone() {
        if (!this.state.flags.phone || document.querySelector('.exhibition-phone-dialog[open]')) return;
        const dialog = document.createElement('dialog'); dialog.className = 'exhibition-phone-dialog';
        dialog.append(el('h2', '', '포포리 연락처'), el('p', '', '모아 · 모아 안내소'));
        if (this.state.flags.bank) {
            dialog.append(el('p', '', `생활 계좌 · ${this.state.cash.toLocaleString()}잎`));
            if (this.state.debt) dialog.append(el('p', '', `빌린 정착 자금 · ${this.state.debt.toLocaleString()}잎`));
        }
        if (this.state.flags.certificate) {
            dialog.append(el('h3', '', '토리 주식앱'), el('p', '', `자산 ${assets(this.state).toLocaleString()}잎`));
            for (const trade of this.state.trades) dialog.append(el('p', '', `${trade.name} ${trade.quantity}주 · ${trade.price.toLocaleString()}잎 매수`));
            if (!this.state.trades.length) dialog.append(el('p', '', '토리와 함께 첫 매수를 진행해 보세요.'));
        }
        dialog.append(button('닫기', () => dialog.close()));
        dialog.addEventListener('close', () => { dialog.remove(); this.phone.focus(); });
        document.body.append(dialog); dialog.showModal();
    }
    error(message) { this.text(message); }
}
