import { footprint, canPlace, placeItem } from './PackingLogic.js';
import { artHtml } from './PackingView.js?v=whole-loaf-20261022';
import { hitsArtwork } from './PackingHitTest.js?v=grab-area-2';

export class PackingInput {
    constructor(game) {
        this.game = game;
        const dialog = game.dialog;
        dialog.addEventListener('pointerdown', event => this.start(event));
        // Host focus changes can release capture on the very first press.
        // Continue tracking at window scope instead of discarding that gesture.
        window.addEventListener('pointermove', event => this.move(event));
        window.addEventListener('pointerup', event => this.end(event));
        window.addEventListener('pointercancel', event => {
            if (event.pointerId === this.drag?.pointerId) this.cancel();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.cancel();
        });
    }

    start(event) {
        const button = event.target.closest('[data-item]');
        if (!button || event.button !== 0 || this.game.session.awaitingNext) return;
        if (this.drag) this.cancel();
        if (!hitsArtwork(button, event.clientX, event.clientY)) return;
        const item = this.game.order.items.find(item => item.id === button.dataset.item);
        this.game.selected = item.id;
        this.drag = { item, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
            clientX: event.clientX, clientY: event.clientY, moved: false };
        this.game.dialog.setPointerCapture(event.pointerId);
        event.preventDefault();
        // Keep the artwork alive throughout the gesture; rebuilding its SVG on
        // every pointer event repeatedly invalidates image painting and layout.
        const dialog = this.game.dialog;
        dialog.querySelector('.packing-ghost').innerHTML = artHtml(item);
        dialog.querySelectorAll('[data-item]').forEach(node => node.classList.toggle('dragging', node.dataset.item === item.id));
        this.paint();
    }

    move(event) {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        // Recover if release happened outside the embedded browser.
        if (event.buttons === 0) { this.cancel(); return; }
        const drag = this.drag;
        drag.clientX = event.clientX;
        drag.clientY = event.clientY;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) drag.moved = true;
        if (drag.moved && this.paintFrame == null) this.paintFrame = requestAnimationFrame(() => {
            this.paintFrame = null;
            if (this.drag) this.paint();
        });
    }

    target() {
        const drag = this.drag;
        const rect = this.game.dialog.querySelector('.packing-grid').getBoundingClientRect();
        const cell = rect.width / this.game.order.width;
        const size = footprint(drag.item);
        return { x: Math.round((drag.clientX - rect.left) / cell - size.width / 2),
            y: Math.round((drag.clientY - rect.top) / cell - size.height / 2), cell, rect, ...size };
    }

    paint() {
        const drag = this.drag, dialog = this.game.dialog;
        const { x, y, cell, rect, width, height } = this.target();
        const ghost = dialog.querySelector('.packing-ghost');
        ghost.hidden = false;
        Object.assign(ghost.style, { left: `${drag.clientX - width * cell / 2}px`,
            top: `${drag.clientY - height * cell / 2}px`, width: `${width * cell}px`, height: `${height * cell}px` });
        const preview = dialog.querySelector('.packing-preview');
        const over = drag.clientX >= rect.left && drag.clientX <= rect.right
            && drag.clientY >= rect.top && drag.clientY <= rect.bottom;
        preview.hidden = !over;
        preview.classList.toggle('invalid', !canPlace(this.game.order, drag.item, x, y));
        Object.assign(preview.style, { left: `${x * cell}px`, top: `${y * cell}px`,
            width: `${width * cell}px`, height: `${height * cell}px` });
    }

    end(event) {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        const drag = this.drag, item = drag.item;
        drag.clientX = event.clientX;
        drag.clientY = event.clientY;
        let message = `${item.name} 선택 · 끌어 담거나 놓을 칸을 눌러주세요.`;
        if (drag.moved) {
            const { x, y } = this.target();
            const tray = this.game.dialog.querySelector('.packing-tray').getBoundingClientRect();
            const inTray = event.clientX >= tray.left && event.clientX <= tray.right
                && event.clientY >= tray.top && event.clientY <= tray.bottom;
            if (inTray) {
                Object.assign(item, { x: null, y: null });
                message = `${item.name}을 준비 공간으로 옮겼어요.`;
            } else if (placeItem(this.game.order, item, x, y)) {
                message = `${item.name}을 담았어요.`;
            } else message = '다른 물건과 겹치거나 상자를 벗어나요. 원래 위치로 돌려놓았어요.';
        }
        this.game.ignorePointerClick = true;
        setTimeout(() => { this.game.ignorePointerClick = false; }, 0);
        this.cancel();
        this.game.render();
        this.game.focusItem(item.id);
        this.game.say(message);
    }

    cancel() {
        cancelAnimationFrame(this.paintFrame); this.paintFrame = null;
        const pointerId = this.drag?.pointerId;
        this.drag = null;
        const dialog = this.game.dialog;
        if (pointerId !== undefined && dialog.hasPointerCapture(pointerId)) dialog.releasePointerCapture(pointerId);
        dialog.querySelector('.packing-ghost').hidden = true;
        dialog.querySelector('.packing-preview').hidden = true;
        dialog.querySelectorAll('.dragging').forEach(node => node.classList.remove('dragging'));
    }
}
