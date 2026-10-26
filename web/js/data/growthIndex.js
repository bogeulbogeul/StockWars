import { INITIAL_STOCKS } from './stocksData.js';

export const GROWTH_INDEX_NAME = '새싹 성장지수';
export const GROWTH_INDEX_BASE = 1000;
export const GROWTH_INDEX_IDS = Object.freeze([
    'MOMOSOLUTION', 'BYTECORE', 'NEXUSSOFT',
    'NEURONBIO', 'CELLHEALTH', 'BIONICS',
    'ECOBATTERY', 'HYDROGENX', 'CLEANENERGY',
    'COSMOSX', 'STARJET', 'HYPERLOOP',
    'STUDIOLUNA', 'NEXTONE', 'STOREMASTER', 'PAYONE'
]);
// Fixed reference prices: equal 1/16 contribution to returns from the base.
// Never anchor to the current session, saved holdings, or the latest quote.
export const GROWTH_INDEX_MEMBERS = Object.freeze(GROWTH_INDEX_IDS.map(id => {
    const stock = INITIAL_STOCKS.find(stock => stock.id === id);
    return Object.freeze({ id, name: stock?.name, basePrice: stock?.price });
}));
