import { GROWTH_INDEX_BASE, GROWTH_INDEX_MEMBERS } from '../data/growthIndex.js';

export function calculateGrowthIndex(stocks) {
    if (!Array.isArray(stocks)) return null;
    const quotes = new Map(stocks.map(stock => [stock.id, stock]));
    let current = 0, previous = 0;
    for (const member of GROWTH_INDEX_MEMBERS) {
        const stock = quotes.get(member.id);
        if (!stock || !Number.isFinite(stock.price) || stock.price <= 0
            || !Number.isFinite(stock.prevPrice) || stock.prevPrice <= 0
            || !Number.isFinite(member.basePrice) || member.basePrice <= 0) return null;
        current += stock.price / member.basePrice;
        previous += stock.prevPrice / member.basePrice;
    }
    const value = GROWTH_INDEX_BASE * current / GROWTH_INDEX_MEMBERS.length;
    return { val: value.toFixed(2), diffPct: (current / previous - 1) * 100,
        unit: 'pt', members: GROWTH_INDEX_MEMBERS.length };
}
