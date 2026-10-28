import { marketEngine as engine } from '../engine/marketEngine.js';
import { calculateGrowthIndex } from '../engine/GrowthIndex.js';
import { normalProfile } from '../components/phone/profile/ProfileData.js';
import { normalMapPosition } from '../components/phone/map/MapData.js';
import { playerAchievements } from '../components/phone/achievements/AchievementData.js';
import { attachSessionMarketNews } from './SessionMarketNews.js';

export function phoneStockSource(app, engineOverride = engine) {
    const engine = engineOverride;
    const newsFeed = attachSessionMarketNews(engine);
    return {
        achievements: () => playerAchievements(app),
        mapPosition: () => normalMapPosition(app),
        profile: () => normalProfile(app),
        profileIdentity: async () => {
            if (app.isLocalSession || !globalThis.stockWarsPresence?.state) return null;
            const result = await globalThis.stockWarsPresence.state();
            return result?.error ? null : result?.snapshot?.playerId ?? null;
        },
        messengerOnline: () => !app.isLocalSession && !!globalThis.stockWarsChat,
        recent: [...(app.smartphoneUI.homeTab?.recentlyViewedIds || [])],
        onFavorites: favorites => { app.smartphoneUI.stockListTab.favorites = new Set(favorites); },
        getState: () => {
            newsFeed.refresh();
            const state = engine.getState();
            return { ...state, sproutIndex: calculateGrowthIndex(state.stocks) };
        },
        subscribe: listener => {
            const marketOff = engine.subscribe(listener);
            return marketOff;
        },
        history: id => engine.getChartHistory(id), book: id => engine.getOrderBook(id),
        pending: id => engine.limitOrders.filter(order => order.stockId === id),
        cancel: id => engine.cancelLimitOrder(id),
        unlocked: () => engine.isLevel10Unlocked,
        cap: () => app.itemEngine?.orderLimit() || Infinity,
        max: (id, leverage, price, short) => {
            const stock = engine.stocks.get(id);
            return Math.max(0, Math.min(app.itemEngine?.orderLimit() || Infinity,
                price ? engine.getMaxOrderQty(price, leverage, 'phone')
                    : engine.getExecutionPreview(short ? 'short' : 'buy', id, Number.MAX_SAFE_INTEGER, leverage, 'phone').quantity));
        },
        held: id => engine.heldQuantity(id),
        preview: (side, id, qty, lev, price) => price == null
            ? engine.getExecutionPreview(side, id, qty, lev, 'phone') : engine.getOrderQuote(price, qty, lev, 'phone'),
        sellPreview: (id, qty, price) => engine.getSellPreview(id, qty, 'phone', price),
        orderError: (id, short) => engine.tutorialOrderError(id, short),
        execute: (side, id, qty, lev, price) => {
            if (side === 'sell') lev = 1;
            app.annaTutorial?.reviewRecommendation();
            const result = price == null
                ? side === 'sell' ? engine.sellStock(id, qty) : side === 'short' ? engine.shortStock(id, qty, lev) : engine.buyStock(id, qty, lev)
                : engine.placeLimitOrder(side, id, qty, lev, price);
            app.annaTutorial?.syncRecommendation();
            if (result.success && side === 'buy' && result.quantity > 0) app.annaTutorial?.notifyStockPurchased(id);
            return result;
        },
        news: () => engine.news.filter(n => n.type !== '찌라시'),
        onStock: id => {
            app.smartphoneUI.recordRecentlyViewed(id);
            app.annaTutorial?.notifyTradeModalOpened(id);
        }
    };
}
