import { getItemArtwork } from '../data/itemArtwork.js';

export class GiftInbox {
    constructor(app, delivery) {
        this.delivery = delivery;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'settings-dialog gift-inbox';
        this.dialog.setAttribute('aria-label', '받은 선물함');
        this.dialog.addEventListener('keydown', event => event.stopPropagation());
        this.dialog.addEventListener('close', () => this.returnFocus?.focus());
        app.appContainer.append(this.dialog);
    }
    open() {
        this.returnFocus = document.activeElement;
        this.render();
        if (!this.dialog.open) this.dialog.showModal();
    }
    render() {
        this.dialog.replaceChildren();
        const header = document.createElement('header'); header.className = 'gift-inbox-header';
        const heading = document.createElement('div');
        const label = document.createElement('small'); label.textContent = 'BUBBLE · GIFT INBOX';
        const title = document.createElement('h2'); title.textContent = '마음을 담은 선물이 도착했어요';
        heading.append(label, title);
        const close = document.createElement('button'); close.type = 'button'; close.textContent = '✕'; close.setAttribute('aria-label', '선물함 닫기'); close.onclick = () => this.dialog.close();
        header.append(heading, close);
        const hero = document.createElement('div'); hero.className = 'gift-inbox-hero'; hero.textContent = '🎁'; hero.setAttribute('aria-hidden', 'true');
        const summary = document.createElement('p'); summary.className = 'gift-inbox-summary'; summary.textContent = `받지 않은 선물 ${this.delivery.pending.length}개 · 받기를 누르면 소지품으로 이동해요.`;
        this.dialog.append(header, hero, summary);
        const list = document.createElement('div'); list.className = 'gift-inbox-list';
        for (const gift of this.delivery.pending) {
            const card = document.createElement('article'); card.className = 'gift-inbox-item';
            const icon = document.createElement('div'); icon.className = 'gift-inbox-icon'; const artwork = getItemArtwork(gift.item.id);
            if (artwork) {
                const image = document.createElement('img');
                image.src = artwork; image.alt = gift.item.name; image.draggable = false;
                icon.append(image);
            } else icon.textContent = gift.item.icon || '🎁';
            const info = document.createElement('div'); info.className = 'gift-inbox-info';
            const sender = document.createElement('small'); sender.textContent = `${gift.fromName}님이 보냈어요`;
            const name = document.createElement('strong'); name.textContent = gift.item.name;
            const quantity = document.createElement('span'); quantity.textContent = gift.preview ? '1개 · 개발자 미리보기 (아이템 지급 없음)' : '1개 · 수령 대기';
            info.append(sender, name, quantity);
            const receive = document.createElement('button'); receive.type = 'button'; receive.className = 'gift-inbox-receive'; receive.textContent = '받기'; receive.setAttribute('aria-label', `${gift.item.name} 선물 받기`);
            receive.disabled = this.delivery.receiving;
            const status = document.createElement('p'); status.className = 'gift-inbox-status'; status.setAttribute('role', 'status');
            receive.onclick = async () => {
                this.dialog.querySelectorAll('.gift-inbox-receive').forEach(button => { button.disabled = true; });
                let result;
                try { result = await this.delivery.claim(gift.id); }
                catch { result = { success: false, message: '수령 상태를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.' }; }
                if (result.success) {
                    this.render(); this.dialog.querySelector('.gift-inbox-success').textContent = result.message;
                    (this.dialog.querySelector('.gift-inbox-receive') || this.dialog.querySelector('[aria-label="선물함 닫기"]')).focus();
                }
                else { status.textContent = result.message; this.dialog.querySelectorAll('.gift-inbox-receive').forEach(button => { button.disabled = false; }); }
            };
            card.append(icon, info, receive, status); list.append(card);
        }
        if (!this.delivery.pending.length) { const empty = document.createElement('p'); empty.className = 'gift-inbox-empty'; empty.textContent = '선물을 모두 받았어요. 다음 선물을 기다려 볼까요?'; list.append(empty); }
        const success = document.createElement('p'); success.className = 'gift-inbox-success'; success.setAttribute('role', 'status');
        const note = document.createElement('p'); note.className = 'gift-inbox-note'; note.textContent = '소지품이 가득 차면 선물을 보관해 두었다가 자리를 비운 뒤 받을 수 있어요.';
        this.dialog.append(list, success, note);
    }
}
