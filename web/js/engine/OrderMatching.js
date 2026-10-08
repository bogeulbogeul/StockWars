// Game balance defaults, not exchange rules. Market orders cancel unfilled shares.
export const MARKET_PRICE_PROTECTION = 0.05;

export function createOrderBook(stock, revision = 0) {
    let seed = revision;
    for (const c of stock.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const levels = direction => Array.from({ length: 5 }, (_, i) => ({
        price: Math.max(10, Math.round(stock.price * (1 + direction * i * 0.008))),
        vol: 80 + (seed + i * 47 + (direction > 0 ? 19 : 37)) % 121
    }));
    return { referencePrice: stock.price, asks: levels(1), bids: levels(-1) };
}

// The demo's price pulse is also its ghost-trader flow. Keep remaining depth
// between ticks: replenish gradually, consume the aggressive side, and add
// resting liquidity on the same side as the incoming buying/selling pressure.
export function updateGhostLiquidity(book, stock, pressure, revision = 0) {
    const target = createOrderBook(stock, revision);
    const strength = Math.max(-1, Math.min(1, pressure));
    for (const side of ['asks', 'bids']) {
        const previous = [...book[side]].sort((a,b) => side === 'asks' ? a.price-b.price : b.price-a.price);
        book[side] = target[side].map((level,i) => {
            const remaining = previous[i]?.vol ?? 0;
            const replenished = remaining + Math.round((level.vol-remaining)*0.15);
            const support = (side === 'bids' && strength > 0) || (side === 'asks' && strength < 0)
                ? Math.round(Math.abs(strength)*40/(i+1)) : 0;
            return { price: level.price, vol: Math.max(0, Math.min(400, replenished+support)) };
        });
    }
    let requested = Math.round(Math.abs(strength)*150), consumed = 0;
    for (const level of strength > 0 ? book.asks : book.bids) {
        const quantity = Math.min(requested, level.vol);
        level.vol -= quantity; requested -= quantity; consumed += quantity;
        if (!requested) break;
    }
    book.referencePrice = stock.price;
    book.ghostFlow = { pressure: strength, side: strength > 0 ? 'buy' : strength < 0 ? 'sell' : 'neutral', quantity: consumed };
    return book;
}

// Read-only planning: all checks finish before any cash, inventory or depth changes.
export function matchOrder(book, { side, quantity, referencePrice, limitPrice = null, cash = Infinity,
    leverage = 1, feeRate = 0.0015 }) {
    const buying = side === 'buy';
    const levels = (buying ? book.asks : book.bids).map((level, index) => ({ ...level, index }))
        .sort((a,b) => buying ? a.price-b.price : b.price-a.price);
    const bound = limitPrice ?? referencePrice * (1 + (buying ? 1 : -1) * MARKET_PRICE_PROTECTION);
    let filled = 0, gross = 0, reason = 'liquidity';
    const fills = [];
    const cost = value => Math.round(value / leverage) + Math.round(value * feeRate);
    for (const level of levels) {
        if (filled >= quantity) break;
        if (level.vol <= 0) continue;
        if (buying ? level.price > bound : level.price < bound) { reason = 'price'; break; }
        let qty = Math.min(level.vol, quantity - filled);
        if (side !== 'sell' && cost(gross + level.price * qty) > cash) {
            let low = 0, high = qty + 1;
            while (low + 1 < high) {
                const mid = Math.floor((low + high) / 2);
                if (cost(gross + level.price * mid) <= cash) low = mid;
                else high = mid;
            }
            qty = low; reason = 'cash';
        }
        if (qty > 0) { fills.push({ index: level.index, price: level.price, quantity: qty }); filled += qty; gross += level.price * qty; }
        if (reason === 'cash') break;
    }
    const fee = Math.round(gross * feeRate), margin = Math.round(gross / leverage);
    return { quantity: filled, requested: quantity, remaining: quantity-filled, gross, fee, feeRate, margin,
        total: margin+fee, averagePrice: filled ? gross/filled : 0, fills, reason: filled === quantity ? null : reason };
}

export function planSale(portfolio, stockId, fills) {
    const positions = [...portfolio].filter(([,p]) => p.id === stockId && !p.isShort)
        .map(([key,p]) => ({ key, ...p, entryFees: p.entryFees || 0 }));
    let proceeds = 0, collateral = 0, entryFees = 0;
    for (const fill of fills) {
        let remaining = fill.quantity;
        for (const pos of positions) {
            if (!remaining) break;
            if (!pos.qty) continue;
            const qty = Math.min(pos.qty, remaining), ratio = qty / pos.qty;
            const margin = pos.collateral * ratio, paidFee = pos.entryFees * ratio;
            proceeds += Math.max(0, margin + (fill.price-pos.avgPrice)*qty*pos.leverage);
            collateral += margin; entryFees += paidFee;
            pos.qty -= qty; pos.collateral -= margin; pos.entryFees -= paidFee; remaining -= qty;
        }
    }
    return { positions, proceeds: Math.round(proceeds), collateral, profit: Math.round(proceeds-collateral-entryFees) };
}
