import { NewsApp } from '../news/NewsApp.js';

export function renderStockNews(host, source, { stockId, onStock } = {}) {
    const app = new NewsApp(host, source, { stockId, onStock });
    return () => app.destroy();
}
