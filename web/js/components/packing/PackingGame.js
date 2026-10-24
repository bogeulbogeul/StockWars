import { createSession } from './PackingData.js?v=patterns-20-v1';
import { placeItem, resetOrder, finishOrder } from './PackingLogic.js';
import { shellHtml, renderPacking } from './PackingView.js?v=whole-loaf-20261022';
import { PackingInput } from './PackingInput.js?v=whole-loaf-20261022';

export class PackingGame {
    constructor({ onOpen = () => {}, onClose = () => {} } = {}) {
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'packing-game';
        this.dialog.setAttribute('aria-labelledby', 'packing-title');
        this.dialog.innerHTML = shellHtml();
        document.body.append(this.dialog);
        this.input = new PackingInput(this);
        this.dialog.addEventListener('click', event => this.click(event));
        this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
        this.dialog.addEventListener('close', () => {
            this.input.cancel();
            this.onClose();
            if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
        });
        // Capture at window before existing world shortcuts; Tab remains native for focus trapping.
        window.addEventListener('keydown', event => {
            if (!this.isOpen) return;
            event.stopImmediatePropagation();
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                if (this.input.drag) { this.input.cancel(); this.say('이동을 취소했어요.'); }
                else this.close();
            }
        }, true);
        window.addEventListener('keyup', event => { if (this.isOpen) event.stopImmediatePropagation(); }, true);
    }

    get isOpen() { return this.dialog.open; }
    get order() { return this.session.orders[Math.min(this.session.completed, this.session.orders.length - 1)]; }

    open() {
        if (this.isOpen) return;
        this.previousFocus = document.activeElement;
        this.session ||= createSession();
        this.selected = null;
        this.onOpen();
        this.render();
        this.dialog.showModal();
        this.focusStart();
        this.say('');
    }

    close() { this.input.cancel(); this.dialog.close(); }
    render() {
        renderPacking(this.dialog, this.session, this.selected);
    }
    say(text) { this.dialog.querySelector('.packing-message').textContent = text; }
    focusItem(id) { this.dialog.querySelector(`[data-item="${id}"]`)?.focus({ preventScroll: true }); }
    focusStart() {
        const selector = this.session.awaitingNext ? '.packing-result button' : '[data-item]';
        this.dialog.querySelector(selector)?.focus({ preventScroll: true });
    }

    click(event) {
        if (this.ignorePointerClick) return;
        const itemButton = event.target.closest('[data-item]');
        if (itemButton && !this.session.awaitingNext) {
            this.selected = itemButton.dataset.item;
            this.render(); this.focusItem(this.selected);
            this.say('물건을 끌어 담거나 놓을 칸을 눌러주세요.');
            return;
        }
        const cell = event.target.closest('[data-x]');
        if (cell && !this.session.awaitingNext) {
            const item = this.order.items.find(item => item.id === this.selected);
            if (!item) { this.say('먼저 담을 물건을 선택해 주세요.'); return; }
            const success = placeItem(this.order, item, Number(cell.dataset.x), Number(cell.dataset.y));
            this.render(); this.focusItem(item.id);
            this.say(success ? `${item.name}을 담았어요.` : '이 칸에는 들어가지 않아요. 다른 위치에 놓아보세요.');
            return;
        }
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'close') { this.close(); return; }
        if (this.session.awaitingNext && !['next', 'restart'].includes(action)) return;
        if (action === 'reset') {
            resetOrder(this.order); this.selected = null;
        } else if (action === 'finish') {
            if (!finishOrder(this.session)) return;
            this.selected = null;
        } else if (action === 'next') {
            if (this.session.completed >= this.session.orders.length) return;
            this.session.awaitingNext = false;
            this.selected = null;
        } else if (action === 'restart') {
            this.session = createSession(); this.selected = null;
        } else return;
        this.input.cancel();
        this.render(); this.focusStart();
        this.say(action === 'reset' ? '물건을 모두 꺼냈어요. 다시 담아보세요.' : '');
    }
}
