import { createOrderBook, updateGhostLiquidity, matchOrder, planSale } from './OrderMatching.js';
import { createChartHistory } from './ChartTimeframes.js';
/**
 * StockWars Market Engine & Simulation State
 * Unity equivalent: MarketManager.cs / TradeKernel.cs
 * Features: Real-time price fluctuations, Order Book generation,
 * Portfolio math, Long/Short positions, Leverage (1x/2x/3x/5x),
 * Global Cipher Index, 7-Day Settlement math.
 */

import { INITIAL_STOCKS, INITIAL_NEWS } from '../data/stocksData.js?v=v72';

const ACHIEVEMENT_SHARE_RETURN_RATE = 30;

export class MarketEngine {
    constructor() {
        this.stocks = new Map();
        this.news = [...INITIAL_NEWS];
        this.initialCash = 5000;
        this.cash = 5000; // Starting cash 5,000 Gold
        this.targetRent = 5000; // 7-day settlement target rent
        this.day = 1;
        this.maxDays = 7;
        
        // Portfolio: stockId -> { id, stock, qty, avgPrice, leverage, isShort, collateral, currentVal, profitLoss, profitLossPct }
        this.portfolio = new Map();
        this.limitOrders = [];
        this.tradeHistory = [];
        this.chartHistory = new Map();
        this.orderBooks = new Map();
        this.bookRevision = 0;
        this.priceHistory = new Map(); // stockId -> array of numbers
        this.listeners = new Set();
        this.tickTimer = null;
        this.isLevel10Unlocked = false;
        this.tutorialStockId = null;
        this.isTutorialActive = false;
        this.firstTradeLesson = null;

        this.init();
    }

    init() {
        this.stocks.clear();
        this.priceHistory.clear();
        this.orderBooks.clear();
        this.chartHistory.clear();
        INITIAL_STOCKS.forEach(stock => {
            const stockCopy = { ...stock, history: [stock.prevPrice, stock.price] };
            this.stocks.set(stock.id, stockCopy);
            this.priceHistory.set(stock.id, this.generateInitialHistory(stock.price));
        });

        this.startEngine();
    }

    generateInitialHistory(basePrice) {
        const history = [];
        let curr = basePrice * (0.88 + Math.random() * 0.1);
        for (let i = 0; i < 24; i++) {
            const changePct = (Math.random() - 0.49) * 0.035;
            curr = Math.max(10, Math.round(curr * (1 + changePct)));
            history.push(curr);
        }
        history.push(basePrice);
        return history;
    }

    startEngine() {
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.tickTimer = setInterval(() => {
            this.tick();
        }, 2200);
    }

    stopEngine() {
        if (this.tickTimer) clearInterval(this.tickTimer);
    }

    tick() {
        this.bookRevision++;
        this.stocks.forEach(stock => {
            const book = this.ensureOrderBook(stock.id);
            let volatility = 0.02;
            if (stock.tier === 'S') volatility = 0.06;
            else if (stock.tier === 'A') volatility = 0.04;
            else if (stock.tier === 'B') volatility = 0.025;

            // Market prices never depend on tutorial progress or recommendation.
            const changePct = (Math.random() - 0.49) * volatility;
            const newPrice = Math.max(10, Math.round(stock.price * (1 + changePct)));

            if (newPrice !== stock.price) {
                stock.prevPrice = stock.price;
                stock.price = newPrice;
                const hist = this.priceHistory.get(stock.id);
                if (hist) {
                    hist.push(newPrice);
                    if (hist.length > 50) hist.shift();
                }
            }
            updateGhostLiquidity(book, stock, changePct / volatility * 2, this.bookRevision);
        });

        // Prices, ghost liquidity and pending fills become visible together.
        this.notify();
    }

    /**
     * Dynamically determines the most appropriate onboarding tutorial stock based on
     * user profile traits, sector affinity, and Day 1 momentum.
     * Recommendation follows current prices; never changes the market.
     */
    getRecommendedTutorialStock(userProfile = {}, budget = 5000) {
        this.tutorialProfile = userProfile;
        this.isTutorialActive = true;
        return this.chooseTutorialStock(budget);
    }

    chooseTutorialStock(budget) {
        const preferred = { analysis: 'SYNAPSENET', negotiation: 'COZYPAY', management: 'STUDIOLUNA', recovery: 'FORESTLAB' }[this.tutorialProfile?.trait?.key] || 'CLOUDBERRY';
        const affordable = Array.from(this.stocks.values()).filter(s => s.price > 0 && this.getOrderQuote(s.price, 1).total <= budget);
        const withRoom = affordable.filter(s => s.price <= budget * 0.8);
        const candidates = withRoom.length ? withRoom : affordable;
        candidates.sort((a, b) => (b.id === preferred) - (a.id === preferred)
            || ((b.price - b.prevPrice) / (b.prevPrice || b.price)) - ((a.price - a.prevPrice) / (a.prevPrice || a.price))
            || a.price - b.price);
        const stock = candidates[0] || null;
        this.tutorialStockId = stock?.id || null;
        return { stock, reason: '현재 시세와 투자 성향을 고려하고 보유 현금으로 1주를 구매할 수 있는 종목' };
    }

    refreshTutorialRecommendation() {
        if (!this.isTutorialActive || this.firstTradeLesson) return null;
        const current = this.stocks.get(this.tutorialStockId);
        if (current && current.price > 0 && this.getOrderQuote(current.price, 1).total <= this.cash) return null;
        const oldId = this.tutorialStockId;
        const recommendation = this.chooseTutorialStock(this.cash);
        return oldId !== this.tutorialStockId ? recommendation : null;
    }

    tutorialOrderError(stockId, isShort = false) {
        if (!this.isTutorialActive) return null;
        if (!this.tutorialStockId) return '현재 현금으로 구매 가능한 추천 종목을 찾고 있어요. 시세를 다시 확인할 때까지 기다려 주세요.';
        if (stockId !== this.tutorialStockId) return '튜토리얼 중에는 안나가 추천한 종목만 매수할 수 있어요. 목록의 [안나 추천] 종목을 선택해 주세요.';
        if (isShort && !this.firstTradeLesson) return '첫 거래는 안나가 추천한 종목의 매수로 진행해 주세요.';
        return null;
    }

    setTutorialActive(isActive) {
        this.isTutorialActive = isActive;
        if (!isActive) this.tutorialStockId = null;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    placeLimitOrder(side, stockId, qty, leverage, price, venue = 'phone') {
        const stock = this.stocks.get(stockId);
        if (!stock || !['buy','sell','short'].includes(side) || !Number.isSafeInteger(qty) || qty < 1 || !Number.isInteger(price) || price < 1 || ![1,2,3,5].includes(leverage))
            return { success: false, msg: '수량과 지정가는 1 이상의 정수로 입력해 주세요.' };
        const error = this.validateOrder(side, stockId, qty, leverage);
        if (error) return { success: false, msg: error };
        if (side === 'sell' && this.heldQuantity(stockId) < qty) return { success: false, msg: '매도할 보유 수량이 부족합니다.' };
        if (side !== 'sell' && this.getOrderQuote(price, qty, leverage, venue).total > this.cash) return { success: false, msg: '지정가 주문에 필요한 현금이 부족합니다.' };
        if (this.limitOrders.length >= 50) return { success: false, msg: '대기 주문은 최대 50개까지 등록할 수 있습니다.' };
        const result = this.executeOrder(side, stockId, qty, leverage, venue, { limitPrice: price, deferNotify: true });
        const remaining = qty - (result.quantity || 0);
        if (remaining) this.limitOrders.push({ id: crypto.randomUUID(), side, stockId, qty: remaining, leverage, price, venue });
        // Avoid immediately processing this new remainder a second time.
        this.notify(false);
        return { ...result, success: true, queued: remaining > 0, remaining,
            msg: remaining ? `${result.quantity || 0}주 체결 · ${remaining}주 지정가 대기` : result.msg };
    }
    cancelLimitOrder(id) {
        this.limitOrders = this.limitOrders.filter(order => order.id !== id);
        this.notify();
    }
    processLimitOrders() {
        if (this.processingLimits || !this.limitOrders?.length) return;
        this.processingLimits = true;
        try {
            for (const order of [...this.limitOrders]) {
                const preview = this.getExecutionPreview(order.side, order.stockId, order.qty, order.leverage, order.venue, order.price);
                const resourcesMissing = order.side === 'sell' ? this.heldQuantity(order.stockId) < order.qty : preview.reason === 'cash';
                if (!preview.quantity && !resourcesMissing) continue;
                const result = this.executeOrder(order.side, order.stockId, order.qty, order.leverage, order.venue,
                    { limitPrice: order.price, deferNotify: true });
                order.qty -= result.quantity || 0;
                const cancelRest = resourcesMissing || (result.reason && !['liquidity','price'].includes(result.reason));
                if (!order.qty || cancelRest) this.limitOrders = this.limitOrders.filter(p => p.id !== order.id);
                this.onLimitOrderResult?.(order, { ...result, queued: order.qty > 0 && !cancelRest,
                    msg: result.msg + (order.qty > 0 ? ` · 잔량 ${order.qty}주 ${cancelRest ? '취소' : '대기'}` : '') });
            }
        } finally { this.processingLimits = false; }
    }

    getChartHistory(id) {
        const stock = this.stocks.get(id);
        if (!stock) return [];
        if (!this.chartHistory.has(id)) this.chartHistory.set(id, createChartHistory(stock));
        const history = this.chartHistory.get(id), last = history.at(-1);
        if (last.price !== stock.price) history.push({ time: Date.now(), price: stock.price });
        return history;
    }

    notify(processOrders = true) {
        if (processOrders) this.processLimitOrders();
        for (const id of this.chartHistory.keys()) this.getChartHistory(id);
        const lesson = this.firstTradeLesson;
        if (lesson?.status === 'watching') {
            const stock = this.stocks.get(lesson.stockId);
            if (stock && stock.price >= Math.ceil(lesson.buyPrice * 1.10)) lesson.status = 'ready';
        }
        const state = this.getState();
        this.listeners.forEach(fn => fn(state));
    }

    toggleLevel20Unlock() {
        this.isLevel10Unlocked = !this.isLevel10Unlocked;
        this.notify();
        return this.isLevel10Unlocked;
    }

    getCipherIndex() {
        let sumPrice = 0;
        let sumPrev = 0;
        this.stocks.forEach(s => {
            sumPrice += s.price;
            sumPrev += s.prevPrice;
        });
        const baseIndex = 2485.12;
        const ratio = sumPrev > 0 ? (sumPrice - sumPrev) / sumPrev : 0;
        const currentVal = (baseIndex * (1 + ratio)).toFixed(2);
        const diffPct = ratio * 100;
        return {
            val: currentVal,
            diffPct: diffPct,
            unit: 'pts'
        };
    }

    getState() {
        const stockList = Array.from(this.stocks.values());
        const portfolioList = this.getPortfolioList();
        const portfolioValue = this.getPortfolioValue();
        const totalNetWorth = this.cash + portfolioValue;
        const totalProfitLoss = this.getPortfolioProfitLoss();

        return {
            day: this.day,
            maxDays: this.maxDays,
            cash: this.cash,
            initialCash: this.initialCash,
            targetRent: this.targetRent,
            rentSettlement: this.rentSettlement || null,
            stocks: stockList,
            news: this.news,
            portfolio: portfolioList,
            tradeHistory: this.tradeHistory,
            portfolioValue: portfolioValue,
            totalNetWorth: totalNetWorth,
            totalProfitLoss: totalProfitLoss,
            cipherIndex: this.getCipherIndex(),
            tutorialStockId: this.isTutorialActive ? this.tutorialStockId : null,
            isLevel10Unlocked: this.isLevel10Unlocked
        };
    }

    getPortfolioList() {
        const list = [];
        this.portfolio.forEach((pos) => {
            const stock = this.stocks.get(pos.id);
            if (!stock) return;

            let currentVal = 0;
            let profitLoss = 0;
            let profitLossPct = 0;

            if (pos.isShort) {
                // Short Position: Profit when price drops
                const priceDiff = pos.avgPrice - stock.price;
                profitLoss = priceDiff * pos.qty * pos.leverage;
                currentVal = pos.collateral + profitLoss;
                profitLossPct = pos.collateral > 0 ? (profitLoss / pos.collateral) * 100 : 0;
            } else {
                // Long Position: Profit when price rises
                const totalCost = pos.avgPrice * pos.qty;
                const currentStockVal = stock.price * pos.qty;
                profitLoss = (currentStockVal - totalCost) * pos.leverage;
                currentVal = pos.collateral + profitLoss;
                profitLossPct = pos.collateral > 0 ? (profitLoss / pos.collateral) * 100 : 0;
            }

            list.push({
                id: pos.id,
                stock: stock,
                qty: pos.qty,
                avgPrice: pos.avgPrice,
                leverage: pos.leverage || 1,
                isShort: !!pos.isShort,
                collateral: pos.collateral,
                currentVal: Math.max(0, currentVal),
                profitLoss: profitLoss,
                profitLossPct: profitLossPct
            });
        });
        return list;
    }

    getPortfolioValue() {
        let sum = 0;
        this.getPortfolioList().forEach(item => {
            sum += item.currentVal;
        });
        return sum;
    }

    getPortfolioProfitLoss() {
        let sum = 0;
        this.getPortfolioList().forEach(item => {
            sum += item.profitLoss;
        });
        return sum;
    }

    getOrderQuote(price, quantity, leverage = 1, venue = 'phone') {
        const feeRate = venue === 'brokerage' ? 0.0001 : 0.0015;
        // Gold uses whole units: round the fee once per executed order, not per share.
        const fee = Math.round(price * quantity * feeRate);
        const margin = Math.round(price * quantity / leverage);
        return { feeRate, fee, margin, total: margin + fee, venue };
    }

    getMaxOrderQty(price, leverage = 1, venue = 'phone') {
        if (!(price > 0)) return 0;
        let low = 0, high = Math.floor(this.cash * leverage / price) + 1;
        while (low + 1 < high) {
            const mid = Math.floor((low + high) / 2);
            if (this.getOrderQuote(price, mid, leverage, venue).total <= this.cash) low = mid;
            else high = mid;
        }
        return low;
    }

    recordTrade(side, stock, quantity, cashDelta, leverage = null, profit = null, fee = 0, venue = 'phone', execution = null) {
        this.tradeHistory.push({ time: Date.now(), day: this.day, side,
            stockId: stock.id, stockName: stock.name, quantity, price: execution?.averagePrice ?? stock.price,
            requested: execution?.requested ?? quantity, fills: execution?.fills.map(({price, quantity}) => ({price, quantity})) || [],
            cashDelta, leverage, profit, fee, venue, feeRate: this.getOrderQuote(stock.price, quantity, leverage || 1, venue).feeRate });
    }

    heldQuantity(stockId) {
        return [...this.portfolio.values()].filter(p => p.id === stockId && !p.isShort).reduce((sum,p) => sum+p.qty, 0);
    }

    validateOrder(side, stockId, qty, leverage) {
        if (!['buy','sell','short'].includes(side) || !Number.isSafeInteger(qty) || qty < 1 || ![1,2,3,5].includes(leverage)) return '수량과 레버리지를 확인해 주세요.';
        if (!this.stocks.has(stockId)) return '존재하지 않는 종목입니다.';
        if (side !== 'sell') {
            this.refreshTutorialRecommendation();
            const error = this.tutorialOrderError(stockId, side === 'short');
            if (error) return error;
            if (this.itemEngine && qty > this.itemEngine.orderLimit()) return `1회 주문 한도는 ${this.itemEngine.orderLimit()}주입니다.`;
            if ((side === 'short' || leverage >= 2) && !this.isLevel10Unlocked) return '공매도·레버리지는 레벨 10 해금 후 이용 가능합니다!';
        }
        return null;
    }

    getExecutionPreview(side, stockId, qty, leverage = 1, venue = 'phone', limitPrice = null) {
        const stock = this.stocks.get(stockId);
        if (!stock || !Number.isSafeInteger(qty) || qty < 1) return { quantity: 0, requested: qty, remaining: qty, fills: [], total: 0, fee: 0, averagePrice: 0, reason: 'invalid' };
        const available = side === 'sell' ? Math.min(qty, this.heldQuantity(stockId)) : qty;
        const feeRate = this.getOrderQuote(stock.price, 1, leverage, venue).feeRate;
        const plan = matchOrder(this.ensureOrderBook(stockId), { side, quantity: available, referencePrice: stock.price,
            limitPrice, cash: this.cash, leverage, feeRate });
        plan.requested = qty; plan.remaining = qty - plan.quantity;
        if (side === 'sell') {
            const sale = planSale(this.portfolio, stockId, plan.fills);
            plan.proceeds = sale.proceeds - plan.fee; plan.profit = sale.profit - plan.fee;
            if (available < qty && !plan.reason) plan.reason = 'holdings';
        }
        return plan;
    }

    buyStock(stockId, qty, leverage = 1, venue = 'phone') {
        return this.executeOrder('buy', stockId, qty, leverage, venue);
    }
    shortStock(stockId, qty, leverage = 1, venue = 'phone') {
        return this.executeOrder('short', stockId, qty, leverage, venue);
    }
    sellStock(stockId, qty, venue = 'phone') {
        return this.executeOrder('sell', stockId, qty, 1, venue);
    }

    executeOrder(side, stockId, requested, leverage = 1, venue = 'phone', options = {}) {
        const error = this.validateOrder(side, stockId, requested, leverage);
        if (error) return { success: false, quantity: 0, reason: 'invalid', msg: error };
        const stock = this.stocks.get(stockId);
        const plan = this.getExecutionPreview(side, stockId, requested, leverage, venue, options.limitPrice ?? null);
        if (!plan.quantity) return { success: false, quantity: 0, reason: plan.reason,
            msg: '체결 가능한 물량·현금·보유 수량이 없습니다. 주문은 체결되지 않았습니다.' };
        const book = this.ensureOrderBook(stockId);
        let profit = null, proceeds = null, collateral = 0;
        if (side === 'sell') {
            const sale = planSale(this.portfolio, stockId, plan.fills);
            proceeds = sale.proceeds - plan.fee; profit = sale.profit - plan.fee; collateral = sale.collateral;
            if (this.cash + proceeds < 0) return { success: false, quantity: 0, reason: 'cash', msg: '매도 수수료를 납부할 현금이 부족합니다.' };
            for (const { key, ...position } of sale.positions) {
                if (position.qty > 0) this.portfolio.set(key, position);
                else this.portfolio.delete(key);
            }
            this.cash += proceeds;
            if (this.itemEngine) this.itemEngine.state.profit += profit;
            if (this.firstTradeLesson?.stockId === stockId && this.firstTradeLesson.status !== 'done') {
                this.firstTradeLesson.sale = { quantity: plan.quantity, sellPrice: plan.averagePrice, profit, proceeds };
                this.firstTradeLesson.status = 'sold';
            }
        } else {
            this.cash -= plan.total;
            const key = `${stockId}_${side === 'short' ? 'SHORT' : 'LONG'}_${leverage}`;
            const old = this.portfolio.get(key);
            const quantity = (old?.qty || 0) + plan.quantity;
            this.portfolio.set(key, { id: stockId, posKey: key, qty: quantity,
                avgPrice: ((old?.avgPrice || 0) * (old?.qty || 0) + plan.gross) / quantity,
                leverage, isShort: side === 'short', collateral: (old?.collateral || 0) + plan.margin,
                entryFees: (old?.entryFees || 0) + plan.fee });
            if (side === 'buy' && this.isTutorialActive && !this.firstTradeLesson) this.firstTradeLesson = { stockId, buyPrice: plan.averagePrice, status: 'watching' };
        }
        const levels = side === 'buy' ? book.asks : book.bids;
        for (const fill of plan.fills) levels[fill.index].vol -= fill.quantity;
        const lastPrice = plan.fills.at(-1).price;
        if (stock.price !== lastPrice) {
            stock.prevPrice = stock.price; stock.price = lastPrice;
            const history = this.priceHistory.get(stockId);
            if (history) { history.push(lastPrice); if (history.length > 50) history.shift(); }
        }
        book.referencePrice = stock.price; // Own fills must not regenerate consumed depth.
        this.recordTrade(side, stock, plan.quantity, side === 'sell' ? proceeds : -plan.total,
            side === 'sell' ? null : leverage, profit, plan.fee, venue, plan);
        const trade = { stockId, quantity: plan.quantity, sellPrice: plan.averagePrice, profit, proceeds };
        const returnRate = collateral > 0 ? profit / collateral * 100 : 0;
        const achievement = side === 'sell' && profit > 0 && returnRate >= ACHIEVEMENT_SHARE_RETURN_RATE
            ? { id: crypto.randomUUID(), stockId, stockName: stock.name,
                quantity: plan.quantity, profit, returnRate } : null;
        if (!options.deferNotify) this.notify();
        const label = side === 'sell' ? '매도' : side === 'short' ? '공매도' : '매수';
        return { success: true, quantity: plan.quantity, remaining: plan.remaining, reason: plan.reason, trade, achievement,
            msg: `[${label} ${plan.remaining ? '부분 체결' : '완료'}] ${plan.quantity}/${requested}주 · 평균 ${plan.averagePrice.toLocaleString(undefined,{maximumFractionDigits:2})}G · 수수료 ${plan.fee.toLocaleString()}G` +
                (plan.remaining && options.limitPrice == null ? ` · 미체결 ${plan.remaining}주 취소` : '') };
    }

    liquidateForEscape() {
        let recovered = 0, profit = 0;
        for (const pos of this.portfolio.values()) {
            const stock = this.stocks.get(pos.id);
            if (!stock) continue;
            const diff = (stock.price - pos.avgPrice) * pos.qty * pos.leverage * (pos.isShort ? -1 : 1);
            const gross = Math.max(0, pos.collateral + diff);
            const fee = Math.min(Math.round(gross), this.getOrderQuote(stock.price, pos.qty).fee);
            const payout = Math.max(0, gross - fee);
            this.recordTrade('liquidate', stock, pos.qty, Math.round(payout), pos.leverage, Math.round(payout - pos.collateral - (pos.entryFees || 0)), fee);
            recovered += payout;
            profit += payout - pos.collateral - (pos.entryFees || 0);
        }
        this.cash += Math.round(recovered);
        this.portfolio.clear();
        if (this.itemEngine) this.itemEngine.state.profit += Math.round(profit);
    }

    getSellPreview(stockId, qty, venue = 'phone', limitPrice = null) {
        const plan = this.getExecutionPreview('sell', stockId, qty, 1, venue, limitPrice);
        return { quantity: plan.quantity, proceeds: plan.proceeds || 0, profit: plan.profit || 0,
            fee: plan.fee, feeRate: plan.feeRate, averagePrice: plan.averagePrice, remaining: plan.remaining };
    }

    ensureOrderBook(stockId) {
        const stock = this.stocks.get(stockId);
        if (!stock) return { asks: [], bids: [] };
        let book = this.orderBooks.get(stockId);
        if (!book) {
            book = createOrderBook(stock, this.bookRevision);
            this.orderBooks.set(stockId, book);
        } else if (book.referencePrice !== stock.price) {
            // News and other external price changes share the same depth response.
            const pressure = (stock.price-book.referencePrice) / Math.max(1, book.referencePrice) / 0.03;
            updateGhostLiquidity(book, stock, pressure, this.bookRevision);
        }
        return book;
    }

    getOrderBook(stockId) {
        const book = this.ensureOrderBook(stockId);
        const largest = Math.max(200, ...book.asks.map(p=>p.vol), ...book.bids.map(p=>p.vol));
        const rows = levels => levels.filter(p => p.vol > 0).map(p => ({ ...p, pct: p.vol / largest * 100 }));
        return { asks: rows(book.asks).sort((a,b)=>b.price-a.price), bids: rows(book.bids).sort((a,b)=>b.price-a.price) };
    }

    settleRent() {
        if (this.rentSettlement) return this.rentSettlement;
        const state = this.getState();
        if (this.day < this.maxDays || this.cash < this.targetRent) return state;
        this.cash -= this.targetRent;
        this.rentSettlement = {
            day: state.day, maxDays: state.maxDays, targetRent: state.targetRent,
            cash: state.cash, portfolioValue: state.portfolioValue, totalNetWorth: state.totalNetWorth,
            rentPaid: true, cashAfterRent: this.cash
        };
        this.notify(false);
        return this.rentSettlement;
    }

    nextDay() {
        if (this.day >= this.maxDays) return;
        this.bookRevision++;
        this.day += 1;

        // Daily dividend & interest check
        this.portfolio.forEach(pos => {
            const stock = this.stocks.get(pos.id);
            if (stock && !pos.isShort && stock.dividend > 0) {
                const divEarnings = Math.round((stock.price * pos.qty * stock.dividend) / 7);
                this.cash += divEarnings;
            }
        });

        // Trigger major daily news & shift prices
        this.stocks.forEach(stock => {
            const book = this.ensureOrderBook(stock.id);
            const swing = (Math.random() - 0.48) * 0.08;
            stock.prevPrice = stock.price;
            stock.price = Math.max(10, Math.round(stock.price * (1 + swing)));
            updateGhostLiquidity(book, stock, swing / 0.04, this.bookRevision);
            const hist = this.priceHistory.get(stock.id);
            if (hist) {
                hist.push(stock.price);
                if (hist.length > 50) hist.shift();
            }
        });

        this.notify();
    }

    reset() {
        this.rentSettlement = null;
        this.tradeHistory = [];
        this.limitOrders = [];
        this.firstTradeLesson = null;
        this.isTutorialActive = false;
        this.cash = this.initialCash;
        this.day = 1;
        this.portfolio.clear();
        this.init();
        this.notify();
    }
}

export const marketEngine = new MarketEngine();

