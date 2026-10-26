import test from 'node:test';
import assert from 'node:assert/strict';
import { nearBankCounter } from '../js/app/exhibition/BankTalk.js';

test('Chagok can be addressed from the customer side, not the entry or staff side', () => {
    assert(nearBankCounter(0, 90));
    assert(nearBankCounter(-80, 100));
    assert(!nearBankCounter(0, 235));
    assert(!nearBankCounter(0, -103));
    assert(!nearBankCounter(250, 100));
});
