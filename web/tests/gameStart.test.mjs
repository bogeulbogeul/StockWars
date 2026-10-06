import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const method = source.match(/    startGame\(mode\) \{[\s\S]*?(?=\n    showTitleScreen\(\))/)[0];

for (const mode of ['NEW', 'DEMO', 'DEV']) {
    test(`${mode} starts fresh in the office with Anna grant pending`, () => {
        const market = { cash: 5000000, initialCash: 5000000, day: 7,
            portfolio: new Map([['old', {}]]), firstTradeLesson: {}, isLevel10Unlocked: true, notify() {} };
        const classes = new Set(['phone-view-active']);
        const context = vm.createContext({ marketEngine: market, toastManager: { show() {} },
            document: { body: { classList: { add: x => classes.add(x), remove: x => classes.delete(x) } } } });
        const app = vm.runInContext(`({ ${method} })`, context);
        let resets = 0, syncs = 0, entries = 0, toolbar = false, favoritesSaved = false;
        Object.assign(app, {
            annaTutorial: { lessonEnabled: true },
            itemGameplay: { reset() { resets++; }, sync() { syncs++; } },
            topDemoBar: { show() { toolbar = true; }, hide() { toolbar = false; }, txtFrameToggle: {} },
            logisticsMiniGame: { completedJobsCount: 4 },
            smartphoneUI: { favorites: new Set(['old']), saveFavorites() { favoritesSaved = true; } },
            enterOffice() { entries++; }
        });
        app.startGame(mode);
        assert.equal(market.cash, 0);
        assert.equal(market.initialCash, 0);
        assert.equal(market.day, 1);
        assert.equal(market.portfolio.size, 0);
        assert.equal(market.firstTradeLesson, null);
        assert.equal(market.isLevel10Unlocked, false);
        assert.equal(resets, 1);
        assert.equal(syncs, 1);
        assert.equal(entries, 1);
        assert.equal(toolbar, mode !== 'NEW');
        assert.equal(classes.has('phone-minimized'), true);
        assert.equal(classes.has('phone-view-active'), false);
        assert.equal(app.logisticsMiniGame.completedJobsCount, 0);
        assert.equal(app.smartphoneUI.favorites.size, 0);
        assert.equal(favoritesSaved, true);
        assert.equal(app.annaTutorial.lessonEnabled, false);
    });
}
