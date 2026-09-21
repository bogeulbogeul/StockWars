/**
 * StockWars Market Engine & Simulation State
 * Unity equivalent: MarketManager.cs / TradeKernel.cs
 * Features: Real-time price fluctuations, Order Book generation,
 * Portfolio math, Long/Short positions, Leverage (1x/2x/3x/5x),
 * Global Cipher Index, 7-Day Settlement math.
 */

import { INITIAL_STOCKS, INITIAL_NEWS } from '../data/stocksData.js';

class MarketEngine {
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
        this.priceHistory = new Map(); // stockId -> array of numbers
        this.listeners = new Set();
        this.tickTimer = null;
        this.isLevel20Unlocked = false;
        this.tutorialStockId = null;
        this.isTutorialActive = false;

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

            let changePct;
            if (this.isTutorialActive && stock.id === this.tutorialStockId) {
                // Guaranteed positive upward momentum during tutorial! (+1.2% to +3.6% steady tick increase)
                changePct = 0.012 + Math.random() * 0.024;
            } else {
                changePct = (Math.random() - 0.49) * volatility;
            }

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
     * Guarantees positive upward return during the tutorial period.
     */
    getRecommendedTutorialStock(userProfile = {}) {
        const traitKey = userProfile?.trait?.key;
        let candidateId = 'CLOUDBERRY';
        let recommendationReason = '개장 직후 가장 높은 시장 안정성과 지속적인 상승 모멘텀을 보유한 대표 우량주';

        if (traitKey === 'analysis') {
            candidateId = 'SYNAPSENET';
            recommendationReason = '예리한 기술적 분석 지표와 저지연 통신망 특허를 바탕으로 탄탄한 펀더멘털을 갖춘 종목';
        } else if (traitKey === 'negotiation') {
            candidateId = 'COZYPAY';
            recommendationReason = '간편 결제 점유율 1위 및 막대한 수수료 현금 유입을 자랑하는 안정적 핀테크 대장주';
        } else if (traitKey === 'management') {
            candidateId = 'STUDIOLUNA';
            recommendationReason = '신작 글로벌 흥행 기대감과 가파른 영업이익 성장 모멘텀이 돋보이는 중형 유망주';
        } else if (traitKey === 'recovery') {
            candidateId = 'FORESTLAB';
            recommendationReason = '천연 추출 의약품 특허와 안정적인 방어력을 겸비한 지속 성장형 바이오 우량주';
        } else {
            // Fallback: choose the stock with the best risk-adjusted price under 1,000G
            const affordableStocks = Array.from(this.stocks.values()).filter(s => s.price > 100 && s.price <= 1000);
            if (affordableStocks.length > 0) {
                candidateId = affordableStocks[0].id;
                recommendationReason = `${affordableStocks[0].name}의 실시간 수급 동향과 초기 자금(5,000G) 대비 최적의 상승 잠재력`;
            }
        }

        const stock = this.stocks.get(candidateId) || Array.from(this.stocks.values())[0];
        this.tutorialStockId = stock.id;
        this.isTutorialActive = true;

        // Ensure stock has positive initial momentum
        if (stock.price <= stock.prevPrice) {
            stock.prevPrice = Math.round(stock.price * 0.98);
        }

        return {
            stock: stock,
            reason: recommendationReason
        };
    }

    setTutorialActive(isActive) {
        this.isTutorialActive = isActive;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(fn => fn(state));
    }

    toggleLevel20Unlock() {
        this.isLevel20Unlocked = !this.isLevel20Unlocked;
        this.notify();
        return this.isLevel20Unlocked;
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
            isLevel20Unlocked: this.isLevel20Unlocked
        };
    }

    getPortfolioList() {
        const list = [];
        this.portfolio.forEach((pos, stockId) => {
            const stock = this.stocks.get(stockId);
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
                id: stockId,
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
        qty = Math.max(1, parseInt(qty) || 1);
        leverage = Math.max(1, parseInt(leverage) || 1);
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

        for (const [key, pos] of this.portfolio.entries()) {
            if (pos.id === stockId && !pos.isShort) {
                const sellQty = Math.min(qty - totalSold, pos.qty);
                const ratio = sellQty / pos.qty;
                const portionCollateral = pos.collateral * ratio;
                const priceDiff = (stock.price - pos.avgPrice) * sellQty * pos.leverage;
                const returnedCash = Math.max(0, portionCollateral + priceDiff);

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
        this.notify();
        return {
            success: true,
            msg: `[매도 완료] ${stock.name} ${totalSold}주를 매도하여 ${Math.round(totalRecoveredCash).toLocaleString()}G를 정산받았습니다.`
        };
    }

    shortStock(stockId, qty, leverage = 1) {
        if (!this.isLevel20Unlocked) {
            return { success: false, msg: '공매도는 레벨 20 해금 후 이용 가능합니다!' };
        }

        qty = Math.max(1, parseInt(qty) || 1);
        leverage = Math.max(1, parseInt(leverage) || 1);
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
        this.day += 1;
        if (this.day > this.maxDays) {
            this.day = 1; // Loop or settlement
        }

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
        this.cash = this.initialCash;
        this.day = 1;
        this.portfolio.clear();
        this.init();
        this.notify();
    }
}

export const marketEngine = new MarketEngine();
