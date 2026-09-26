/**
 * NewsTab Component (스마트폰 HTS 공식 뉴스 및 기업 공시 탭)
 * Displays verified corporate disclosures and market headlines.
 */

export class NewsTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
    }

    updateState(state) {
        if (!state) return;
        this.renderNews(state.news);
    }

    renderNews(newsList) {
        if (!this.dom.newsListContainer) return;
        // The stock trading app only displays official news and corporate disclosures
        const officialNews = (newsList || []).filter(n => n.type !== '찌라시');

        if (officialNews.length === 0) {
            this.dom.newsListContainer.innerHTML = `<div class="item-desc" style="padding:24px; text-align:center;">등록된 공식 공시 및 시장 뉴스가 없습니다.</div>`;
            return;
        }

        this.dom.newsListContainer.innerHTML = officialNews.map(n => `
            <div class="news-card" data-news-id="${n.id}">
                <div class="news-header">
                    <span class="news-type-tag ${n.type === '공시' ? 'type-disclosure' : 'type-news'}">${n.type}</span>
                    <span class="news-time">${n.time}</span>
                </div>
                <div class="news-title">${n.title}</div>
                <div class="news-content">${n.content}</div>
                <div class="news-footer">
                    <span class="impact-tag ${n.isPositive ? 'gainer' : 'loser'}">예상 파급력: ${n.impact}</span>
                    <button class="news-trade-link" data-id="${n.stockId}">차트 보기 및 거래 ➔</button>
                </div>
            </div>
        `).join('');

        this.dom.newsListContainer.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('news-trade-link')) return;
                if (this.callbacks.onOpenNewsDetailModal) {
                    this.callbacks.onOpenNewsDetailModal(card.dataset.newsId);
                }
            });
        });

        this.dom.newsListContainer.querySelectorAll('.news-trade-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(btn.dataset.id);
                }
            });
        });
    }
}