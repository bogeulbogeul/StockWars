import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/app/WorldNavigation.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const worldNavigation', 'globalThis.worldNavigation');

test('town appears only after server accepts entry, office departure releases membership', async () => {
    let accepted = false;
    let shown = false;
    let left = false;
    const bridge = {
        claimNickname: async () => ({ snapshot: {} }),
        join: async () => accepted ? { snapshot: { channels: [{id: 'town-1', name: '타운 1'}], currentChannelId: 'town-1', ping: 8 } } : { error: 'offline' },
        leave: async () => { left = true; }
    };
    const context = vm.createContext({ window: { stockWarsPresence: bridge },
        document: { body: { classList: { add() {}, remove() {} } } }, toastManager: { show() {} } });
    vm.runInContext(source, context);
    const app = { ...context.worldNavigation, townStage: { show(server) { shown = server.id; }, hide() {} },
        officeStage: { show() {}, hide() {} }, serverSelectModal: { close() {}, applyPresence() {} } };
    assert.equal(await app.enterTown(), false);
    assert.equal(shown, false);
    accepted = true;
    assert.equal(await app.enterTown(), true);
    assert.equal(shown, 'town-1');
    app.enterOffice();
    assert.equal(left, true);
});
