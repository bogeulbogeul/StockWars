import test from 'node:test';
import assert from 'node:assert/strict';
import { grantDiary, saveDiary } from '../js/app/DiarySave.js';

test('diary is granted once with no monetary mutation', () => {
    const app = { userProfile: {}, cash: 2000 };
    assert.equal(grantDiary(app), true);
    assert.equal(grantDiary(app), false);
    assert.equal(app.cash, 2000);
});

test('save must succeed before desktop quit; ended demo cannot save', async () => {
    let quits = 0;
    globalThis.window = { stockWarsDesktop: { quit: async () => { quits++; return {}; } } };
    const app = { userProfile: { diaryReceived: true, diarySavedAt: 'previous' }, itemGameplay: { save: () => false } };
    try {
        assert.ok((await saveDiary(app, true)).error);
        assert.equal(quits, 0);
        assert.equal(app.userProfile.diarySavedAt, 'previous');
        app.itemGameplay.save = () => true;
        await saveDiary(app, true);
        assert.equal(quits, 1);
        assert.ok(Number.isFinite(Date.parse(app.userProfile.diarySavedAt)));
        app.demoEnded = true;
        assert.ok((await saveDiary(app, true)).error);
        assert.equal(quits, 1);
    } finally { delete globalThis.window; }
});
