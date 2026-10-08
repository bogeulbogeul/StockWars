import test from 'node:test';
import assert from 'node:assert/strict';
import { passRemaining, LogisticsPassPopup } from '../js/components/LogisticsPassPopup.js';

test('pass remaining time rounds up and handles exact expiry', () => {
    assert.equal(passRemaining(86400000, 0), '1일 0분');
    assert.equal(passRemaining(3660000, 0), '1시간 1분');
    assert.equal(passRemaining(1, 0), '1분');
    assert.equal(passRemaining(0, 0), '만료');
});

test('only successful pass uses open the pass notice', () => {
    let opened = 0;
    const popup = { open: () => opened++ };
    assert.equal(LogisticsPassPopup.prototype.showResult.call(popup, { success: false, logisticsPass: {} }), false);
    assert.equal(LogisticsPassPopup.prototype.showResult.call(popup, { success: true }), false);
    assert.equal(LogisticsPassPopup.prototype.showResult.call(popup, { success: true, logisticsPass: { until: 10 } }), true);
    assert.equal(opened, 1);
});
