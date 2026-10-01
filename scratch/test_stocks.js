import { INITIAL_STOCKS, SECTORS } from '../web/js/data/stocksData.js';

console.log('Total INITIAL_STOCKS count:', INITIAL_STOCKS.length);
const bySector = {};
INITIAL_STOCKS.forEach(s => {
    bySector[s.sector] = (bySector[s.sector] || 0) + 1;
});
console.log('Stocks by sector:', bySector);
