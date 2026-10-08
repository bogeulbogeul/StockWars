import test from 'node:test';import assert from 'node:assert/strict';
import {createChartHistory,chartPeriod,chartTimeLabel,chartPriceRange} from '../js/engine/ChartTimeframes.js';
test('period selection uses distinct ranges from one stable history without changing live quote',()=>{
 const now=Date.UTC(2026,9,8),stock={id:'TEST',price:300},before={...stock};const history=createChartHistory(stock,now);
 assert.deepEqual(stock,before);assert.deepEqual(createChartHistory(stock,now),history);assert.equal(history.at(-1).price,300);
 let previous=0;for(const tf of ['1D','1W','1M','1Y']){const selected=chartPeriod(history,tf,now);assert.ok(selected.samples.length>previous);previous=selected.samples.length;assert.equal(selected.samples.at(-1).time,now);assert.ok(selected.high>=selected.average&&selected.low<=selected.average);}
 assert.notEqual(chartTimeLabel(now,'1D'),chartTimeLabel(now,'1Y'));assert.ok(chartTimeLabel(now,'1Y',true).includes('2026/'));
});
test('live view follows the last 50 records and keeps visible price movement in range',()=>{
 const now=Date.UTC(2026,9,8), history=Array.from({length:80},(_,i)=>({time:now-(79-i)*2200,price:430+i%15}));
 const selected=chartPeriod(history,'LIVE',now);
 assert.deepEqual(selected.samples,history.slice(-50));
 history.push({time:now+2200,price:437});
 assert.deepEqual(chartPeriod(history,'LIVE',now+2200).samples,history.slice(-50));
 const {minPrice,maxPrice}=chartPriceRange([430,445]);
 assert.ok(minPrice<430&&maxPrice>445);
 assert.ok(15/(maxPrice-minPrice)>0.6);
 const flat=chartPriceRange([437,437]);
 assert.ok(flat.maxPrice>flat.minPrice);
 assert.match(chartTimeLabel(now,'LIVE'),/^\d{2}:\d{2}:\d{2}$/);
});
