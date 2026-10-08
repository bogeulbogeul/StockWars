import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerProfileModal } from '../js/components/PlayerProfileModal.js';

test('profile safely renders current data, refreshes changes, and handles an unregistered player', () => {
    const fields = new Map();
    const modal = Object.create(PlayerProfileModal.prototype);
    modal.dialog = { querySelector(selector) {
        if (!fields.has(selector)) {
            const svg = { setAttribute() {} };
            fields.set(selector, { textContent: '', dataset: {}, attributes: {},
                setAttribute(name, value) { this.attributes[name] = value; },
                querySelector() { return this.innerHTML?.includes('<svg') ? svg : null; } });
        }
        return fields.get(selector);
    } };
    const market = { cash: 1500, totalNetWorth: 3700, portfolioValue: 2200, portfolio: [{}, {}], totalProfitLoss: -300 };
    modal.sources = {
        getProfile: () => ({ nickname: '<img src=x>', traderCode: 'CIPHER-TRD-TEST' }),
        getMarketState: () => market,
        getStats: () => ({ analysis: 4, management: 1, recovery: 2 }),
        getStamina: () => ({ current: 1.5, max: 3 })
    };
    const field = key => fields.get(`[data-field="${key}"]`);
    modal.update();
    assert.equal(field('nickname').textContent, '<img src=x>');
    assert.match(fields.get('.player-profile-portrait').innerHTML, /<svg/);
    assert.equal(fields.get('.player-profile-portrait').attributes['aria-label'], '<img src=x>의 얼굴');
    assert.equal(field('analysis').textContent, 4);
    assert.equal(field('stamina').textContent, '1.5 / 3');
    assert.equal(field('totalNetWorth').textContent, '3,700 G');
    assert.equal(field('positions').textContent, '2개');
    assert.equal(field('profitLoss').dataset.direction, 'negative');
    market.totalProfitLoss = 400;
    modal.update();
    assert.equal(field('profitLoss').textContent, '+400 G');
    assert.equal(field('profitLoss').dataset.direction, 'positive');
    modal.sources = {};
    modal.update();
    assert.equal(field('traderCode').textContent, '출입증 발급 전');
    assert.equal(field('analysis').textContent, '—');
});
