import { createChartHistory } from './ChartTimeframes.js';
/**
 * StockWars Market Engine & Simulation State
 * Unity equivalent: MarketManager.cs / TradeKernel.cs
 * Features: Real-time price fluctuations, Order Book generation,
 * Portfolio math, Long/Short positions, Leverage (1x/2x/3x/5x),
 * Global Cipher Index, 7-Day Settlement math.
 */

import { INITIAL_STOCKS, INITIAL_NEWS } from '../data/stocksData.js?v=v72';

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
        this.chartHistory = new Map();
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
        let anyPriceChanged = false;
        this.stocks.forEach(stock => {
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
                anyPriceChanged = true;
            }
        });

        if (anyPriceChanged) {
            this.notify();
        }
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
        const affordable = Array.from(this.stocks.values()).filter(s => s.price > 0 && s.price <= budget);
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
        if (current && current.price > 0 && current.price <= this.cash) return null;
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

    placeLimitOrder(side, stockId, qty, leverage, price) {
        const stock = this.stocks.get(stockId);
        if (!stock || !['buy','sell','short'].includes(side) || !Number.isInteger(qty) || qty < 1 || !Number.isInteger(price) || price < 1 || ![1,2,3,5].includes(leverage))
            return { success: false, msg: '수량과 지정가는 1 이상의 정수로 입력해 주세요.' };
        const tutorialError = this.tutorialOrderError(stockId, side === 'short');
        if (side !== 'sell' && tutorialError) return { success: false, msg: tutorialError };
        if ((leverage >= 2 || side === 'short') && !this.isLevel10Unlocked) return { success: false, msg: '레벨 10 해금 후 이용 가능합니다.' };
        if (side !== 'sell' && this.itemEngine && qty > this.itemEngine.orderLimit()) return { success: false, msg: '1회 매수 한도를 초과했습니다.' };
        if (side === 'sell' && this.getSellPreview(stockId, qty).quantity < qty) return { success: false, msg: '매도할 보유 수량이 부족합니다.' };
        if (side !== 'sell' && Math.round(price * qty / leverage) > this.cash) return { success: false, msg: '지정가 주문에 필요한 현금이 부족합니다.' };
        const execute = () => side === 'buy' ? this.buyStock(stockId, qty, leverage) : side === 'short' ? this.shortStock(stockId, qty, leverage) : this.sellStock(stockId, qty);
        if (side === 'buy' ? stock.price <= price : stock.price >= price) return execute();
        if (this.limitOrders.length >= 50) return { success: false, msg: '대기 주문은 최대 50개까지 등록할 수 있습니다.' };
        this.limitOrders.push({ id: crypto.randomUUID(), side, stockId, qty, leverage, price });
        this.notify();
        return { success: true, queued: true, msg: '지정가 주문을 등록했습니다. 가격 조건에 도달하면 체결합니다.' };
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
                const stock = this.stocks.get(order.stockId);
                if (!stock || !(order.side === 'buy' ? stock.price <= order.price : stock.price >= order.price)) continue;
                this.limitOrders = this.limitOrders.filter(p => p.id !== order.id);
                const result = order.side === 'sell' && this.getSellPreview(order.stockId, order.qty).quantity < order.qty
                    ? { success: false, msg: '매도할 보유 수량이 부족합니다.' }
                    : order.side === 'buy' ? this.buyStock(order.stockId, order.qty, order.leverage)
                    : order.side === 'short' ? this.shortStock(order.stockId, order.qty, order.leverage) : this.sellStock(order.stockId, order.qty);
                this.onLimitOrderResult?.(order, result);
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

    notify() {
        this.processLimitOrders();
        for (const id of this.chartHistory.keys()) this.getChartHistory(id);
        const lesson = this.firstTradeLesson;
        if (lesson?.status === 'watching') {
            const stock = this.stocks.get(lesson.stockId);
            if (stock && stock.price >= Math.ceil(lesson.buyPrice * 1.05)) lesson.status = 'ready';
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
            stocks: stockList,
            news: this.news,
            portfolio: portfolioList,
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

    buyStock(stockId, qty, leverage = 1) {
        this.refreshTutorialRecommendation();
        const tutorialError = this.tutorialOrderError(stockId);
        if (tutorialError) return { success: false, msg: tutorialError };
        qty = Math.max(1, parseInt(qty) || 1);
        if (this.itemEngine && qty > this.itemEngine.orderLimit()) return { success: false, msg: `1회 매수 한도는 ${this.itemEngine.orderLimit()}주입니다. 안정제로 한도를 늘릴 수 있습니다.` };
        leverage = Math.max(1, parseInt(leverage) || 1);
        if(leverage>=2&&!this.isLevel10Unlocked)return {success:false,msg:'레버리지는 레벨 10 해금 후 이용 가능합니다!'};
        const stock = this.stocks.get(stockId);
        if (!stock) return { success: false, msg: '존재하지 않는 종목입니다.' };

        const requiredCash = Math.round((stock.price * qty) / leverage);
        if (this.cash < requiredCash) {
            return {
                success: false,
                msg: `보유 현금이 부족합니다! (필요: ${requiredCash.toLocaleString()}G, 보유: ${this.cash.toLocaleString()}G)`
            };
        }

        this.cash -= requiredCash;
        if (this.isTutorialActive && !this.firstTradeLesson) {
            this.firstTradeLesson = { stockId, buyPrice: stock.price, status: 'watching' };
        }
        const posKey = `${stockId}_LONG_${leverage}`;
        const existing = this.portfolio.get(posKey);

        if (existing) {
            const totalQty = existing.qty + qty;
            const totalCost = (existing.avgPrice * existing.qty) + (stock.price * qty);
            existing.avgPrice = Math.round(totalCost / totalQty);
            existing.qty = totalQty;
            existing.collateral += requiredCash;
        } else {
            this.portfolio.set(posKey, {
                id: stockId,
                posKey: posKey,
                qty: qty,
                avgPrice: stock.price,
                leverage: leverage,
                isShort: false,
                collateral: requiredCash
            });
        }

        this.notify();
        return {
            success: true,
            msg: `[매수 완료] ${stock.name} ${qty}주 (${leverage}x 레버리지)를 ${requiredCash.toLocaleString()}G에 매수했습니다.`
        };
    }

    sellStock(stockId, qty) {
        qty = Math.max(1, parseInt(qty) || 1);
        const stock = this.stocks.get(stockId);
        if (!stock) return { success: false, msg: '존재하지 않는 종목입니다.' };

        // Find matching long positions
        let totalSold = 0;
        let totalRecoveredCash = 0;
        let realizedProfit = 0;
        let soldCollateral = 0;

        for (const [key, pos] of this.portfolio.entries()) {
            if (pos.id === stockId && !pos.isShort) {
                const sellQty = Math.min(qty - totalSold, pos.qty);
                const ratio = sellQty / pos.qty;
                const portionCollateral = pos.collateral * ratio;
                soldCollateral += portionCollateral;
                const priceDiff = (stock.price - pos.avgPrice) * sellQty * pos.leverage;
                const returnedCash = Math.max(0, portionCollateral + priceDiff);
                realizedProfit += returnedCash - portionCollateral;

                pos.qty -= sellQty;
                pos.collateral -= portionCollateral;
                totalSold += sellQty;
                totalRecoveredCash += returnedCash;

                if (pos.qty <= 0) {
                    this.portfolio.delete(key);
                }
                if (totalSold >= qty) break;
            }
        }

        if (totalSold === 0) {
            return { success: false, msg: `매도할 수 있는 ${stock.name} 보유 주식이 없습니다.` };
        }

        this.cash += Math.round(totalRecoveredCash);
        const lesson = this.firstTradeLesson;
        if (lesson?.stockId === stockId && lesson.status !== 'done') {
            lesson.sale = { quantity: totalSold, sellPrice: stock.price, profit: Math.round(realizedProfit), proceeds: Math.round(totalRecoveredCash) };
            lesson.status = 'sold';
        }
        if (this.itemEngine) this.itemEngine.state.profit += Math.round(realizedProfit);
        this.notify();
        return {
            success: true,
            trade: { stockId, quantity: totalSold, sellPrice: stock.price, profit: Math.round(realizedProfit), proceeds: Math.round(totalRecoveredCash) },
            achievement: realizedProfit > 0 ? { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`, stockId, stockName: stock.name,
                quantity: totalSold, profit: Math.round(realizedProfit), returnRate: soldCollateral > 0 ? realizedProfit / soldCollateral * 100 : 0 } : null,
            msg: `[매도 완료] ${stock.name} ${totalSold}주를 매도하여 ${Math.round(totalRecoveredCash).toLocaleString()}G를 정산받았습니다.`
        };
    }

    shortStock(stockId, qty, leverage = 1) {
        this.refreshTutorialRecommendation();
        const tutorialError = this.tutorialOrderError(stockId, true);
        if (tutorialError) return { success: false, msg: tutorialError };
        if (!this.isLevel10Unlocked) {
            return { success: false, msg: '공매도는 레벨 10 해금 후 이용 가능합니다!' };
        }

        qty = Math.max(1, parseInt(qty) || 1);
        leverage = Math.max(1, parseInt(leverage) || 1);
        if(leverage>=2&&!this.isLevel10Unlocked)return {success:false,msg:'레버리지는 레벨 10 해금 후 이용 가능합니다!'};
        const stock = this.stocks.get(stockId);
        if (!stock) return { success: false, msg: '존재하지 않는 종목입니다.' };

        const requiredMargin = Math.round((stock.price * qty) / leverage);
        if (this.cash < requiredMargin) {
            return {
                success: false,
                msg: `공매도 증거금이 부족합니다! (필요: ${requiredMargin.toLocaleString()}G, 보유: ${this.cash.toLocaleString()}G)`
            };
        }

        this.cash -= requiredMargin;
        const posKey = `${stockId}_SHORT_${leverage}`;
        const existing = this.portfolio.get(posKey);

        if (existing) {
            const totalQty = existing.qty + qty;
            const totalCost = (existing.avgPrice * existing.qty) + (stock.price * qty);
            existing.avgPrice = Math.round(totalCost / totalQty);
            existing.qty = totalQty;
            existing.collateral += requiredMargin;
        } else {
            this.portfolio.set(posKey, {
                id: stockId,
                posKey: posKey,
                qty: qty,
                avgPrice: stock.price,
                leverage: leverage,
                isShort: true,
                collateral: requiredMargin
            });
        }

        this.notify();
        return {
            success: true,
            msg: `[공매도 진입] ${stock.name} ${qty}주 (${leverage}x 숏 포지션) 진입 완료! (증거금: ${requiredMargin.toLocaleString()}G)`
        };
    }

    liquidateForEscape() {
        let recovered = 0, profit = 0;
        for (const pos of this.portfolio.values()) {
            const stock = this.stocks.get(pos.id);
            if (!stock) continue;
            const diff = (stock.price - pos.avgPrice) * pos.qty * pos.leverage * (pos.isShort ? -1 : 1);
            const payout = Math.max(0, pos.collateral + diff);
            recovered += payout;
            profit += payout - pos.collateral;
        }
        this.cash += Math.round(recovered);
        this.portfolio.clear();
        if (this.itemEngine) this.itemEngine.state.profit += Math.round(profit);
    }

    getSellPreview(stockId, qty) {
        const stock = this.stocks.get(stockId);
        let quantity = 0, proceeds = 0, collateral = 0;
        if (!stock) return { quantity, proceeds, profit: 0 };
        const requested = Math.max(1, parseInt(qty) || 1);
        for (const pos of this.portfolio.values()) {
            if (pos.id !== stockId || pos.isShort) continue;
            const sold = Math.min(requested - quantity, pos.qty);
            const margin = pos.collateral * sold / pos.qty;
            proceeds += Math.max(0, margin + (stock.price - pos.avgPrice) * sold * pos.leverage);
            collateral += margin;
            quantity += sold;
            if (quantity >= requested) break;
        }
        return { quantity, proceeds: Math.round(proceeds), profit: Math.round(proceeds - collateral) };
    }

    getOrderBook(stockId) {
        const stock = this.stocks.get(stockId);
        if (!stock) return { asks: [], bids: [] };

        const base = stock.price;
        const asks = [];
        const bids = [];

        for (let i = 5; i >= 1; i--) {
            const price = Math.round(base * (1 + i * 0.008));
            const vol = Math.floor(20 + Math.random() * 80 + i * 15);
            asks.push({ price, vol, pct: Math.min(100, (vol / 150) * 100) });
        }

        for (let i = 1; i <= 5; i++) {
            const price = Math.max(10, Math.round(base * (1 - i * 0.008)));
            const vol = Math.floor(20 + Math.random() * 80 + (6 - i) * 15);
            bids.push({ price, vol, pct: Math.min(100, (vol / 150) * 100) });
        }

        return { asks, bids };
    }

    nextDay() {
        if (this.day >= this.maxDays) return;
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
            const swing = (Math.random() - 0.48) * 0.08;
            stock.prevPrice = stock.price;
            stock.price = Math.max(10, Math.round(stock.price * (1 + swing)));
            const hist = this.priceHistory.get(stock.id);
            if (hist) {
                hist.push(stock.price);
                if (hist.length > 50) hist.shift();
            }
        });

        this.notify();
    }

    reset() {
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

