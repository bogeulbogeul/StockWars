import test from 'node:test';
import assert from 'node:assert/strict';
import {tradeHardArenaBot} from '../js/components/arenaBot.js';

test('hard bot buys rising stocks, preserves cash, and sells on reversal', () => {
    const bot = {cash:10000, positions:new Map()};
    const engine = {
        stocks:new Map([['up',{id:'up',price:110}],['down',{id:'down',price:90}]]),
        priceHistory:new Map([['up',[100,105,110]],['down',[100,95,90]]]),
        getOrderQuote:(price, qty) => ({fee:Math.round(price * qty * .001)})
    };
    tradeHardArenaBot(bot, engine);
    assert.ok(bot.positions.get('up') > 0);
    assert.equal(bot.positions.has('down'), false);
    assert.ok(bot.cash >= 7000);
    const qty = bot.positions.get('up');
    assert.equal(bot.cash,10000 - qty * 110 - Math.round(qty * 110 * .001));
    engine.priceHistory.set('up',[120,115,110]);
    tradeHardArenaBot(bot, engine);
    assert.equal(bot.positions.size,0);
    assert.equal(bot.cash,10000 - 2 * Math.round(qty * 110 * .001));
});
