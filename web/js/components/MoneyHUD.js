// Read-only presentation shared by the regular and isolated exhibition accounts.
export class MoneyHUD {
    constructor(container = document.body) {
        this.element = document.createElement('aside');
        this.element.className = 'money-hud';
        this.element.setAttribute('aria-label', '현금, 총자산, 수익률');
        this.element.hidden = true;
        this.element.innerHTML = `
            <div class="money-hud__cash">
                <span class="money-hud__coin" role="img" aria-label="새싹 음각 금화"><b></b><em></em><i></i></span>
                <div class="money-hud__balance"><span class="money-hud__label">현금</span><div class="money-hud__amount"><strong data-money-cash>0</strong><span>잎</span></div></div>
            </div>
            <dl><div><dt>총자산</dt><dd><strong data-money-assets>0</strong><span>잎</span></dd></div>
            <div><dt>수익률</dt><dd data-money-return>0.00%</dd></div></dl>`;
        container.append(this.element);
        this.cash = this.element.querySelector('[data-money-cash]');
        this.assets = this.element.querySelector('[data-money-assets]');
        this.returns = this.element.querySelector('[data-money-return]');
    }

    update(state, { bank = false, stock = false } = {}) {
        const finite = value => Number.isFinite(value) ? value : 0;
        this.cash.textContent = Math.round(finite(state.cash)).toLocaleString('ko-KR');
        this.assets.textContent = Math.round(finite(state.totalNetWorth)).toLocaleString('ko-KR');
        // Match the stock app: current portfolio profit/loss divided by initial cash.
        // Exhibition quotes are fixed and its source reports zero valuation profit.
        const base = state.initialCash || 5000;
        const pct = base > 0 ? finite(state.totalProfitLoss) / base * 100 : 0;
        const rounded = Number(pct.toFixed(2));
        this.returns.textContent = `${rounded > 0 ? '+' : ''}${rounded.toFixed(2)}%`;
        this.returns.dataset.trend = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
        this.cash.style.fontSize = this.cash.textContent.length > 11 ? '19px' : '';
        this.element.querySelector('dl').hidden = !stock;
        this.element.dataset.cashOnly = String(!stock);
        this.element.setAttribute('aria-label', stock ? '현금, 총자산, 수익률' : '현금');
        this.element.hidden = !bank;
    }

    destroy() { this.element.remove(); }
}
