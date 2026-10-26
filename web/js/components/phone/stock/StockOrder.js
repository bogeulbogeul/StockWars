import { esc, money, num } from './StockFormat.js';

export class StockOrder {
    constructor(host, source, id) {
        Object.assign(this, { host, source, id });
        this.short = false; this.leverage = 1; this.busy = false;
        const unlocked = source.unlocked();
        host.innerHTML = `<section class="stock-order-fields" aria-label="주문 조건">${source.readOnly ? `<p class="stock-notice">${esc(source.readOnly)}</p>` : ''}<div class="stock-toggle"><button type="button" data-mode="long" aria-pressed="true">현물</button><button type="button" data-mode="short" aria-pressed="false" ${unlocked ? '' : 'disabled'}>공매도 ${unlocked ? '' : '· Lv.10'}</button></div><p>마진 레버리지</p><div class="stock-toggle">${[1, 2, 3, 5].map(n => `<button type="button" data-leverage="${n}" aria-pressed="${n === 1}" ${n > 1 && !unlocked ? 'disabled' : ''}>${n}x${n > 1 && !unlocked ? ' 잠김' : ''}</button>`).join('')}</div><label>주문 방식 <select data-type><option value="market">시장가</option><option value="limit">지정가</option></select></label><label>지정가 (잎) <input data-price type="number" min="1" step="1" disabled></label><label>수량 <span class="stock-stepper"><button type="button" data-step="-1" aria-label="수량 줄이기">−</button><input aria-label="주문 수량" data-qty type="number" value="1" min="1" step="1"><button type="button" data-step="1" aria-label="수량 늘리기">+</button></span></label><div class="stock-quick">${[1, 5, 10, 'MAX', 'SELL_MAX'].map(n => `<button type="button" data-qty-set="${n}">${n === 'MAX' ? '매수 MAX' : n === 'SELL_MAX' ? '매도 MAX' : n + '주'}</button>`).join('')}</div><p data-account></p></section><section class="stock-order-review" aria-label="결제 확인"><div class="stock-estimate"><small>예상 결제액</small><strong data-total></strong><p data-fee></p><p data-remaining></p><details><summary>계산 상세</summary><p data-calculation></p><p>체결 가격에 따라 결제액이 달라질 수 있어요.</p></details></div><p data-sell-preview></p><div class="stock-execute"><button type="button" data-execute="buy">매수</button><button type="button" data-execute="sell">매도</button></div><details><summary>주문 방식 안내</summary><p>시장가는 호가 물량 순서로 체결되며 가격 보호 ±5%·현금·물량 한도로 남은 수량은 취소됩니다. 지정가 매수는 입력 가격 이하, 매도는 이상에서 체결됩니다. 대기 주문은 현금·주식을 묶어두지 않으며 체결 시 부족하면 취소됩니다.</p></details><div data-pending></div><p data-result role="status" aria-live="polite"></p></section>`;
        this.qty = host.querySelector('[data-qty]'); this.price = host.querySelector('[data-price]'); this.type = host.querySelector('[data-type]');
        if (source.orderPolicy) {
            const note = document.createElement('p'); note.className = 'stock-notice'; note.textContent = source.policyNote;
            host.querySelector('.stock-order-fields').prepend(note);
            this.qty.value = source.orderPolicy.quantity; this.qty.readOnly = true;
            this.type.disabled = !!source.orderPolicy.marketOnly;
            host.querySelectorAll('[data-step], [data-qty-set]').forEach(button => { button.disabled = true; });
        }
        host.addEventListener('input', () => this.refresh());
        this.type.onchange = () => {
            this.price.disabled = this.type.value !== 'limit';
            if (!this.price.value) this.price.value = this.stock().price;
            this.refresh();
        };
        host.onclick = event => {
            const b = event.target.closest('button'); if (!b) return;
            if (b.dataset.mode) this.short = b.dataset.mode === 'short';
            if (b.dataset.leverage) this.leverage = Number(b.dataset.leverage);
            if (b.dataset.step) this.qty.value = Math.max(1, this.quantity() + Number(b.dataset.step));
            if (b.dataset.qtySet) {
                const n = b.dataset.qtySet;
                this.qty.value = n === 'MAX' ? source.max?.(id, this.leverage, this.limit(), this.short) || 0
                    : n === 'SELL_MAX' ? source.held(id) : Number(n);
            }
            if (b.dataset.cancel) source.cancel?.(b.dataset.cancel);
            if (b.dataset.execute) this.execute(b.dataset.execute);
            this.refresh();
        };
        this.refresh();
    }
    stock() { return this.source.getState().stocks.find(s => s.id === this.id); }
    quantity() { return Number(this.qty.value); }
    limit() { return this.type.value === 'limit' ? Number(this.price.value) : null; }
    valid() { return Number.isSafeInteger(this.quantity()) && this.quantity() > 0 && (this.limit() == null || (Number.isSafeInteger(this.limit()) && this.limit() > 0)); }
    execute(side) {
        if (this.busy || this.source.readOnly || !this.valid()) return;
        this.busy = true;
        try {
            const result = this.source.execute(side === 'buy' && this.short ? 'short' : side, this.id, this.quantity(), this.leverage, this.limit());
            this.host.querySelector('[data-result]').textContent = String(result.msg || '').replace(/Gold|G\b/g, '잎');
        } finally { this.busy = false; }
    }
    refresh() {
        const { host, source } = this;
        const unlocked = source.unlocked();
        if (!unlocked) { this.short = false; this.leverage = 1; }
        host.querySelector('[data-mode="short"]').disabled = !unlocked;
        host.querySelector('[data-mode="short"]').textContent = unlocked ? '공매도' : '공매도 · Lv.10';
        host.querySelectorAll('[data-leverage]').forEach(b => {
            const n = Number(b.dataset.leverage); b.disabled = n > 1 && !unlocked;
            b.textContent = `${n}x${b.disabled ? ' 잠김' : ''}`;
        });
        const set = (key, text) => { host.querySelector(`[data-${key}]`).textContent = text; };
        host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'short') === this.short)));
        host.querySelectorAll('[data-leverage]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.leverage) === this.leverage)));
        const valid = this.valid();
        const quote = valid ? source.preview?.(this.short ? 'short' : 'buy', this.id, this.quantity(), this.leverage, this.limit()) : null;
        set('total', quote ? money(quote.total) : '—');
        set('fee', quote ? `예상 수수료 ${money(quote.fee)} 포함 · 적용률 ${num(quote.feeRate * 100)}%` : '수량과 주문 가격을 확인해 주세요.');
        set('remaining', quote?.remaining ? `${quote.remaining}주 미체결 · 잔량 취소` : '');
        set('calculation', `${num(quote?.quantity ?? this.quantity())}주 · ${this.leverage}배 · ${this.limit() == null ? '시장가' : money(this.limit())}`);
        set('account', `주문 가능 ${money(source.getState().cash)} · 보유 ${source.held(this.id)}주`);
        const sale = valid ? source.sellPreview?.(this.id, this.quantity(), this.limit()) : null;
        set('sell-preview', sale?.quantity ? `매도 예상 ${sale.quantity}주 · 수령 ${money(sale.proceeds)} · 실현 손익 ${money(sale.profit)}` : '');
        const error = source.orderError?.(this.id, this.short);
        for (const b of host.querySelectorAll('[data-execute]')) {
            b.disabled = !valid || !!source.readOnly || this.busy || (b.dataset.execute === 'buy' ? !!error : !!source.orderPolicy || !source.held(this.id));
            b.title = source.readOnly || error || '';
        }
        host.querySelector('[data-execute="buy"]').textContent = this.short ? '공매도 진입' : '매수';
        const orders = source.pending(this.id);
        host.querySelector('[data-pending]').innerHTML = `<h3>미체결 주문 · ${orders.length}건</h3>${orders.map(o => `<div class="stock-pending"><span>${({ buy: '매수', sell: '매도', short: '공매도' })[o.side]} ${num(o.qty)}주 · 지정가 ${money(o.price)}</span><button type="button" data-cancel="${esc(o.id)}">취소</button></div>`).join('')}`;
    }
}
