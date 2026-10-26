import test from 'node:test';
import assert from 'node:assert/strict';
import { ScheduledNews, nextNewsSlot, NEWS_HOURS } from '../js/engine/ScheduledNews.js';
import { CURRENT_NEWS } from '../js/data/newsCatalog.js';

const at = (day, hour, minute = 0, second = 0) => new Date(2026, 9, day, hour, minute, second).getTime();
const feed = (now, options = {}) => new ScheduledNews(CURRENT_NEWS, { now, random: () => 0, ...options });

test('only the five device-local wall-clock boundaries publish, newest first', () => {
    const news = feed(at(26, 8));
    assert.deepEqual(NEWS_HOURS, [9, 12, 15, 18, 21]);
    assert.equal(news.sync(at(26, 8, 59, 59)), false);
    for (const [i, hour] of NEWS_HOURS.entries()) {
        assert.equal(news.sync(at(26, hour)), true);
        assert.equal(news.read().length, i + 1);
        assert.equal(news.read()[0].publishedAt, at(26, hour));
        assert.equal(news.sync(at(26, hour)), false);
        assert.equal(news.sync(at(26, hour, 59)), false);
    }
    assert.equal(nextNewsSlot(at(26, 21)), at(27, 9));
});

test('first visit includes only already elapsed slots today, never all manuscripts', () => {
    const news = feed(at(26, 14));
    news.sync(at(26, 14));
    assert.deepEqual(news.read().map(item => item.publishedAt), [at(26, 12), at(26, 9)]);
    assert.ok(news.read().every(item => item.time !== '소식 모음'));
});

test('reload preserves choices and deadlines; missed slots catch up once with original timestamps', () => {
    const news = feed(at(26, 8));
    news.sync(at(26, 12));
    const saved = news.snapshot();
    const resumed = feed(at(27, 16), { saved, random: () => 0.99 });
    resumed.sync(at(27, 16));
    assert.equal(resumed.read().length, 8);
    assert.deepEqual(resumed.read().slice(-2), news.read());
    const count = resumed.read().length;
    resumed.sync(at(27, 16));
    assert.equal(resumed.read().length, count);
});

test('clock rollback does not issue the same local slot twice', () => {
    const news = feed(at(26, 8));
    news.sync(at(26, 12));
    const before = news.snapshot();
    news.sync(at(26, 8));
    news.sync(at(26, 12));
    assert.deepEqual(news.snapshot(), before);
});

test('random pool does not repeat until all 288 manuscripts have been used', () => {
    const news = feed(at(26, 8));
    let time = at(26, 8);
    const ids = [];
    for (let i = 0; i < 288; i++) {
        time = nextNewsSlot(time);
        news.sync(time);
        ids.push(news.read()[0].articleId);
    }
    assert.equal(new Set(ids).size, 288);
    time = nextNewsSlot(time);
    news.sync(time);
    assert.equal(news.read().length, 288);
    assert.equal(new Set(news.read().map(item => item.id)).size, 288);
});

test('random selection uses the remaining pool and does not mutate manuscripts', () => {
    const before = JSON.stringify(CURRENT_NEWS);
    const low = feed(at(26, 8));
    const high = feed(at(26, 8), { random: () => 0.999 });
    low.sync(at(26, 9)); high.sync(at(26, 9));
    assert.notEqual(low.read()[0].articleId, high.read()[0].articleId);
    const item = low.read()[0];
    const original = CURRENT_NEWS.find(article => article.id === item.articleId);
    assert.deepEqual(item.body, original.body);
    assert.equal(item.title, original.title);
    assert.equal('impact' in item, false);
    item.body[0] = 'modified reader copy';
    assert.equal(JSON.stringify(CURRENT_NEWS), before);
});

test('invalid save falls back to current-day slots without affecting other saves', () => {
    const news = feed(at(26, 10), { saved: { version: 1, cursor: 'broken' } });
    news.sync(at(26, 10));
    assert.equal(news.read().length, 1);
});
