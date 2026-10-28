import { NewsApp } from '../news/NewsApp.js';

export function renderStockNews(host, source, { stockId, articleId, onStock } = {}) {
    const app = new NewsApp(host, source, { stockId, onStock });
    if (articleId) app.openArticle(articleId);
    return () => app.destroy();
}
