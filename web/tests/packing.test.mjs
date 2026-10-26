import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKING_PATTERNS, PACKING_ITEMS, createOrder, createSession } from '../js/components/packing/PackingData.js';
import { canPlace, placeItem, footprint, resetOrder, isOrderComplete, finishOrder } from '../js/components/packing/PackingLogic.js';

function solve(order) {
    const rows = PACKING_PATTERNS[order.patternIndex];
    for (const item of order.items) {
        const points = [];
        rows.forEach((row, y) => [...row].forEach((key, x) => { if (key === item.id) points.push({ x, y }); }));
        const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
        const w = Math.max(...points.map(p => p.x)) - x + 1;
        const h = Math.max(...points.map(p => p.y)) - y + 1;
        assert.equal(points.length, w * h, 'Each item must occupy one solid rectangle');
        assert.equal(points.length, PACKING_ITEMS[item.id].width * PACKING_ITEMS[item.id].height);
        assert.deepEqual(footprint(item), { width: w, height: h });
        assert.ok(placeItem(order, item, x, y), `Pattern ${order.patternIndex}, item ${item.id}`);
    }
}

test('all twenty patterns fill every cell exactly, including independently movable duplicate jelly', () => {
    assert.equal(PACKING_PATTERNS.length, 20);
    PACKING_PATTERNS.forEach((_, i) => {
        const order = createOrder(i);
        assert.equal(order.items.reduce((sum, item) => sum + item.width * item.height, 0), order.width * order.height);
        assert.equal(PACKING_PATTERNS[i].join('').includes('.'), false);
        solve(order);
        assert.ok(isOrderComplete(order));
    });
});

test('patterns have distinct box/product combinations and every pattern can be drawn', () => {
    const signatures = PACKING_PATTERNS.map(rows => `${rows[0].length}x${rows.length}:` +
        [...new Set(rows.join(''))].map(id => PACKING_ITEMS[id].art).sort((a,b) => a-b).join(','));
    assert.equal(new Set(signatures).size, PACKING_PATTERNS.length);
    let seed = 42;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const seen = new Set();
    for (let i=0; i<100; i++) createSession(random).orders.forEach(order => seen.add(order.patternIndex));
    assert.equal(seen.size, PACKING_PATTERNS.length);
});

test('an otherwise valid layout with an empty cell cannot complete', () => {
    const order = createOrder(7);
    solve(order);
    order.items = order.items.filter(item => item.id !== 'K');
    assert.equal(isOrderComplete(order), false);
});

test('overlaps, edges, fractional cells and foreign items cannot change placements', () => {
    const order = createOrder(0);
    const cookie = order.items.find(i => i.id === 'A'), berry = order.items.find(i => i.id === 'E');
    assert.ok(placeItem(order, cookie, 0, 0));
    assert.equal(placeItem(order, berry, 1, 0), false);
    assert.equal(berry.x, null);
    assert.equal(placeItem(order, cookie, -1, 0), false);
    assert.equal(placeItem(order, cookie, 2, 2), false);
    assert.equal(placeItem(order, cookie, 0.5, 0), false);
    assert.equal(canPlace(order, { ...cookie }, 0, 0), false);
    assert.equal(cookie.x, 0);
    assert.ok(placeItem(order, berry, 2, 0));
    assert.equal(berry.rotated, false);
    assert.equal(isOrderComplete(order), false);
    resetOrder(order);
    assert.ok(order.items.every(i => i.x === null && i.y === null && !i.rotated));
});

test('all products keep their upright catalogue footprint before and after reset', () => {
    for (let i = 0; i < PACKING_PATTERNS.length; i++) {
        const order = createOrder(i);
        const directions = order.items.map(item => item.rotated);
        assert.ok(directions.every(rotated => rotated === false));
        solve(order);
        resetOrder(order);
        assert.deepEqual(order.items.map(item => item.rotated), directions);
        assert.ok(order.items.every(item => item.x === null && item.y === null));
        solve(order);
        assert.ok(isOrderComplete(order));
    }
});

test('any valid solution is accepted, not only the authored answer', () => {
    const order = createOrder(0);
    const find = id => order.items.find(i => i.id === id);
    assert.ok(placeItem(order, find('A'), 1, 1));
    assert.ok(placeItem(order, find('E'), 0, 1));
    assert.ok(placeItem(order, find('F'), 0, 0));
    assert.ok(placeItem(order, find('I'), 2, 0));
    assert.ok(isOrderComplete(order));
});

test('three-order sessions never repeat patterns and cannot finish twice or finish early', () => {
    for (let n = 0; n < 50; n++) {
        const session = createSession();
        assert.equal(session.orders.length, 3);
        assert.equal(new Set(session.orders.map(o => o.patternIndex)).size, 3);
        assert.equal(finishOrder(session), false);
        for (let i = 0; i < 3; i++) {
            solve(session.orders[i]);
            assert.ok(finishOrder(session));
            assert.equal(session.completed, i + 1);
            assert.equal(finishOrder(session), false);
            session.awaitingNext = false;
        }
        assert.equal(finishOrder(session), false);
    }
});
