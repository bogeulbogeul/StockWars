import test from 'node:test';
import assert from 'node:assert/strict';
import { getBillboardBroadcast, formatCipherIndex } from '../js/components/town/TownBillboardBroadcast.js';

const ads = [{ type: 'ad', badge: '광고', text: '상점 광고' }];
const news = [{ type: '찌라시', title: '미확인 소문' }, { type: '뉴스', title: '공식 뉴스' }];
const at = (h, m, s = 0) => new Date(2026, 8, 27, h, m, s);

test('each scheduled broadcast lasts exactly five minutes', () => {
    for (const hour of [8, 11, 14, 17, 20]) {
        assert.equal(getBillboardBroadcast(at(hour - 1, 59, 59), news, ads).title, 'TOWN AD');
        assert.equal(getBillboardBroadcast(at(hour, 0), news, ads).text, '공식 뉴스');
        assert.equal(getBillboardBroadcast(at(hour, 4, 59), news, ads).title, 'LIVE NEWS');
        assert.equal(getBillboardBroadcast(at(hour, 5), news, ads).text, '상점 광고');
    }
    for (const hour of [0, 7, 9, 10, 21, 23]) {
        assert.equal(getBillboardBroadcast(at(hour, 0), news, ads).title, 'TOWN AD');
    }
});

test('news rotates and never promotes rumors or ads during a news slot', () => {
    const feed = [...news, { type: '공시', title: '기업 공시' }];
    assert.equal(getBillboardBroadcast(at(8, 0, 8), feed, ads).text, '기업 공시');
    assert.equal(getBillboardBroadcast(at(8, 0), [], ads).text, '현재 발표된 뉴스가 없습니다.');
});

test('ticker uses live index values with correct change signs', () => {
    assert.equal(formatCipherIndex({val: '2485.12', diffPct: 1.42}), '사이퍼 지수 2,485.12 pts  ▲ +1.42%');
    assert.match(formatCipherIndex({val: '2450.00', diffPct: -1.2}), /▼ -1.20%$/);
    assert.match(formatCipherIndex({val: '2485.12', diffPct: 0}), /  0.00%$/);
});
