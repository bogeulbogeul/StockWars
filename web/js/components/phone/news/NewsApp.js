import { SECTORS } from '../../../data/stocksData.js';
import { newsShell, newsCard, newsReader } from './NewsTemplates.js';

export class NewsApp {
    constructor(host, source, { stockId, onStock } = {}) {
        Object.assign(this, { host, source, stockId, onStock });
        this.stocks = new Map((source.getState?.().stocks || []).map(stock => [stock.id, stock]));
        this.query = ''; this.sector = 'ALL'; this.signature = '';
        host.classList.add('stock-news');
        host.innerHTML = newsShell(Object.keys(SECTORS), stockId);
        this.listView = host.querySelector('.news-list-view');
        this.readingView = host.querySelector('.news-reading-view');
        this.feed = host.querySelector('[data-news-feed]');
        this.search = host.querySelector('[data-news-search]');
        this.search.oninput = () => { this.query = this.search.value; this.renderList(); };
        this.clickHandler = event => {
            const b = event.target.closest('button'); if (!b) return;
            if (b.dataset.newsId) this.openArticle(b.dataset.newsId);
            if (b.hasAttribute('data-news-back')) this.showList();
            if (b.dataset.newsSector) {
                this.sector = b.dataset.newsSector; this.renderList();
                host.querySelectorAll('[data-news-sector]').forEach(button => button.setAttribute('aria-pressed', String(button === b)));
            }
            if (b.hasAttribute('data-news-clear')) { this.stockId = null; b.remove(); this.renderList(); }
            if (b.hasAttribute('data-news-stock') && this.selected) this.onStock?.(this.selected.stockId);
        };
        host.addEventListener('click', this.clickHandler);
        this.refresh();
        this.unsubscribe = source.subscribe?.(() => this.refresh());
    }
    allNews() { return (this.source.news() || []).filter(article => article.type !== '찌라시'); }
    renderList() {
        const needle = this.query.trim().toLowerCase();
        const news = this.allNews().filter(article => {
            const stock = this.stocks.get(article.stockId);
            const sector = article.sector || stock?.sector;
            return (!this.stockId || article.stockId === this.stockId) && (this.sector === 'ALL' || sector === this.sector)
                && `${article.companyName || stock?.name || ''} ${article.stockId || ''} ${article.title || ''}`.toLowerCase().includes(needle);
        });
        this.host.querySelector('[data-news-count]').textContent = `${news.length}건`;
        this.feed.innerHTML = news.map(article => newsCard(article, this.stocks)).join('')
            || `<p class="news-empty">${this.query ? '검색 결과가 없습니다.' : '표시할 공식 뉴스가 없습니다.'}</p>`;
        this.feed.scrollTop = 0;
    }
    openArticle(id) {
        const article = this.allNews().find(article => article.id === id); if (!article) return;
        this.selected = article;
        this.selectedSignature = JSON.stringify(article);
        this.listView.hidden = true; this.readingView.hidden = false;
        this.host.querySelector('[data-news-back]').hidden = false;
        const reader = this.host.querySelector('.news-reader');
        reader.innerHTML = newsReader(article, this.stocks); reader.scrollTop = 0;
        const related = this.host.querySelector('[data-news-stock]');
        related.dataset.newsStock = article.stockId || ''; related.hidden = !article.stockId;
        reader.querySelector('h3').focus({ preventScroll: true });
    }
    showList() {
        this.listView.hidden = false; this.readingView.hidden = true;
        this.host.querySelector('[data-news-back]').hidden = true;
        const card = [...this.feed.querySelectorAll('[data-news-id]')].find(b => b.dataset.newsId === this.selected?.id);
        (card || this.search).focus({ preventScroll: true });
    }
    refresh() {
        const signature = JSON.stringify(this.allNews());
        if (signature === this.signature) return;
        this.signature = signature;
        const top = this.feed.scrollTop; this.renderList(); this.feed.scrollTop = top;
        if (this.selected && !this.readingView.hidden) {
            const current = this.allNews().find(article => article.id === this.selected.id);
            if (current && JSON.stringify(current) !== this.selectedSignature) {
                const reader = this.host.querySelector('.news-reader');
                const position = reader.scrollTop;
                this.openArticle(current.id); reader.scrollTop = position;
            }
        }
    }
    destroy() { this.unsubscribe?.(); this.host.removeEventListener('click', this.clickHandler); this.search.oninput = null; this.host.classList.remove('stock-news'); }
}
