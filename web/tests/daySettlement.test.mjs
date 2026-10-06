import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';

marketEngine.stopEngine();
const source = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const nextDayMethod = source.match(/    nextDay\(\) \{[\s\S]*?(?=\n    openSettlement\(\))/)[0];

test('developer day advance opens settlement at day 7 and repeated clicks preserve day and rewards', () => {
    const engine = new MarketEngine();
    engine.stopEngine();
    let advances = 0;
    let settlements = 0;
    let toasts = 0;
    const context = vm.createContext({ marketEngine: engine, toastManager: { show() { toasts++; } } });
    const app = vm.runInContext(`({ ${nextDayMethod} })`, context);
    Object.assign(app, {
        itemEngine: { advanceDay() { advances++; } },
        itemGameplay: { sync() {} },
        openSettlement() { settlements++; assert.equal(engine.day, 7); }
    });
    for (let i = 0; i < 5; i++) app.nextDay();
    assert.equal(engine.day, 6);
    assert.equal(settlements, 0);
    assert.equal(toasts, 5);
    app.nextDay();
    assert.equal(settlements, 1);
    assert.equal(advances, 6);
    const finalState = engine.getState();
    app.nextDay();
    engine.nextDay();
    assert.equal(settlements, 2);
    assert.equal(advances, 6);
    assert.equal(toasts, 5);
    assert.deepEqual(engine.getState(), finalState);
    engine.reset();
    engine.stopEngine();
    assert.equal(engine.day, 1);
    app.nextDay();
    assert.equal(engine.day, 2);
});
