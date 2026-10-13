// Hard AI uses only observed prices, retaining cash and limiting each holding.
export function tradeHardArenaBot(bot, engine) {
    const ranked = [...engine.stocks.values()].filter(stock => stock.price > 0).map(stock => {
        const history = engine.priceHistory.get(stock.id) || [];
        const base = history[Math.max(0, history.length - 6)];
        return { ...stock, momentum: base > 0 ? stock.price / base - 1 : 0 };
    }).sort((a, b) => b.momentum - a.momentum);
    const leaders = ranked.filter(stock => stock.momentum > .002).slice(0, 3);
    const fee = (price, qty) => engine.getOrderQuote(price, qty, 1, 'brokerage').fee;
    for (const [id, qty] of bot.positions) {
        const stock = ranked.find(item => item.id === id);
        if (stock && !leaders.some(item => item.id === id)) {
            bot.cash += stock.price * qty - fee(stock.price, qty);
            bot.positions.delete(id);
        }
    }
    const assets = bot.cash + ranked.reduce((sum, stock) => sum + stock.price * (bot.positions.get(stock.id) || 0), 0);
    for (const stock of leaders) {
        const held = bot.positions.get(stock.id) || 0;
        const budget = Math.max(0, Math.min(bot.cash - assets * .1, assets * .3 - held * stock.price));
        let qty = Math.floor(budget / stock.price);
        while (qty > 0 && qty * stock.price + fee(stock.price, qty) > budget) qty--;
        if (qty > 0) {
            bot.cash -= qty * stock.price + fee(stock.price, qty);
            bot.positions.set(stock.id, held + qty);
        }
    }
}
