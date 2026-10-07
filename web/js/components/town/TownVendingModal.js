import { VIVIAN_SHOP_CATALOG } from '../../data/vivianStoreData.js';
export const VENDING_ITEM = VIVIAN_SHOP_CATALOG.find(item => item.id === 'item_energy_drink');

// Payment delivers immediately; collecting is presentation only, so closing cannot lose an item.
export class VendingCycle {
    phase = 'idle';
    select() { if (this.phase === 'idle') this.phase = 'selected'; }
    buy(purchase, instant) {
        if (this.phase !== 'selected') return null;
        this.phase = 'dispensing';
        const result = purchase?.(instant);
        if (!result?.success) this.phase = 'selected';
        else this.instant = instant;
        return result;
    }
    finish() { if (this.phase === 'dispensing') this.phase = 'ready'; }
    collect() { if (this.phase !== 'ready') return false; this.phase = 'idle'; return true; }
}

export class TownVendingModal {
    constructor(container, callbacks = {}) {
        this.callbacks = callbacks;
        this.cycle = new VendingCycle();
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'town-vending-dialog';
        this.dialog.setAttribute('aria-label', '에너지 드링크 자판기');
        const can = new URL('../../../assets/items/vivian-front-v1/item_energy_drink.png', import.meta.url).href;
        this.dialog.innerHTML = `<style>
        .town-vending-dialog{margin:auto;max-height:calc(calc(100 * var(--game-vh)) - 24px);overflow:auto;width:min(390px,calc(calc(100 * var(--game-vw)) - 24px));box-sizing:border-box;border:3px solid #397e7c;border-radius:24px;padding:22px;background:#f3ebd5;color:#243c43;box-shadow:inset 0 0 0 6px #d7cbb0,0 20px 80px #0008;font-family:inherit}
        .town-vending-dialog::backdrop{background:#10232aaa}.town-vending-dialog *{box-sizing:border-box}
        .town-vending-dialog h2{margin:4px 0 16px;font-size:21px}.vending-label{font-size:11px;color:#267870;letter-spacing:2px;font-weight:bold}
        .vending-display{padding:10px 14px;border:3px solid #4d6667;border-radius:9px;background:#102d31;color:#9be4c8;font-size:13px;line-height:1.6}
        .vending-window{margin:12px 0;padding:12px;border:5px solid #548681;border-radius:12px;background:linear-gradient(120deg,#cbe6dc,#f5f4dc 50%,#b2d1c7);text-align:center}
        .vending-cans{display:flex;justify-content:center;gap:12px;border-bottom:5px solid #6c8e88;padding:4px 0 9px}.vending-cans img{width:62px;height:80px;object-fit:contain}
        .vending-product-name{margin:10px 0 4px;font-weight:bold;font-size:15px}.vending-detail{font-size:12px;margin:6px 0;color:#516661}
        .town-vending-dialog button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:10px}.town-vending-dialog button:focus-visible{outline:3px solid #e7aa29;outline-offset:3px}
        .town-vending-dialog button:disabled{cursor:default;opacity:.5}
        .town-vending-dialog [data-select]{width:100%;background:#254b4c;color:#c7ebcb;margin-top:8px;font-size:13px;box-shadow:0 3px #142f30}
        .town-vending-dialog [data-select][aria-pressed=true]{background:#f4ca55;color:#283e39;box-shadow:0 0 12px #edcd62}
        .vending-payments{display:flex;gap:8px;margin:12px 0}.vending-payments button{flex:1;background:#247d76;color:#fff;font-size:13px}
        .vending-outlet{position:relative;height:84px;overflow:hidden;border:6px solid #567574;border-radius:8px;background:#172e32;box-shadow:inset 0 10px 12px #0009}
        .vending-outlet::before{content:'PUSH';position:absolute;top:5px;left:0;right:0;text-align:center;color:#7f9697;font-size:10px;letter-spacing:4px}
        .town-vending-dialog [data-collect]{position:absolute;inset:0;width:100%;padding:4px;background:transparent;color:#def3e3;display:flex;align-items:center;justify-content:center;gap:18px;font-size:12px}
        .vending-outlet img{height:60px;width:52px;object-fit:contain;transform:rotate(80deg)}
        .town-vending-dialog[data-phase=dispensing] .vending-outlet img{animation:vending-drop .8s ease-in both}
        .town-vending-dialog[data-phase=ready] .vending-outlet{border-color:#d1ad50;box-shadow:0 0 10px #eed789}
        .town-vending-dialog [data-collect][hidden]{display:none}
        .town-vending-dialog [role=status]{min-height:38px;line-height:1.5;font-size:12px;margin:10px 0 4px}
        .town-vending-dialog [data-close]{width:100%;background:#ded5be;color:#344c4b;font-size:13px}
        @keyframes vending-drop{0%{transform:translateY(-95px) rotate(0)}70%{transform:translateY(6px) rotate(90deg)}85%{transform:translateY(-7px) rotate(75deg)}100%{transform:translateY(0) rotate(80deg)}}
        @media(prefers-reduced-motion:reduce){.town-vending-dialog[data-phase=dispensing] .vending-outlet img{animation:none}}
        </style><div class="vending-label">24H · ENERGY STATION</div><h2>에너지 드링크 자판기</h2>
        <div class="vending-display" data-balance></div>
        <div class="vending-window"><div class="vending-cans" aria-hidden="true"><img src="${can}" alt=""><img src="${can}" alt=""><img src="${can}" alt=""></div>
        <div class="vending-product-name">에너지 드링크 · ${VENDING_ITEM.price}G</div><div class="vending-detail">기력 하트 1칸 회복</div>
        <button data-select aria-pressed="false">● 상품 선택</button></div>
        <div class="vending-detail">잡화점과 합산 하루 ${VENDING_ITEM.dailyLimit}개 · 구매 즉시 지급</div>
        <div class="vending-payments"><button data-buy="bag">${VENDING_ITEM.price}G · 뽑기</button><button data-buy="drink">${VENDING_ITEM.price}G · 뽑아 마시기</button></div>
        <div class="vending-outlet"><button data-collect hidden aria-label="배출된 드링크 꺼내기"><img src="${can}" alt="배출된 에너지 드링크"><span data-outlet-label>배출 중…</span></button></div>
        <p role="status" aria-live="polite">상품 버튼을 눌러 주세요.</p><button data-close>닫기</button>`;
        container.appendChild(this.dialog);
        this.dialog.querySelector('[data-close]').onclick = () => this.dialog.close();
        this.dialog.querySelector('[data-select]').onclick = () => {
            this.cycle.select(); this.message('에너지 드링크 선택 완료. 구매 방식을 골라 주세요.'); this.refresh();
        };
        this.dialog.querySelectorAll('[data-buy]').forEach(button => {
            button.onclick = () => {
                const result = this.cycle.buy(this.callbacks.onPurchaseDrink, button.dataset.buy === 'drink');
                if (!result?.success) { this.message(result?.message || '구매할 수 없습니다.'); this.refresh(); return; }
                this.message('덜컹! 드링크가 내려오고 있어요.'); this.refresh();
                setTimeout(() => { this.cycle.finish(); this.message('배출구를 눌러 드링크를 꺼내세요.'); this.refresh(); }, 850);
            };
        });
        this.dialog.querySelector('[data-collect]').onclick = () => {
            if (!this.cycle.collect()) return;
            this.message(this.cycle.instant ? '드링크를 꺼내 마셨습니다. 기력 1칸 회복!' : '드링크를 꺼냈습니다. 가방에서 확인하세요.'); this.refresh();
        };
    }
    get isOpen() { return this.dialog.open; }
    message(text) { this.dialog.querySelector('[role=status]').textContent = text; }
    refresh() {
        const state = this.callbacks.getVendingState?.();
        const remaining = Math.max(0, VENDING_ITEM.dailyLimit - (state?.purchased || 0));
        this.dialog.dataset.phase = this.cycle.phase;
        this.dialog.querySelector('[data-balance]').textContent = state
            ? `보유 ${state.cash.toLocaleString()}G · 오늘 ${remaining}개 구매 가능 · 가방 ${state.owned}개`
            : '자판기 연결 대기 중';
        const busy = ['dispensing', 'ready'].includes(this.cycle.phase);
        const select = this.dialog.querySelector('[data-select]');
        select.disabled = busy;
        select.setAttribute('aria-pressed', String(this.cycle.phase !== 'idle'));
        this.dialog.querySelectorAll('[data-buy]').forEach(button => {
            button.disabled = this.cycle.phase !== 'selected' || !state || remaining === 0 || state.cash < VENDING_ITEM.price;
        });
        const collect = this.dialog.querySelector('[data-collect]');
        collect.hidden = !busy;
        collect.disabled = this.cycle.phase !== 'ready';
        this.dialog.querySelector('[data-outlet-label]').textContent = this.cycle.phase === 'ready' ? '눌러서 꺼내기' : '배출 중…';
    }
    open() { this.refresh(); if (!this.isOpen) this.dialog.showModal(); }
}
