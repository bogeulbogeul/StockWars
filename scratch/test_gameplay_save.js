import { INITIAL_STOCKS } from '../web/js/data/stocksData.js?v=v72';
import { MarketEngine } from '../web/js/engine/marketEngine.js';

const market = new MarketEngine();
console.log('Initial stocks count in MarketEngine:', market.stocks.size);

// Simulate old saved state with only 13 stocks
const oldStocksMap = new Map();
INITIAL_STOCKS.slice(0, 13).forEach(s => oldStocksMap.set(s.id, s));
market.stocks = oldStocksMap;
console.log('Simulated old saved state stocks count:', market.stocks.size);

// Execute merge logic
INITIAL_STOCKS.forEach(stock => {
    const existing = market.stocks.get(stock.id);
    if (!existing) {
        market.stocks.set(stock.id, { ...stock, history: [stock.prevPrice, stock.price] });
    } else {
        existing.name = stock.name;
        existing.desc = stock.desc;
        existing.richDesc = stock.richDesc;
        existing.sector = stock.sector;
        existing.risk = stock.risk;
        existing.tier = stock.tier;
    }
});

console.log('After merge stocks count:', market.stocks.size);

const bySector = {};
market.stocks.forEach(s => {
    bySector[s.sector] = (bySector[s.sector] || 0) + 1;
});
console.log('After merge stocks by sector:', bySector);
