import { StockApp } from './StockApp.js';
import { renderStockNews } from './StockNews.js';

export function mountStockPhoneApp(phone, source, id, content) {
    if (id === 'stock') {
        phone.detail.classList.add('cozy-phone__detail--stock');
        const app = new StockApp(content, source, { openNews: stockId => {
            phone.newsStockFilter = stockId; phone.openApp('news');
        } });
        phone.stockApp = app;
        return () => {
            app.destroy(); phone.stockApp = null;
            phone.detail.classList.remove('cozy-phone__detail--stock');
        };
    }
    if (id === 'news') {
        const filter = phone.newsStockFilter; phone.newsStockFilter = null;
        return renderStockNews(content, source, { stockId: filter, onStock: stockId => {
            phone.openApp('stock'); phone.stockApp?.openStock(stockId);
        } });
    }
    return false;
}
