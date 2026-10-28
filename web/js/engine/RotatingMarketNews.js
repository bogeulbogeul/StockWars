export const MARKET_NEWS_INTERVAL = 180_000;

// One current article per company; replaced articles expire rather than accumulate.
export class RotatingMarketNews {
    constructor(catalog, { startedAt = Date.now(), random = Math.random } = {}) {
        this.startedAt = startedAt; this.random = random; this.batch = -1; this.articles = [];
        this.groups = new Map();
        for (const a of catalog) {
            if (!a.stockId || a.type === '찌라시') continue;
            if (!this.groups.has(a.stockId)) this.groups.set(a.stockId, []);
            this.groups.get(a.stockId).push(a);
        }
    }
    sync(now = Date.now()) {
        const batch = Math.max(0, Math.floor((now - this.startedAt) / MARKET_NEWS_INTERVAL));
        if (batch <= this.batch) return false;
        const previous = new Map(this.articles.map(a => [a.stockId, a.articleId]));
        const publishedAt = this.startedAt + batch * MARKET_NEWS_INTERVAL;
        this.articles = [...this.groups].map(([id, group]) => {
            const candidates = group.filter(a => a.id !== previous.get(id));
            const pool = candidates.length ? candidates : group;
            const a = pool[Math.min(pool.length - 1, Math.floor(this.random() * pool.length))];
            const positive = a.category?.endsWith('호재') ?? a.isPositive;
            const magnitude = (a.category?.startsWith('핵심') ? .045 : .015) + this.random() * .025;
            return { ...a, body: [...(a.body || [])], articleId: a.id, id: `${a.id}@session-${batch}`,
                publishedAt, expiresAt: publishedAt + MARKET_NEWS_INTERVAL,
                time: new Date(publishedAt).toLocaleString('ko-KR'), impactRate: (positive ? 1 : -1) * magnitude };
        });
        this.batch = batch; return true;
    }
    read(now = Date.now()) { this.sync(now); return this.articles; }
}

export function applyMarketNews(engine, articles) {
    engine.bookRevision++;
    for (const article of articles) {
        const stock = engine.stocks.get(article.stockId); if (!stock) continue;
        stock.prevPrice = stock.price;
        stock.price = Math.max(10, Math.round(stock.price * (1 + article.impactRate)));
        const history = engine.priceHistory.get(stock.id);
        history?.push(stock.price); if (history?.length > 50) history.shift();
        engine.orderBooks.delete(stock.id);
    }
}
