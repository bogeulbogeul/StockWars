/**
 * NewsDetailModal Component
 * Unity equivalent: UINewsDetailModal.cs
 * Article reader for news, disclosures and rumors with a related-stock action.
 */

export class NewsDetailModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.currentNews = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="newsDetailModal" class="modal-overlay hidden">
                <div class="modal-card news-detail-card" role="dialog" aria-modal="true" aria-labelledby="newsDetailTitle">
                    <div class="modal-header">
                        <div class="news-detail-badge-area">
                            <span id="newsDetailType" class="news-type-tag type-news">공시</span>
                            <span id="newsDetailStockBadge" class="stock-sector-badge">CLOUDBERRY</span>
                        </div>
                        <button class="modal-close-btn" id="btnCloseNewsDetailModal" aria-label="기사 닫기">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="news-detail-source" id="newsDetailSource"></div>
                        <h2 class="news-detail-title" id="newsDetailTitle">뉴스 제목</h2>
                        <div class="news-detail-time" id="newsDetailTime"></div>
                        <article class="news-detail-content" id="newsDetailContent"></article>

                        <button class="demo-btn accent-btn full-btn" id="btnNewsTradeStock">
                            📈 이 종목 바로 매매하기
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('newsDetailModal');
        this.btnClose = document.getElementById('btnCloseNewsDetailModal');
        this.newsType = document.getElementById('newsDetailType');
        this.stockBadge = document.getElementById('newsDetailStockBadge');
        this.newsTime = document.getElementById('newsDetailTime');
        this.newsTitle = document.getElementById('newsDetailTitle');
        this.newsContent = document.getElementById('newsDetailContent');
        this.newsSource = document.getElementById('newsDetailSource');
        this.btnTrade = document.getElementById('btnNewsTradeStock');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        this.btnTrade?.addEventListener('click', () => {
            if (this.currentNews && this.callbacks.onOpenTradeModal) {
                this.close();
                this.callbacks.onOpenTradeModal(this.currentNews.stockId);
            }
        });
    }

    open(newsId) {
        if (!this.callbacks.getNewsItem) return;
        const news = this.callbacks.getNewsItem(newsId);
        if (!news) return;

        this.currentNews = news;
        const isRumor = news.type === '찌라시';

        if (this.newsType) {
            this.newsType.textContent = news.type;
            this.newsType.className = `news-type-tag ${isRumor ? 'type-rumor' : news.type === '공시' ? 'type-disclosure' : 'type-news'}`;
        }
        if (this.stockBadge) this.stockBadge.textContent = news.stockId;
        if (this.newsTime) this.newsTime.textContent = news.time;
        if (this.newsTitle) this.newsTitle.textContent = news.title;
        if (this.newsSource) this.newsSource.textContent = news.source || (isRumor ? '익명 제보' : '증시 뉴스');
        if (this.newsContent) {
            const paragraphs = Array.isArray(news.body) && news.body.length
                ? news.body : String(news.body || news.content || '').split(/\n\s*\n/);
            this.newsContent.replaceChildren(...paragraphs.map(text => {
                const paragraph = document.createElement('p');
                paragraph.textContent = text;
                return paragraph;
            }));
        }

        this.modal?.classList.remove('hidden');
        this.modal?.querySelector('.modal-body')?.scrollTo(0, 0);
    }

    close() {
        this.modal?.classList.add('hidden');
    }
}
