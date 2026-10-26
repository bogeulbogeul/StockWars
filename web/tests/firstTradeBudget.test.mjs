import test from 'node:test';
import assert from 'node:assert/strict';
import { firstTradeChoices } from '../js/engine/FirstTradeBudget.js';
import { INITIAL_STOCKS } from '../js/data/stocksData.js';
import { stockLessonPages } from '../js/components/phone/stock/StockLessonDock.js';

test('first trade uses actual cash capped at 1500 and retains the first six eligible companies', () => {
 for (const cash of [0, -10, 50, 160, 500, 1500, 10000, NaN]) {
  const {budget, choices}=firstTradeChoices(INITIAL_STOCKS,cash);
  assert.equal(budget, Math.max(0,Math.min(1500,Number.isFinite(cash)?cash:0)));
  assert.deepEqual(choices,INITIAL_STOCKS.filter(s=>s.price>0 && s.price<=budget).slice(0,6));
  for(const stock of choices)assert(cash-stock.price>=0);
 }
});
test('every screen teaches several current features without restoring retired slot limits', () => {
 for (const key of ['home','market','info','chart','order','account','history']) {
  const pages=stockLessonPages(key,{firstTrade:{budget:500}});
  assert(pages.length>=4);
  for(const [title,text] of pages){assert(title);assert(text);assert.doesNotMatch(text,/공통 5칸|빈 슬롯/);}
 }
 assert.match(stockLessonPages('market',{firstTrade:{budget:500}}).map(p=>p[1]).join(' '),/500/);
});
