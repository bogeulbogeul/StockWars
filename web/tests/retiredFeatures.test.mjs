import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { TOWN_BUILDINGS } from '../js/data/townWorldData.js';
import { SIDE_QUESTS } from '../js/data/sideQuests.js';
import { VIVIAN_SHOP_CATALOG } from '../js/data/vivianStoreData.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';

const base = fileURLToPath(new URL('../js/', import.meta.url));
test('production module graph resolves without retired screens or warehouse modules', () => {
    const visited = new Set();
    function visit(file) {
        if (visited.has(file)) return;
        visited.add(file);
        assert.ok(fs.existsSync(file), file);
        assert.doesNotMatch(file, /components[\\/]TitleScreen|TopDemoBar|DeveloperFriend|Logistics|WarehouseGeometry/);
        const source = fs.readFileSync(file, 'utf8');
        for (const [, relative] of source.matchAll(/(?:from\s+|import\s*\(?)["'](\.[^"']+)["']/g)) {
            visit(path.resolve(path.dirname(file), relative.split('?')[0]));
        }
    }
    visit(path.join(base, 'main.js'));
    assert.ok(visited.size > 100);
});

test('warehouse, contracts and passes are absent from active content', () => {
    assert.equal(TOWN_BUILDINGS.some(b => b.id === 'bit_logistics'), false);
    assert.equal(SIDE_QUESTS.some(q => q.giver === 'park'), false);
    assert.equal(VIVIAN_SHOP_CATALOG.some(i => i.id.startsWith('item_logistics')), false);
    const steps = buildAnnaScenario({});
    assert.equal(steps.some(s => /logistics/.test(s.id)), false);
    assert.equal(steps.at(-1).id, 'tutorial_completed');
    assert.equal(steps[steps.findIndex(s => s.id === 'server_enter') + 1].id, 'stock_basics_budget');
});

test('old pass ownership survives but cannot activate or pay out', () => {
    const engine = new ItemEngine({ market: { cash: 100 } });
    engine.state.inventory.push({ id: 'item_logistics_quickpass_1d', quantity: 1, category: 'consumable' });
    const before = JSON.stringify(engine.state.inventory);
    assert.equal(engine.use('item_logistics_quickpass_1d').success, false);
    assert.equal(JSON.stringify(engine.state.inventory), before);
    assert.equal(engine.quickJob, undefined);
    assert.equal(engine.addDeveloperLevel, undefined);
});

function actions() {
    const source = fs.readFileSync(path.join(base, 'app/ApplicationActions.js'), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace('export const applicationActions =', 'globalThis.actions =');
    const localModes = [];
    const context = vm.createContext({ window: { stockWarsPresence: { setLocalMode: async local => localModes.push(local) } } });
    vm.runInContext(source, context);
    return { actions: context.actions, localModes };
}
test('entry opens registration without a save and resumes existing saves directly', async () => {
    const { actions: app, localModes } = actions();
    let opened, resumed;
    app.characterCreation = { open(mode) { opened = mode; } };
    app.smartphoneUI = app.officeStage = app.townStage = { updateUserProfile() {} };
    app.startGame = async mode => { resumed = mode; };
    await app.enterGame();
    assert.equal(opened, 'NEW');
    app.userProfile = { nickname: '기존 주민', mode: 'DEV' };
    await app.enterGame();
    assert.equal(resumed, 'CONTINUE');
    assert.equal(app.isLocalSession, false);
    assert.deepEqual(localModes, [false, false]);
    assert.equal(app.userProfile.mode, 'DEV', 'saved historical data is preserved');
});
test('retired developer start modes are rejected before changing game state', async () => {
    const { actions: app } = actions();
    await assert.rejects(() => app.startGame('DEV'), /지원하지/);
    await assert.rejects(() => app.startGame('DEMO'), /지원하지/);
});
