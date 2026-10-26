import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STOCKS } from '../js/data/stocksData.js';
import { GROWTH_INDEX_IDS, GROWTH_INDEX_MEMBERS } from '../js/data/growthIndex.js';
import { calculateGrowthIndex } from '../js/engine/GrowthIndex.js';

const baseQuotes = () => INITIAL_STOCKS.map(s => ({ ...s, prevPrice: s.price }));
test('approved growth basket contains exactly the 16 selected companies, with 9 mid and 7 high risk', () => {
    assert.deepEqual([...GROWTH_INDEX_IDS], ['MOMOSOLUTION', 'BYTECORE', 'NEXUSSOFT', 'NEURONBIO', 'CELLHEALTH', 'BIONICS', 'ECOBATTERY', 'HYDROGENX', 'CLEANENERGY', 'COSMOSX', 'STARJET', 'HYPERLOOP', 'STUDIOLUNA', 'NEXTONE', 'STOREMASTER', 'PAYONE']);
    assert.equal(new Set(GROWTH_INDEX_IDS).size, 16);
    const members = INITIAL_STOCKS.filter(s => GROWTH_INDEX_IDS.includes(s.id));
    assert.equal(members.filter(s => s.risk === 'Mid').length, 9);
    assert.equal(members.filter(s => s.risk === 'High').length, 7);
    assert(GROWTH_INDEX_MEMBERS.every(s => s.basePrice > 0));
});
test('1000 point base and uniform returns preserve the intended scale without modifying quotes', () => {
    const stocks = baseQuotes(); const before = structuredClone(stocks);
    assert.deepEqual(calculateGrowthIndex(stocks), { val: '1000.00', diffPct: 0, members: 16, unit: 'pt' });
    assert.deepEqual(stocks, before);
    for (const s of stocks) s.price *= 1.1;
    const index = calculateGrowthIndex(stocks);
    assert.equal(index.val, '1100.00');
    assert(Math.abs(index.diffPct - 10) < 1e-9);
});
test('equal relative moves contribute equally regardless of share price, while nonmembers have no influence', () => {
    const contribution = id => {
        const stocks = baseQuotes(); stocks.find(s => s.id === id).price *= 1.1;
        return calculateGrowthIndex(stocks);
    };
    assert.equal(contribution('MOMOSOLUTION').val, '1006.25');
    assert.equal(contribution('NEXTONE').val, '1006.25');
    const stocks = baseQuotes(); stocks.find(s => s.id === 'SAFEBANK').price *= 10;
    assert.equal(calculateGrowthIndex(stocks).val, '1000.00');
});
test('change compares unrounded current and previous baskets; incomplete or invalid baskets are unavailable', () => {
    const stocks = baseQuotes();
    for (const s of stocks) { s.prevPrice *= 1.1; s.price *= 1.21; }
    const index = calculateGrowthIndex(stocks);
    assert.equal(index.val, '1210.00');
    assert(Math.abs(index.diffPct - 10) < 1e-9);
    assert.equal(calculateGrowthIndex(stocks.filter(s => s.id !== GROWTH_INDEX_IDS[0])), null);
    stocks.find(s => s.id === GROWTH_INDEX_IDS[0]).price = NaN;
    assert.equal(calculateGrowthIndex(stocks), null);
    assert.equal(calculateGrowthIndex(null), null);
});
