import { StockApp } from './StockApp.js';
import { renderStockNews } from './StockNews.js';
import { mountSettingsApp } from '../settings/SettingsApp.js';
import { mountMessengerApp } from '../messenger/MessengerApp.js';
import { mountTasksApp } from '../tasks/TasksApp.js';
import { mountProfileApp } from '../profile/ProfileApp.js';
import { mountMapApp } from '../map/MapApp.js';
import { mountAchievementsApp } from '../achievements/AchievementsApp.js';

export function mountStockPhoneApp(phone, source, id, content) {
    if (id === 'achievements') return mountAchievementsApp(phone, content, source);
    if (id === 'map') return mountMapApp(phone, content, source);
    if (id === 'profile') return mountProfileApp(phone, content, source);
    if (id === 'tasks') return mountTasksApp(phone, content, source);
    if (id === 'messenger') return mountMessengerApp(phone, content, source);
    if (id === 'settings') return mountSettingsApp(phone, content);
    if (id === 'stock') {
        phone.detail.classList.add('cozy-phone__detail--stock');
        const app = new StockApp(content, source, { onClose: () => phone.close(), openNews: (stockId, articleId) => {
            phone.newsReturnStock = { id: stockId, tab: app.subtab || 'info' };
            phone.newsOpenArticle = articleId;
            phone.newsStockFilter = stockId; phone.openApp('news');
        } });
        phone.stockApp = app;
        return () => {
            app.destroy(); phone.stockApp = null;
            phone.detail.classList.remove('cozy-phone__detail--stock');
        };
    }
    if (id === 'news') {
        phone.detail.classList.add('cozy-phone__detail--news');
        const returnStock = phone.newsReturnStock; phone.newsReturnStock = null;
        const back = phone.dialog.querySelector('.cozy-phone__back');
        const previousBack = back.onclick, previousLabel = back.textContent;
        if (returnStock) {
            phone.detail.classList.add('stock-news-from-trade');
            back.textContent = '‹ 뒤로가기';
            back.onclick = () => {
                phone.openApp('stock');
                phone.stockApp?.openStock(returnStock.id);
                phone.stockApp?.renderDetail(returnStock.tab);
            };
        }
        const filter = phone.newsStockFilter; phone.newsStockFilter = null;
        const articleId = phone.newsOpenArticle; phone.newsOpenArticle = null;
        const cleanup = renderStockNews(content, source, { stockId: filter, articleId, onStock: stockId => {
            phone.openApp('stock'); phone.stockApp?.openStock(stockId);
        } });
        return () => {
            cleanup(); phone.detail.classList.remove('cozy-phone__detail--news', 'stock-news-from-trade');
            if (returnStock) { back.onclick = previousBack; back.textContent = previousLabel; }
        };
    }
    return false;
}
