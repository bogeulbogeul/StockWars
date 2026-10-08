import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestChartPoint } from '../js/components/chart/ChartPointer.js';

test('guide reaches both ends and prefers the newer record on ties', () => {
    const points = [50, 100, 125, 1290].map(x => ({ x }));
    for (const [x, index] of [[-10, 0], [75, 1], [112.5, 2], [1289.9, 3], [1400, 3]]) {
        assert.equal(nearestChartPoint(points, x), points[index]);
    }
    assert.equal(nearestChartPoint([], 10), null);
    assert.equal(nearestChartPoint([points[0]], 200), points[0]);
});

test('subpixel live quotes and duplicate timestamps select the latest record', () => {
    const points = [50, 1289, 1289.8, 1290, 1290].map(x => ({ x }));
    assert.equal(nearestChartPoint(points, 1289.8, 0.5), points.at(-1));
    assert.equal(nearestChartPoint(points, 1290), points.at(-1));
});

test('long histories require logarithmic point reads per pointer update', () => {
    let reads = 0;
    const points = Array.from({ length: 100000 }, (_, x) => ({ get x() { reads++; return x; } }));
    assert.equal(nearestChartPoint(points, 75555.2), points[75555]);
    assert.ok(reads < 50, `read ${reads} points`);
});
