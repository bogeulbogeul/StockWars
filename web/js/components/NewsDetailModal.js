/**
 * NewsDetailModal Component
 * Unity equivalent: UINewsDetailModal.cs
 * Full-screen reader for Signal News and Rumors with Impact Analysis and Instant Trade action.
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
                <div class="modal-card news-detail-card">
                    <div class="modal-header">
                        <div class="news-detail-badge-area">
                            <span id="newsDetailType" class="news-type-tag type-news">공시</span>
                            <span id="newsDetailStockBadge" class="stock-sector-badge">CLOUDBERRY</span>
                        </div>
                        <button class="modal-close-btn" id="btnCloseNewsDetailModal">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="news-detail-time" id="newsDetailTime">10분 전</div>
                        <div class="news-detail-title" id="newsDetailTitle">뉴스 제목</div>
                        <div class="news-detail-content" id="newsDetailContent">
                            뉴스 상세 내용
                        </div>

                        <!-- Analysis Box -->
                        <div class="market-analysis-box">
                            <div class="analysis-title">🔍 시장 영향 및 분석 리포트</div>
                            <div class="analysis-row">
                                <span>예상 주가 파급력:</span>
                                <span id="newsDetailImpact" class="impact-tag gainer">+5.2%</span>
                            </div>
                            <div class="analysis-row">
                                <span>정보 신뢰도 (Credibility):</span>
                                <span id="newsDetailCredibility" class="credibility-val">High (공시 확인 완료)</span>
                            </div>
                            <div class="analysis-comment-box" id="newsDetailComment">
                                분석가 코멘트
                            </div>
                        </div>

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
        this.newsImpact = document.getElementById('newsDetailImpact');
        this.newsCredibility = document.getElementById('newsDetailCredibility');
        this.newsComment = document.getElementById('newsDetailComment');
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
            this.newsType.className = `news-type-tag ${isRumor ? 'type-rumor' : 'type-news'}`;
        }
        if (this.stockBadge) this.stockBadge.textContent = news.stockId;
        if (this.newsTime) this.newsTime.textContent = news.time;
        if (this.newsTitle) this.newsTitle.textContent = news.title;
        if (this.newsContent) this.newsContent.textContent = news.content;

        if (this.newsImpact) {
            this.newsImpact.textContent = news.impact;
            this.newsImpact.className = `impact-tag ${news.isPositive ? 'gainer' : 'loser'}`;
        }
        if (this.newsCredibility) {
            this.newsCredibility.textContent = news.credibility || (isRumor ? 'Unverified (교증 절차 진행 중)' : 'High (공식 확인)');
        }
        if (this.newsComment) {
            this.newsComment.textContent = news.analystComment || '분석가 코멘트: 단기 변동성 확대가 예상되므로 추세를 주시하십시오.';
        }

        this.modal?.classList.remove('hidden');
    }

    close() {
        this.modal?.classList.add('hidden');
    }
}
