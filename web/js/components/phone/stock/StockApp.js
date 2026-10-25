import { phoneIcon } from '../PhoneHomeData.js';
import { esc, money, pct, change, stockRow, indexHtml } from './StockFormat.js';
import { homeScreen, marketScreen, accountScreen, filterStocks } from './StockScreens.js';
import { chartScreen, bindChartPointer } from './StockChart.js';
import { infoScreen } from './StockInfo.js';
import { StockOrder } from './StockOrder.js';

export class StockApp {
    constructor(host, source, { openNews } = {}) {
        Object.assign(this, { host, source, openNews });
        this.tab = 'home'; this.query = ''; this.sector = 'ALL'; this.sort = 'POPULAR';
        this.period = 'LIVE'; this.expanded = false;
        this.recent = source.recent || ['CLOUDBERRY', 'SOCIALMIX', 'ECOBATTERY', 'COZYPAY'];
        try { this.favorites = new Set(JSON.parse(localStorage.getItem('stockwars_favorites') || '["CLOUDBERRY","ECOBATTERY"]')); }
        catch { this.favorites = new Set(); }
        host.classList.add('stock-app');
        host.innerHTML = `<header class="stock-header"><h2 tabindex="-1">토리 증권사</h2></header><div class="stock-indices" aria-label="시장 지수"></div><div class="stock-body"></div><nav class="stock-nav" aria-label="주식 앱 탭">${[['home', '홈', 'home'], ['market', '주식 거래', 'stock'], ['account', '내 계좌', 'profile']].map(([id, name, icon]) => `<button type="button" data-tab="${id}">${phoneIcon(icon)}<span>${name}</span></button>`).join('')}</nav>`;
        this.body = host.querySelector('.stock-body');
        host.onclick = event => this.click(event);
        this.unsubscribe = source.subscribe?.(() => this.refresh());
        this.renderTab();
    }
    state() { return this.source.getState(); }
    renderTab() {
        this.id = null; this.order = null;
        const state = this.state();
        this.host.querySelector('.stock-header').hidden = false;
        this.host.querySelector('.stock-nav').hidden = false;
        this.host.querySelectorAll('.stock-nav [data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === this.tab ? 'page' : 'false'));
        this.body.innerHTML = this.tab === 'market' ? marketScreen() : this.tab === 'account' ? accountScreen(state) : homeScreen(state, this.recent, this.favorites);
        if (this.tab === 'market') {
            const search = this.body.querySelector('[data-search]'); search.value = this.query;
            search.oninput = () => { this.query = search.value; this.renderList(); };
            const sort = this.body.querySelector('[data-sort]'); sort.value = this.sort;
            sort.onchange = () => { this.sort = sort.value; this.renderList(); };
            this.renderList();
        }
        this.body.scrollTop = 0;
        this.updateIndex();
    }
    updateIndex() { this.host.querySelector('.stock-indices').innerHTML = indexHtml(this.state()); }
    renderList() {
        const list = filterStocks(this.state(), this, this.favorites, this.recent);
        this.body.querySelector('[data-stock-list]').innerHTML = list.map(s => `${s.id === this.state().tutorialStockId ? '<small class="stock-notice">모아 추천</small>' : ''}${stockRow(s, this.favorites)}`).join('') || '<p>검색 결과가 없습니다.</p>';
        this.body.querySelectorAll('[data-sector]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sector === this.sector)));
    }
    click(event) {
        const b = event.target.closest('button'); if (!b) return;
        if (b.dataset.tab) { this.tab = b.dataset.tab; this.renderTab(); }
        if (b.dataset.stock) this.openStock(b.dataset.stock);
        if (b.dataset.star) {
            const id = b.dataset.star;
            this.favorites.has(id) ? this.favorites.delete(id) : this.favorites.add(id);
            this.source.onFavorites?.(this.favorites);
            try { localStorage.setItem('stockwars_favorites', JSON.stringify([...this.favorites])); } catch { /* Session favorites remain usable. */ }
            if (this.id) this.updateDetailHeader(); else this.refresh();
        }
        if (b.dataset.sector) { this.sector = b.dataset.sector; this.renderList(); }
        if (b.hasAttribute('data-list-back')) this.renderTab();
        if (b.dataset.subtab) this.renderDetail(b.dataset.subtab);
        if (b.dataset.period) { this.period = b.dataset.period; this.renderDetail('chart'); }
        if (b.hasAttribute('data-expand')) { this.expanded = !this.expanded; this.renderDetail('chart'); }
        if (b.dataset.pricePick) {
            this.renderDetail('order');
            this.order.type.value = 'limit'; this.order.price.disabled = false;
            this.order.price.value = b.dataset.pricePick; this.order.refresh(); this.order.price.focus();
        }
        if (b.hasAttribute('data-related')) this.openNews?.(this.id);
    }
    openStock(id) {
        const stock = this.state().stocks.find(s => s.id === id); if (!stock) return;
        this.id = id; this.period = 'LIVE'; this.expanded = false;
        this.recent = [id, ...this.recent.filter(s => s !== id)].slice(0, 4);
        this.source.recent = this.recent;
        this.source.onStock?.(id);
        this.host.querySelector('.stock-header').hidden = true;
        this.host.querySelector('.stock-nav').hidden = true;
        this.body.innerHTML = '<div class="stock-detail-header"></div><div class="stock-subtabs"></div><div class="stock-detail-content"></div>';
        this.updateDetailHeader(); this.renderDetail('chart'); this.body.scrollTop = 0;
    }
    updateDetailHeader() {
        const stock = this.state().stocks.find(s => s.id === this.id);
        this.body.querySelector('.stock-detail-header').innerHTML = `<button type="button" data-list-back aria-label="종목 목록으로">‹ 목록</button><div><strong>${esc(stock.name)}</strong><small>${esc(stock.id)}</small></div><button class="stock-star" data-star="${esc(stock.id)}" aria-label="관심 종목" aria-pressed="${this.favorites.has(stock.id)}">${this.favorites.has(stock.id) ? '★' : '☆'}</button><p><strong>${money(stock.price)}</strong> ${change(pct(stock))}</p>`;
    }
    renderDetail(tab) {
        const changed = this.subtab !== tab;
        this.subtab = tab; this.order = null;
        this.body.querySelector('.stock-subtabs').innerHTML = [['chart', '차트 · 호가'], ['order', '주문하기'], ['info', '기업 정보']].map(([key, title]) => `<button type="button" data-subtab="${key}" aria-current="${key === tab ? 'page' : 'false'}">${title}</button>`).join('');
        const content = this.body.querySelector('.stock-detail-content');
        content.onclick = null;
        if (tab === 'order') this.order = new StockOrder(content, this.source, this.id);
        else if (tab === 'info') content.innerHTML = infoScreen(this.state().stocks.find(s => s.id === this.id));
        else {
            const book = this.source.book(this.id);
            content.innerHTML = chartScreen(this.source.history(this.id), this.period, this.expanded)
                + `<h3>실시간 호가</h3>${book ? `<div class="stock-book"><div>가격 <span>잔량</span></div>${[...book.asks, ...book.bids].map(row => `<button type="button" data-price-pick="${row.price}"><span>${money(row.price)}</span><span>${row.vol}</span></button>`).join('')}</div>` : '<p>전시 체험은 고정 가격으로 진행합니다.</p>'}<button type="button" class="stock-primary" data-subtab="order">매수 · 매도 주문하기 ›</button>`;
            bindChartPointer(content, this.source.history(this.id), this.period);
        }
        if (changed) content.scrollTop = 0;
    }
    refresh() {
        if (!this.host.isConnected) return;
        this.updateIndex();
        if (this.id) {
            this.updateDetailHeader();
            if (this.order) this.order.refresh();
            else if (this.subtab === 'chart') this.renderDetail('chart');
        } else if (this.tab === 'market') this.renderList();
        else {
            // Do not discard an expanded transaction history on quote ticks.
            const open = this.body.querySelector('.stock-history')?.open;
            const scroll = this.body.scrollTop;
            this.body.innerHTML = this.tab === 'account' ? accountScreen(this.state()) : homeScreen(this.state(), this.recent, this.favorites);
            if (open) this.body.querySelector('.stock-history').open = true;
            this.body.scrollTop = scroll;
        }
    }
    destroy() { this.unsubscribe?.(); this.host.onclick = null; this.host.classList.remove('stock-app'); }
}
