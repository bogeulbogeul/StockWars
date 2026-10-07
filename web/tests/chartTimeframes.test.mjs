import test from 'node:test';import assert from 'node:assert/strict';
import {createChartHistory,chartPeriod,chartTimeLabel} from '../js/engine/ChartTimeframes.js';
test('period selection uses distinct ranges from one stable history without changing live quote',()=>{
 const now=Date.UTC(2026,9,8),stock={id:'TEST',price:300},before={...stock};const history=createChartHistory(stock,now);
 assert.deepEqual(stock,before);assert.deepEqual(createChartHistory(stock,now),history);assert.equal(history.at(-1).price,300);
 let previous=0;for(const tf of ['1D','1W','1M','1Y']){const selected=chartPeriod(history,tf,now);assert.ok(selected.samples.length>previous);previous=selected.samples.length;assert.equal(selected.samples.at(-1).time,now);assert.ok(selected.high>=selected.average&&selected.low<=selected.average);}
 assert.notEqual(chartTimeLabel(now,'1D'),chartTimeLabel(now,'1Y'));assert.ok(chartTimeLabel(now,'1Y',true).includes('2026/'));
});
