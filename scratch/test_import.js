import { INITIAL_STOCKS, SECTORS, INITIAL_NEWS } from '../web/js/data/stocksData.js';

console.log('SUCCESS!');
console.log('SECTORS COUNT:', Object.keys(SECTORS).length);
console.log('TOTAL INITIAL_STOCKS COUNT:', INITIAL_STOCKS.length);
console.log('ENTERTAINMENT STOCKS:', INITIAL_STOCKS.filter(s => s.sector === 'Entertainment').map(s => s.name).join(', '));
