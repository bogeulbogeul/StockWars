/**
 * StockWars Market Engine & State Manager
 * Handles real-time price ticks, portfolio math, order book generation,
 * and 7-day settlement countdown.
 */

import { INITIAL_STOCKS, INITIAL_NEWS } from '../data/stocksData.js';

class MarketEngine {
    constructor() {
        this.stocks = new Map();
        this.news = [...INITIAL_NEWS];
        this.cash = 5000; // Starting cash 5,000 Gold
        this.targetRent = 5000; // 7-day settlement target
        this.day = 1;
        this.maxDays = 7;
        this.portfolio = new Map(); // stockId -> { qty, avgPrice }
        this.priceHistory = new Map(); // stockId -> array of prices
        this.listeners = new Set();
        this.tickTimer = null;

        this.init();
    }

    init() {
        INITIAL_STOCKS.forEach(stock => {
            const stockCopy = { ...stock, history: [stock.prevPrice, stock.price] };
            this.stocks.set(stock.id, stockCopy);
            this.priceHistory.set(stock.id, this.generateInitialHistory(stock.price));
        });

        // Start live market ticks every 2.5 seconds
        this.startEngine();
    }

    generateInitialHistory(basePrice) {
        const history = [];
        let curr = basePrice * (0.85 + Math.random() * 0.1);
        for (let i = 0; i < 20; i++) {
            const changePct = (Math.random() - 0.49) * 0.04;
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
        }, 2500);
    }

    stopEngine() {
        if (this.tickTimer) clearInterval(this.tickTimer);
    }

    tick() {
        let anyPriceChanged = false;
        this.stocks.forEach(stock => {
            // Fluctuation based on tier
            let volatility = 0.02;
            if (stock.tier === 'S') volatility = 0.07;
            else if (stock.tier === 'A') volatility = 0.04;
            else if (stock.tier === 'B') volatility = 0.025;

            const changePct = (Math.random() - 0.49) * volatility;
            const newPrice = Math.max(10, Math.round(stock.price * (1 + changePct)));

            if (newPrice !== stock.price) {
                stock.prevPrice = stock.price;
                stock.price = newPrice;
                const hist = this.priceHistory.get(stock.id);
                hist.push(newPrice);
                if (hist.length > 40) hist.shift();
                anyPriceChanged = true;
            }
        });

        if (anyPriceChanged) {
            this.notify();
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.getState()));
    }

    getState() {
        const stockList = Array.from(this.stocks.values());
        const portfolioValue = this.getPortfolioValue();
        const totalNetWorth = this.cash + portfolioValue;
        const totalProfitLoss = this.getPortfolioProfitLoss();

        return {
            stocks: stockList,
            news: this.news,
            cash: this.cash,
            portfolio: Array.from(this.portfolio.entries()).map(([id, item]) => ({
                id,
                stock: this.stocks.get(id),
                qty: item.qty,
                avgPrice: item.avgPrice,
                currentVal: (this.stocks.get(id)?.price || 0) * item.qty,
                profitLoss: ((this.stocks.get(id)?.price || 0) - item.avgPrice) * item.qty,
                profitLossPct: item.avgPrice > 0 ? (((this.stocks.get(id)?.price || 0) - item.avgPrice) / item.avgPrice) * 100 : 0
            })),
            portfolioValue,
            totalNetWorth,
            totalProfitLoss,
            day: this.day,
            maxDays: this.maxDays,
            targetRent: this.targetRent
        };
    }

    getPortfolioValue() {
        let total = 0;
        this.portfolio.forEach((item, id) => {
            const stock = this.stocks.get(id);
            if (stock) {
                total += stock.price * item.qty;
            }
        });
        return total;
    }

    getPortfolioProfitLoss() {
        let totalPL = 0;
        this.portfolio.forEach((item, id) => {
            const stock = this.stocks.get(id);
            if (stock) {
                totalPL += (stock.price - item.avgPrice) * item.qty;
            }
        });
        return totalPL;
    }

    // Buy Stock Execution
    buyStock(stockId, qty) {
        const stock = this.stocks.get(stockId);
        if (!stock || qty <= 0) return { success: false, msg: '유효하지 않은 수량입니다.' };

        const totalCost = stock.price * qty;
        if (this.cash < totalCost) {
            return { success: false, msg: `현금이 부족합니다. (필요: ${totalCost.toLocaleString()}G, 보유: ${this.cash.toLocaleString()}G)` };
        }

        this.cash -= totalCost;
        const existing = this.portfolio.get(stockId) || { qty: 0, avgPrice: 0 };
        const newQty = existing.qty + qty;
        const newAvgPrice = Math.round(((existing.avgPrice * existing.qty) + totalCost) / newQty);

        this.portfolio.set(stockId, { qty: newQty, avgPrice: newAvgPrice });
        this.notify();
        return { success: true, msg: `${stock.name} ${qty}주 매수가 완료되었습니다.` };
    }

    // Sell Stock Execution
    sellStock(stockId, qty) {
        const stock = this.stocks.get(stockId);
        const existing = this.portfolio.get(stockId);
        if (!stock || !existing || qty <= 0 || existing.qty < qty) {
            return { success: false, msg: '매도 가능한 보유 주식이 부족합니다.' };
        }

        const totalReturn = stock.price * qty;
        this.cash += totalReturn;

        const remainingQty = existing.qty - qty;
        if (remainingQty <= 0) {
            this.portfolio.delete(stockId);
        } else {
            this.portfolio.set(stockId, { qty: remainingQty, avgPrice: existing.avgPrice });
        }

        this.notify();
        return { success: true, msg: `${stock.name} ${qty}주 매도가 완료되었습니다.` };
    }

    // Orderbook Generator
    getOrderBook(stockId) {
        const stock = this.stocks.get(stockId);
        if (!stock) return { asks: [], bids: [] };

        const base = stock.price;
        const asks = []; // Selling order levels (higher prices)
        const bids = []; // Buying order levels (lower prices)

        for (let i = 5; i >= 1; i--) {
            const price = Math.round(base * (1 + i * 0.004));
            const vol = Math.floor(50 + Math.random() * 450);
            asks.push({ price, vol, pct: Math.min(100, (vol / 500) * 100) });
        }

        for (let i = 1; i <= 5; i++) {
            const price = Math.max(10, Math.round(base * (1 - i * 0.004)));
            const vol = Math.floor(50 + Math.random() * 450);
            bids.push({ price, vol, pct: Math.min(100, (vol / 500) * 100) });
        }

        return { asks, bids, currentPrice: base, prevPrice: stock.prevPrice };
    }

    // Advance Day
    nextDay() {
        if (this.day < this.maxDays) {
            this.day++;
            // Trigger extra price jumps on day tick
            this.stocks.forEach(stock => {
                const dayJump = (Math.random() - 0.48) * 0.06;
                stock.price = Math.max(10, Math.round(stock.price * (1 + dayJump)));
            });
            this.notify();
        }
    }

    // Reset Engine
    reset() {
        this.cash = 5000;
        this.day = 1;
        this.portfolio.clear();
        this.init();
        this.notify();
    }
}

export const marketEngine = new MarketEngine();
