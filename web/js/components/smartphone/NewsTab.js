/**
 * NewsTab Component (스마트폰 공식 뉴스 & 공시 탭)
 * Handles rendering verified corporate disclosures and market news feeds.
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
            this.dom.newsListContainer.innerHTML = <div class="item-desc" style="padding:24px; text-align:center;">등록된 공식 공시 및 시장 뉴스가 없습니다.</div>;
            return;
        }

        this.dom.newsListContainer.innerHTML = officialNews.map(n => 
            <div class="news-card" data-news-id="">
                <div class="news-header">
                    <span class="news-type-tag "></span>
                    <span class="news-time"></span>
                </div>
                <div class="news-title"></div>
                <div class="news-content"></div>
                <div class="news-footer">
                    <span class="impact-tag ">예상 파급력: </span>
                    <button class="news-trade-link" data-id="">차트 보기 및 거래 ➔</button>
                </div>
            </div>
        ).join('');

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