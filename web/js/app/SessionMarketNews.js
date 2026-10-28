import { CURRENT_NEWS } from '../data/newsCatalog.js';
import { RotatingMarketNews, applyMarketNews } from '../engine/RotatingMarketNews.js';

const feed = new RotatingMarketNews(CURRENT_NEWS, {
    startedAt: globalThis.performance?.timeOrigin || Date.now()
});
const applied = new WeakMap();

export function attachSessionMarketNews(engine) {
    const refresh = () => {
        const articles = feed.read();
        if (applied.get(engine) !== feed.batch) {
            applied.set(engine, feed.batch);
            applyMarketNews(engine, articles);
        }
        engine.news = articles;
    };
    engine.updateSessionNews = refresh;
    refresh();
    return { refresh };
}
