import { firstTradeChoices } from '../../engine/FirstTradeBudget.js';
import { INITIAL_STOCKS } from '../../data/stocksData.js';
import { scheduledNewsRuntime } from '../ScheduledNewsRuntime.js';
import { createChartHistory } from '../../engine/ChartTimeframes.js';
import { assets } from './State.js';
import { calculateGrowthIndex } from '../../engine/GrowthIndex.js';
import { exhibitionTasks } from '../../components/phone/tasks/StoryTasks.js';
import { exhibitionProfile } from '../../components/phone/profile/ProfileData.js';
import { storyAchievements } from '../../components/phone/achievements/AchievementData.js';

// The exhibition retains its separate, one-share guided trade and saved balances.
export function exhibitionStockSource(getState, { canTrade = () => false, onTrade, mapPosition } = {}) {
    const history = new Map();
    let lessonReady = false;
    const newsFeed = scheduledNewsRuntime('exhibition');
    return {
        subscribe: listener => newsFeed.subscribe(listener),
        achievements: () => storyAchievements(getState()),
        mapPosition,
        profile: () => exhibitionProfile(getState()),
        taskDomain: 'exhibition',
        tasks: () => exhibitionTasks(getState()),
        getState: () => {
            const s = getState();
            const portfolio = s.shares.map(p => ({ ...p, qty: p.quantity, stock: INITIAL_STOCKS.find(stock => stock.id === p.id),
                avgPrice: p.price, currentVal: p.price * p.quantity, profitLoss: 0, profitLossPct: 0, leverage: 1 }));
            const sum = INITIAL_STOCKS.reduce((a, stock) => [a[0] + stock.price, a[1] + stock.prevPrice], [0, 0]);
            const ratio = sum[1] ? sum[0] / sum[1] - 1 : 0;
            return { stocks: INITIAL_STOCKS, cash: s.cash, totalNetWorth: assets(s), portfolioValue: assets(s) - s.cash,
                totalProfitLoss: 0, portfolio, portfolioSlots: null, news: newsFeed.news(),
                firstTrade: canTrade() && !s.flags.trade ? firstTradeChoices(INITIAL_STOCKS, s.cash) : null,
                tradeHistory: s.trades.map(t => ({ ...t, stockName: t.name, stockId: t.id, cashDelta: -t.price * t.quantity, time: t.time || 0, fee: 0, venue: 'phone' })),
                cipherIndex: { val: (2485.12 * (1 + ratio)).toFixed(2), diffPct: ratio * 100 },
                sproutIndex: calculateGrowthIndex(INITIAL_STOCKS) };
        },
        history: id => {
            if (!history.has(id)) history.set(id, createChartHistory(INITIAL_STOCKS.find(s => s.id === id)));
            return history.get(id);
        },
        book: () => null, pending: () => [], unlocked: () => false, held: id => getState().shares.filter(s => s.id === id).reduce((sum, s) => sum + s.quantity, 0),
        setLessonReady: ready => { lessonReady = !!ready; },
        get lessonReady() { return lessonReady; },
        get lessonActive() { return canTrade() && !getState().flags.trade; },
        get readOnly() { return canTrade() && !getState().flags.trade ? null : '전시 체험의 주문은 토리의 첫 매수 안내에서 진행해요. 여기서는 종목과 계좌를 살펴볼 수 있어요.'; },
        orderPolicy: { quantity: 1, marketOnly: true },
        policyNote: '전시 첫 거래 · 현물 1주 · 수수료 없음',
        max: () => 1, cancel: () => {},
        orderError: id => {
            const s = getState();
            if (!lessonReady) return '토리와 기업 정보·차트·주문 안내를 먼저 확인해 주세요.';
            const choices = firstTradeChoices(INITIAL_STOCKS, s.cash).choices;
            return choices.some(stock => stock.id === id) ? null : '토리가 안내한 첫 매수 종목을 선택해 주세요.';
        },
        preview: (side, id, qty) => {
            const stock = INITIAL_STOCKS.find(s => s.id === id);
            return { total: stock.price * qty, fee: 0, feeRate: 0, quantity: qty, remaining: 0 };
        },
        execute: (side, id, qty, leverage, price) => {
            const s = getState();
            const stock = firstTradeChoices(INITIAL_STOCKS, s.cash).choices.find(stock => stock.id === id);
            if (!lessonReady || !canTrade() || s.flags.trade || !s.flags.certificate || side !== 'buy' || qty !== 1 || leverage !== 1 || price != null || !stock) {
                return { success: false, msg: '토리 안내에서 현물 1주를 선택해 주세요.' };
            }
            const saved = onTrade?.({ id, name: stock.name, price: stock.price });
            return { success: !!saved, msg: saved ? '현물 1주를 매수했어요.' : '거래를 저장하지 못했어요.' };
        },
        news: () => newsFeed.news()
    };
}
